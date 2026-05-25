"""Add Switch 2 platform + seed Switch 2 Editions and Hyrule Warriors: Age of Imprisonment.

IGDB / Twitch / cover values were captured via backend/scripts/fetch_igdb_metadata.py
at migration-authoring time. HLTB had no entries yet for the two Switch 2 Editions —
re-run the GameAdmin "Refresh IGDB + HLTB metadata for selected games" action later
to backfill those.
"""
from django.db import migrations, models


NEW_GAMES = [
    # (title, platform, layout_type, default_play_minutes, release_year,
    #  igdb_id, twitch_game_id, hltb_id, cover_url)
    ('The Legend of Zelda: Breath of the Wild — Nintendo Switch 2 Edition', 'Switch2', '16x9', 3000, 2025,
     '338072', '614192120', '', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9oy.jpg'),
    ('The Legend of Zelda: Tears of the Kingdom — Nintendo Switch 2 Edition', 'Switch2', '16x9', 3600, 2025,
     '338073', '1981388235', '', 'https://images.igdb.com/igdb/image/upload/t_cover_big/coav5n.jpg'),
    ('Hyrule Warriors: Age of Imprisonment', 'Switch2', '16x9', 1500, 2025,
     '338085', '1890919318', '166254', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9n1.jpg'),
]


def seed_new_games(apps, schema_editor):
    Game = apps.get_model('api', 'Game')
    for title, platform, layout, minutes, year, igdb_id, twitch_id, hltb_id, cover in NEW_GAMES:
        Game.objects.update_or_create(
            title=title,
            defaults={
                'platform': platform,
                'layout_type': layout,
                'default_play_minutes': minutes,
                'release_year': year,
                'igdb_id': igdb_id,
                'twitch_game_id': twitch_id,
                'hltb_id': hltb_id,
                'box_art_url': cover,
            },
        )


def unseed_new_games(apps, schema_editor):
    Game = apps.get_model('api', 'Game')
    Game.objects.filter(title__in=[row[0] for row in NEW_GAMES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_audiotrack'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='platform',
            field=models.CharField(
                choices=[
                    ('NES', 'NES'),
                    ('SNES', 'SNES'),
                    ('N64', 'N64'),
                    ('GC', 'GameCube'),
                    ('Wii', 'Wii'),
                    ('WiiU', 'Wii U'),
                    ('Switch', 'Switch'),
                    ('Switch2', 'Switch 2'),
                    ('GB', 'Game Boy'),
                    ('GBC', 'Game Boy Color'),
                    ('GBA', 'Game Boy Advance'),
                    ('DS', 'Nintendo DS'),
                    ('3DS', 'Nintendo 3DS'),
                    ('Other', 'Other'),
                ],
                max_length=20,
            ),
        ),
        migrations.RunPython(seed_new_games, unseed_new_games),
    ]
