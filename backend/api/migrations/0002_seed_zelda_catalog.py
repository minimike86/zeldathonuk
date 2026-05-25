"""Seed the canonical Legend of Zelda catalogue into the Game table.

Covers the main series, major remakes/HD ports, and Hyrule Warriors / Cadence
spinoffs. CD-i and Satellaview titles are intentionally omitted. `default_play_minutes`
is a rough "any%-ish main story" estimate — overridden per-run via ScheduleEntry.

IGDB / HLTB / Twitch identifiers and cover URLs come from a one-off
backend/scripts/fetch_igdb_metadata.py run. For ongoing refreshes (e.g. after
editing a row in admin), use the "Refresh IGDB + HLTB metadata for selected games"
GameAdmin action.
"""
from django.db import migrations


# (title, platform, layout_type, default_play_minutes, release_year,
#  igdb_id, twitch_game_id, hltb_id, cover_url)
CATALOGUE = [
    # ── Main series ──────────────────────────────────────────────────────────
    ('The Legend of Zelda',                              'NES',    '4x3',       360,  1986,
     '1022', '10979', '10025', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1uii.jpg'),
    ('Zelda II: The Adventure of Link',                  'NES',    '4x3',       420,  1987,
     '1025', '14890', '11533', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1uje.jpg'),
    ('The Legend of Zelda: A Link to the Past',          'SNES',   '4x3',       600,  1991,
     '1026', '9435', '10028', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3vzn.jpg'),
    ("The Legend of Zelda: Link's Awakening",            'GB',     '4x3',       480,  1993,
     '1028', '3337', '66255', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3nnt.jpg'),
    ("The Legend of Zelda: Link's Awakening DX",         'GBC',    '4x3',       480,  1998,
     '1027', '8144', '10033', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4o47.jpg'),
    ('The Legend of Zelda: Ocarina of Time',             'N64',    '4x3',       960,  1998,
     '1029', '11557', '10035', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3nnx.jpg'),
    ("The Legend of Zelda: Majora's Mask",               'N64',    '4x3',       960,  2000,
     '1030', '12482', '10034', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3pah.jpg'),
    ('The Legend of Zelda: Oracle of Seasons',           'GBC',    '4x3',       600,  2001,
     '1032', '5406', '10039', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2tw0.jpg'),
    ('The Legend of Zelda: Oracle of Ages',              'GBC',    '4x3',       600,  2001,
     '1041', '7335', '10038', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co2tw1.jpg'),
    ('The Legend of Zelda: Four Swords',                 'GBA',    '4x3',       180,  2002,
     '163572', '1264025714', '10029', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5w9w.jpg'),
    ('The Legend of Zelda: The Wind Waker',              'GC',     '4x3',       1080, 2002,
     '1033', '16967', '10045', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3ohz.jpg'),
    ('The Legend of Zelda: Four Swords Adventures',      'GC',     'fsa-split', 600,  2004,
     '1034', '7200', '10030', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9xf.jpg'),
    ('The Legend of Zelda: The Minish Cap',              'GBA',    '4x3',       720,  2004,
     '1035', '5635', '10044', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3nsk.jpg'),
    ('The Legend of Zelda: Twilight Princess',           'GC',     '4x3',       1800, 2006,
     '1036', '17828', '10046', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3mtv.jpg'),
    ('The Legend of Zelda: Twilight Princess (Wii)',     'Wii',    '4x3',       1800, 2006,
     '134014', '', '10046', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3w1h.jpg'),
    ('The Legend of Zelda: Phantom Hourglass',           'DS',     'ds-both',   720,  2007,
     '1037', '3359', '10041', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3ocu.jpg'),
    ('The Legend of Zelda: Spirit Tracks',               'DS',     'ds-both',   900,  2009,
     '1038', '23195', '10043', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3oj6.jpg'),
    ('The Legend of Zelda: Skyward Sword',               'Wii',    '16x9',      1860, 2011,
     '534', '24324', '10042', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5wrj.jpg'),
    ('The Legend of Zelda: A Link Between Worlds',       '3DS',    '3ds',       840,  2013,
     '2909', '369088', '12965', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p0j.jpg'),
    ('The Legend of Zelda: Tri Force Heroes',            '3DS',    '3ds',       600,  2015,
     '11194', '490388', '30592', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p1a.jpg'),
    ('The Legend of Zelda: Breath of the Wild',          'Switch', '16x9',      3000, 2017,
     '7346', '110758', '38019', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p2d.jpg'),
    ('The Legend of Zelda: Tears of the Kingdom',        'Switch', '16x9',      3600, 2023,
     '119388', '512998', '72589', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co5vmg.jpg'),
    ('The Legend of Zelda: Echoes of Wisdom',            'Switch', '16x9',      1500, 2024,
     '306149', '1290989747', '152370', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co8d9b.jpg'),

    # ── Remakes & HD ports ───────────────────────────────────────────────────
    ('The Legend of Zelda: Ocarina of Time 3D',          '3DS',    '3ds',       960,  2011,
     '1039', '657649007', '10036', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co600u.jpg'),
    ("The Legend of Zelda: Majora's Mask 3D",            '3DS',    '3ds',       960,  2015,
     '8593', '186889917', '23235', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob9x9.jpg'),
    ('The Legend of Zelda: The Wind Waker HD',           'WiiU',   '16x9',      1080, 2013,
     '2276', '368205', '13142', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3ozi.jpg'),
    ('The Legend of Zelda: Twilight Princess HD',        'WiiU',   '16x9',      1800, 2016,
     '18017', '491327', '33835', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3mqa.jpg'),
    ("The Legend of Zelda: Link's Awakening (Switch)",   'Switch', '16x9',      540,  2019,
     '115284', '25487575', '66255', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1qve.jpg'),
    ('The Legend of Zelda: Skyward Sword HD',            'Switch', '16x9',      1800, 2021,
     '143614', '1829367372', '88748', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob8lb.jpg'),
    ('The Legend of Zelda: A Link to the Past & Four Swords', 'GBA', '4x3',     600,  2002,
     '77336', '', '52711', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3nsh.jpg'),

    # ── Spinoffs ─────────────────────────────────────────────────────────────
    ("Link's Crossbow Training",                         'Wii',    '16x9',      180,  2008,
     '4973', '988', '5309', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3ocw.jpg'),
    ('Hyrule Warriors',                                  'WiiU',   '16x9',      1500, 2014,
     '5314', '418067', '21021', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co3p0r.jpg'),
    ('Hyrule Warriors Legends',                          '3DS',    '3ds',       1500, 2016,
     '95048', '', '35808', 'https://images.igdb.com/igdb/image/upload/t_cover_big/co4mxs.jpg'),
    ('Hyrule Warriors: Definitive Edition',              'Switch', '16x9',      1500, 2018,
     '81147', '1460681135', '52431', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob2j6.jpg'),
    ('Hyrule Warriors: Age of Calamity',                 'Switch', '16x9',      1200, 2020,
     '138343', '519545', '82895', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob22n.jpg'),
    ('Cadence of Hyrule',                                'Switch', '16x9',      300,  2019,
     '116419', '511968', '65732', 'https://images.igdb.com/igdb/image/upload/t_cover_big/cob88s.jpg'),
]


def seed_games(apps, schema_editor):
    Game = apps.get_model('api', 'Game')
    for title, platform, layout, minutes, year, igdb_id, twitch_id, hltb_id, cover in CATALOGUE:
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


def unseed_games(apps, schema_editor):
    Game = apps.get_model('api', 'Game')
    Game.objects.filter(title__in=[row[0] for row in CATALOGUE]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_games, unseed_games),
    ]
