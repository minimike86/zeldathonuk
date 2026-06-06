"""`python manage.py seed_walkthroughs` — seed per-game objective
walkthroughs (and the items those objectives reference) for the scheduled
games, mirroring the hand-built A Link to the Past list.

Idempotent: upserts by (game, name, group) for both GameObjective and
GameItem — matching their unique_together — so re-running refreshes
order / category / links instead of duplicating rows. Item-get objectives
auto-create the item they link to (in the same group) when it doesn't
already exist, so the data module is mostly objective-focused.

Data lives in `_walkthrough_data.py` as WALKTHROUGHS: {title: spec}, where
spec = {
    'items': [ {name, category?, group?, image?}, ... ],   # optional extras
    'chapters': [ {group, objectives: [
        {name, category, item?},   # item = linked GameItem name (item-get)
    ]}, ... ],
}

Flags:
  --game "Ocarina"   only seed games whose title contains this substring.
  --wipe             delete existing objectives for each seeded game first
                     (does NOT touch items / per-run collected state).
"""
from __future__ import annotations

from django.core.management.base import BaseCommand

from api import models

from ._walkthrough_data import WALKTHROUGHS


class Command(BaseCommand):
    help = 'Seed objective walkthroughs + linked items for scheduled games. Idempotent.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--game', type=str, default='',
            help='Only seed games whose title contains this substring (case-insensitive).',
        )
        parser.add_argument(
            '--wipe', action='store_true',
            help='Delete existing objectives for each seeded game before seeding.',
        )

    def handle(self, *args, **opts):
        only = (opts.get('game') or '').lower()
        wipe = opts.get('wipe')
        total_obj = total_item = seeded_games = 0

        for title, spec in WALKTHROUGHS.items():
            if only and only not in title.lower():
                continue
            game = models.Game.objects.filter(title=title).first()
            if not game:
                self.stdout.write(self.style.WARNING(f'! No game titled {title!r} — skipped'))
                continue
            seeded_games += 1
            self.stdout.write(self.style.MIGRATE_HEADING(f'\n{title}'))
            if wipe:
                models.GameObjective.objects.filter(game=game).delete()

            item_order = [0]

            def ensure_item(name: str, category: str = 'key-item', group: str = '',
                            image: str = '') -> models.GameItem:
                defaults = {'category': category, 'order': item_order[0]}
                if image:
                    defaults['image_url'] = image
                obj, new = models.GameItem.objects.update_or_create(
                    game=game, name=name, group=group, defaults=defaults,
                )
                item_order[0] += 1
                nonlocal total_item
                if new:
                    total_item += 1
                return obj

            # Explicit extra items (art / non-objective collectibles).
            for it in spec.get('items', []):
                ensure_item(
                    it['name'], it.get('category', 'key-item'),
                    it.get('group', ''), it.get('image', ''),
                )

            # A re-release/remake can clone another game's objectives straight
            # from the DB via `copy_from` (works for hand-built games like
            # ALttP too), then append its own extra chapters.
            chapters = []
            src_title = spec.get('copy_from')
            if src_title:
                src = models.Game.objects.filter(title=src_title).first()
                if not src:
                    self.stdout.write(self.style.WARNING(
                        f'  ! copy_from source {src_title!r} not found — nothing copied'))
                else:
                    from collections import OrderedDict
                    buckets: OrderedDict = OrderedDict()
                    for so in src.objectives.order_by('order', 'name'):
                        buckets.setdefault(so.group, []).append(so)
                    for grp, sobjs in buckets.items():
                        chapters.append({'group': grp, 'objectives': [
                            {
                                'name': so.name,
                                'category': so.category,
                                **({'item': so.linked_item.name} if so.linked_item_id else {}),
                            }
                            for so in sobjs
                        ]})
            chapters += spec.get('chapters', [])

            obj_order = 0
            for chapter in chapters:
                grp = chapter['group']
                for o in chapter['objectives']:
                    cat = o.get('category', 'story')
                    linked = None
                    iname = o.get('item')
                    if iname:
                        # Prefer an item already in this chapter's group, else any
                        # same-named item, else create one in this group.
                        linked = (
                            models.GameItem.objects.filter(game=game, name=iname, group=grp).first()
                            or models.GameItem.objects.filter(game=game, name=iname).first()
                            or ensure_item(iname, 'key-item', grp)
                        )
                    _, new = models.GameObjective.objects.update_or_create(
                        game=game, name=o['name'], group=grp,
                        defaults={'category': cat, 'order': obj_order, 'linked_item': linked},
                    )
                    obj_order += 1
                    if new:
                        total_obj += 1

        self.stdout.write(self.style.SUCCESS(
            f'\nDone. {seeded_games} game(s): objectives +{total_obj}, items +{total_item}.'
        ))
