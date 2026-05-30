"""Per-game objective walkthrough data for `seed_walkthroughs`.

WALKTHROUGHS maps a Game.title to a spec:

    {
      'items': [ {name, category?, group?, image?}, ... ],   # optional extras
      'chapters': [
        {'group': 'Chapter name', 'objectives': [
            {'name': '...', 'category': 'item-get'|'story'|'dungeon'|'boss'|'side-quest',
             'item': 'Linked GameItem name'},   # 'item' only for item-get
        ]},
      ],
    }

Categories mirror the ALttP set the operator built by hand. Item-get
objectives carry `item`, the GameItem they complete (auto-created in the
same group if missing). Dungeon staples (Map/Compass/Small Key/Big Key)
repeat per dungeon group — allowed because items are unique per
(game, name, group).

These are best-effort route walkthroughs assembled from general game
knowledge; they are meant as an editable starting point, not a verified
speedrun route.
"""
from __future__ import annotations


# Shorthands to keep the data terse.
def ig(name, item, group_item=None):
    """item-get objective. `item` = linked GameItem name."""
    return {'name': name, 'category': 'item-get', 'item': item}


def st(name):
    return {'name': name, 'category': 'story'}


def dn(name):
    return {'name': name, 'category': 'dungeon'}


def bo(name):
    return {'name': name, 'category': 'boss'}


def sq(name):
    return {'name': name, 'category': 'side-quest'}


WALKTHROUGHS: dict[str, dict] = {}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Ocarina of Time
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Ocarina of Time'] = {
    'chapters': [
        {'group': 'Chapter 1 – Kokiri Forest', 'objectives': [
            st('Wake up and speak to Saria; meet the fairy Navi.'),
            ig('Buy a Deku Shield from the Kokiri Shop.', 'Deku Shield'),
            ig('Collect the Kokiri Sword from the training-ground maze.', 'Kokiri Sword'),
            st('Show Mido your sword and shield to pass to the Deku Tree.'),
        ]},
        {'group': 'Chapter 2 – Inside the Deku Tree', 'objectives': [
            dn('Enter the Great Deku Tree.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Fairy Slingshot.', 'Fairy Slingshot'),
            bo('Defeat Queen Gohma.'),
            ig('Receive the Kokiri’s Emerald.', 'Kokiri’s Emerald'),
            st('Leave the forest; Saria gives you the Fairy Ocarina.'),
        ]},
        {'group': 'Chapter 3 – Hyrule Field & Castle', 'objectives': [
            ig('Get the Fairy Ocarina from Saria.', 'Fairy Ocarina'),
            sq('Bring the Weird Egg to a Cucco, wake Talon, and meet Malon.'),
            st('Sneak past the castle guards to the courtyard.'),
            st('Meet Princess Zelda and learn of Ganondorf.'),
            ig('Learn Zelda’s Lullaby from Impa.', 'Zelda’s Lullaby'),
        ]},
        {'group': 'Chapter 4 – Kakariko & Death Mountain', 'objectives': [
            sq('Learn Epona’s Song from Malon at Lon Lon Ranch.', ),
            ig('Learn Epona’s Song.', 'Epona’s Song'),
            st('Show Death Mountain access by speaking to the gate guard.'),
            ig('Get the Goron’s Bracelet from Darunia.', 'Goron’s Bracelet'),
        ]},
        {'group': 'Chapter 5 – Dodongo’s Cavern', 'objectives': [
            dn('Bomb open and enter Dodongo’s Cavern.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Bomb Bag.', 'Bomb Bag'),
            bo('Defeat King Dodongo.'),
            ig('Receive the Goron’s Ruby.', 'Goron’s Ruby'),
        ]},
        {'group': 'Chapter 6 – Zora’s Domain & Jabu-Jabu', 'objectives': [
            ig('Play Zelda’s Lullaby for King Zora to reach Lord Jabu-Jabu.', 'Zora’s Domain Access'),
            sq('Catch a fish in a Bottle to feed Lord Jabu-Jabu.'),
            ig('Obtain the first Bottle.', 'Bottle'),
            dn('Enter Inside Jabu-Jabu’s Belly with Princess Ruto.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Boomerang.', 'Boomerang'),
            bo('Defeat Barinade.'),
            ig('Receive the Zora’s Sapphire from Ruto.', 'Zora’s Sapphire'),
        ]},
        {'group': 'Chapter 7 – The Master Sword', 'objectives': [
            ig('Learn the Song of Time from Zelda (and take the Ocarina of Time).', 'Ocarina of Time'),
            ig('Learn the Song of Time.', 'Song of Time'),
            st('Open the Door of Time with the three Spiritual Stones.'),
            ig('Draw the Master Sword and awaken seven years later.', 'Master Sword'),
        ]},
        {'group': 'Chapter 8 – Awakening as an Adult', 'objectives': [
            st('Meet Sheik in the Temple of Time.'),
            ig('Learn the Prelude of Light.', 'Prelude of Light'),
            ig('Get the Hookshot from Dampé’s grave race in Kakariko.', 'Hookshot'),
        ]},
        {'group': 'Chapter 9 – Forest Temple', 'objectives': [
            ig('Learn the Minuet of Forest from Sheik in the Sacred Forest Meadow.', 'Minuet of Forest'),
            dn('Enter the Forest Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Fairy Bow.', 'Fairy Bow'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Phantom Ganon.'),
            ig('Receive the Forest Medallion.', 'Forest Medallion'),
        ]},
        {'group': 'Chapter 10 – Fire Temple', 'objectives': [
            ig('Learn the Bolero of Fire from Sheik on Death Mountain Crater.', 'Bolero of Fire'),
            sq('Buy the Goron Tunic (or get it from Link the Goron).'),
            ig('Obtain the Goron Tunic.', 'Goron Tunic'),
            dn('Enter the Fire Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Megaton Hammer.', 'Megaton Hammer'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Volvagia.'),
            ig('Receive the Fire Medallion.', 'Fire Medallion'),
        ]},
        {'group': 'Chapter 11 – Ice Cavern & Water Temple', 'objectives': [
            ig('Get the Iron Boots from the Ice Cavern.', 'Iron Boots'),
            ig('Learn the Serenade of Water from Sheik.', 'Serenade of Water'),
            dn('Enter the Water Temple beneath Lake Hylia.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Longshot.', 'Longshot'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Morpha.'),
            ig('Receive the Water Medallion.', 'Water Medallion'),
        ]},
        {'group': 'Chapter 12 – Bottom of the Well & Shadow Temple', 'objectives': [
            ig('As a child, get the Lens of Truth from the Bottom of the Well.', 'Lens of Truth'),
            ig('Learn the Nocturne of Shadow.', 'Nocturne of Shadow'),
            dn('Enter the Shadow Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Hover Boots.', 'Hover Boots'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Bongo Bongo.'),
            ig('Receive the Shadow Medallion.', 'Shadow Medallion'),
        ]},
        {'group': 'Chapter 13 – Gerudo & Spirit Temple', 'objectives': [
            sq('Free the carpenters and earn the Gerudo Membership Card.'),
            ig('Learn the Requiem of Spirit.', 'Requiem of Spirit'),
            ig('As a child, get the Silver Gauntlets in the Spirit Temple.', 'Silver Gauntlets'),
            ig('As an adult, get the Mirror Shield.', 'Mirror Shield'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Twinrova.'),
            ig('Receive the Spirit Medallion.', 'Spirit Medallion'),
        ]},
        {'group': 'Chapter 14 – Ganon’s Castle', 'objectives': [
            ig('Receive the Light Arrows from Zelda.', 'Light Arrows'),
            st('Cross the rainbow bridge into Ganon’s Castle.'),
            st('Clear the six elemental barrier trials.'),
            bo('Defeat Ganondorf atop the castle.'),
            bo('Defeat Ganon.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: The Wind Waker HD
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: The Wind Waker HD'] = {
    'chapters': [
        {'group': 'Chapter 1 – Outset Island', 'objectives': [
            st('Celebrate your birthday and receive the Hero’s Clothes.'),
            ig('Borrow the Telescope from Aryll.', 'Telescope'),
            ig('Train with Orca to earn the Hero’s Sword.', 'Hero’s Sword'),
            ig('Get the Hero’s Shield from Grandma.', 'Hero’s Shield'),
            st('The Helmaroc King kidnaps Aryll; set sail with the pirates.'),
        ]},
        {'group': 'Chapter 2 – Forsaken Fortress (First Visit)', 'objectives': [
            dn('Sneak through the Forsaken Fortress.'),
            st('Be caught by the Helmaroc King and thrown out to sea.'),
            st('Wake aboard the King of Red Lions, your talking boat.'),
            ig('Receive the Wind Waker baton.', 'Wind Waker'),
            ig('Buy a Sail at Windfall Island.', 'Sail'),
            ig('Learn the Wind’s Requiem.', 'Wind’s Requiem'),
        ]},
        {'group': 'Chapter 3 – Dragon Roost Cavern', 'objectives': [
            st('Calm Valoo on Dragon Roost Island and deliver Komali’s letter.'),
            ig('Get the Delivery Bag.', 'Delivery Bag'),
            dn('Enter Dragon Roost Cavern.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Grappling Hook.', 'Grappling Hook'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Gohma.'),
            ig('Receive Din’s Pearl.', 'Din’s Pearl'),
        ]},
        {'group': 'Chapter 4 – Forbidden Woods', 'objectives': [
            st('Reach the Forest Haven and meet the Great Deku Tree.'),
            ig('Get the Deku Leaf.', 'Deku Leaf'),
            dn('Be carried into the Forbidden Woods.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Boomerang.', 'Boomerang'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Kalle Demos.'),
            ig('Receive Farore’s Pearl.', 'Farore’s Pearl'),
        ]},
        {'group': 'Chapter 5 – Nayru’s Pearl & Tower of the Gods', 'objectives': [
            ig('Learn the Ballad of Gales from Cyclos.', 'Ballad of Gales'),
            ig('Borrow Bombs from Tetra’s pirates to reach Jabun.', 'Bombs'),
            ig('Receive Nayru’s Pearl from Jabun.', 'Nayru’s Pearl'),
            st('Place the three Pearls to raise the Tower of the Gods.'),
            dn('Enter the Tower of the Gods.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Hero’s Bow.', 'Hero’s Bow'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Gohdan.'),
        ]},
        {'group': 'Chapter 6 – Hyrule & the Master Sword', 'objectives': [
            st('Descend to Hyrule beneath the sea.'),
            ig('Draw the Master Sword.', 'Master Sword'),
            st('Learn the Master Sword has lost its power.'),
        ]},
        {'group': 'Chapter 7 – Forsaken Fortress (Second Visit)', 'objectives': [
            dn('Return to the Forsaken Fortress.'),
            ig('Get the Skull Hammer.', 'Skull Hammer'),
            bo('Defeat the Helmaroc King.'),
            st('Rescue Aryll and confront Ganondorf; escape with Valoo’s help.'),
        ]},
        {'group': 'Chapter 8 – Earth Temple', 'objectives': [
            ig('Learn the Command Melody.', 'Command Melody'),
            ig('Learn the Earth God’s Lyric.', 'Earth God’s Lyric'),
            ig('Get the Power Bracelets at the Earth Temple entrance.', 'Power Bracelets'),
            dn('Enter the Earth Temple with Medli.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Mirror Shield.', 'Mirror Shield'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Jalhalla.'),
            st('Medli awakens as the Sage of Earth.'),
        ]},
        {'group': 'Chapter 9 – Wind Temple', 'objectives': [
            ig('Learn the Wind God’s Aria.', 'Wind God’s Aria'),
            ig('Get the Iron Boots.', 'Iron Boots'),
            dn('Enter the Wind Temple with Makar.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Hookshot.', 'Hookshot'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Molgera.'),
            st('Makar awakens as the Sage of Wind; the Master Sword’s power returns.'),
        ]},
        {'group': 'Chapter 10 – The Triforce of Courage', 'objectives': [
            sq('Decipher the Triforce Charts (Tingle) and salvage the eight shards.'),
            ig('Assemble the Triforce of Courage.', 'Triforce of Courage'),
        ]},
        {'group': 'Chapter 11 – Ganon’s Tower', 'objectives': [
            st('Storm Ganon’s Tower atop the Forsaken Fortress.'),
            ig('Receive the Light Arrows from Zelda.', 'Light Arrows'),
            bo('Defeat Puppet Ganon.'),
            bo('Defeat Ganondorf.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Twilight Princess HD
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Twilight Princess HD'] = {
    'chapters': [
        {'group': 'Chapter 1 – Ordon Village', 'objectives': [
            ig('Borrow the Wooden Sword and herd the goats.', 'Wooden Sword'),
            ig('Get the Slingshot.', 'Slingshot'),
            ig('Get the Fishing Rod.', 'Fishing Rod'),
            ig('Receive the Ordon Sword and Ordon Shield.', 'Ordon Sword'),
            st('Bandits raid Ordon; Link is pulled into the Twilight as a wolf.'),
        ]},
        {'group': 'Chapter 2 – Faron Twilight', 'objectives': [
            st('Meet Midna and the Light Spirit Faron.'),
            ig('Gather the Tears of Light in the Vessel of Light to restore Faron.', 'Vessel of Light'),
            ig('Receive the Lantern.', 'Lantern'),
        ]},
        {'group': 'Chapter 3 – Forest Temple', 'objectives': [
            dn('Enter the Forest Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Gale Boomerang.', 'Gale Boomerang'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Diababa.'),
            ig('Receive the first Fused Shadow.', 'Fused Shadow'),
        ]},
        {'group': 'Chapter 4 – Eldin Twilight & Kakariko', 'objectives': [
            ig('Restore the Light Spirit Eldin with the Tears of Light.', 'Vessel of Light'),
            st('Help Renado in Kakariko Village and reach Death Mountain.'),
        ]},
        {'group': 'Chapter 5 – Goron Mines', 'objectives': [
            ig('Get the Iron Boots from the Goron elder.', 'Iron Boots'),
            dn('Enter the Goron Mines.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Hero’s Bow.', 'Hero’s Bow'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Fyrus.'),
            ig('Receive the second Fused Shadow.', 'Fused Shadow'),
        ]},
        {'group': 'Chapter 6 – Lanayru Twilight & Lakebed Temple', 'objectives': [
            ig('Restore the Light Spirit Lanayru with the Tears of Light.', 'Vessel of Light'),
            st('Reach Zora’s Domain and clear the path to Lake Hylia.'),
            dn('Enter the Lakebed Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Clawshot.', 'Clawshot'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Morpheel.'),
            ig('Receive the third Fused Shadow.', 'Fused Shadow'),
        ]},
        {'group': 'Chapter 7 – The Master Sword', 'objectives': [
            st('Pursue Zant; lose the Fused Shadows and be cursed as a wolf.'),
            ig('Draw the Master Sword in the Sacred Grove.', 'Master Sword'),
            st('Begin recovering the shards of the Mirror of Twilight.'),
        ]},
        {'group': 'Chapter 8 – Arbiter’s Grounds', 'objectives': [
            dn('Cross the Gerudo Desert and enter the Arbiter’s Grounds.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Spinner.', 'Spinner'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Stallord.'),
            ig('Recover a Mirror Shard.', 'Mirror Shard'),
        ]},
        {'group': 'Chapter 9 – Snowpeak Ruins', 'objectives': [
            dn('Reach Snowpeak and enter the Snowpeak Ruins.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Ball and Chain.', 'Ball and Chain'),
            ig('Acquire the Bedroom Key.', 'Big Key'),
            bo('Defeat Blizzeta.'),
            ig('Recover a Mirror Shard.', 'Mirror Shard'),
        ]},
        {'group': 'Chapter 10 – Temple of Time', 'objectives': [
            dn('Enter the Temple of Time via the Sacred Grove.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Dominion Rod.', 'Dominion Rod'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Armogohma.'),
            ig('Recover a Mirror Shard.', 'Mirror Shard'),
        ]},
        {'group': 'Chapter 11 – City in the Sky', 'objectives': [
            st('Restore the Dominion Rod and reach the City in the Sky.'),
            dn('Enter the City in the Sky.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Double Clawshot.', 'Double Clawshot'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Argorok.'),
            ig('Recover the final Mirror Shard.', 'Mirror Shard'),
        ]},
        {'group': 'Chapter 12 – Palace of Twilight', 'objectives': [
            dn('Restore the Mirror of Twilight and enter the Palace of Twilight.'),
            ig('Recover the Sols to light your sword.', 'Sol'),
            bo('Defeat Zant.'),
        ]},
        {'group': 'Chapter 13 – Hyrule Castle', 'objectives': [
            dn('Storm Hyrule Castle.'),
            bo('Defeat Ganondorf (the final battles).'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Skyward Sword HD
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Skyward Sword HD'] = {
    'chapters': [
        {'group': 'Chapter 1 – Skyloft', 'objectives': [
            st('Win the Wing Ceremony and bond with your Loftwing.'),
            ig('Receive the Goddess Sword from Fi.', 'Goddess Sword'),
            ig('Get the Sailcloth from Zelda.', 'Sailcloth'),
            st('A tornado drags Zelda to the Surface; dive after her.'),
        ]},
        {'group': 'Chapter 2 – Faron Woods & Skyview Temple', 'objectives': [
            ig('Get the Slingshot in Faron Woods.', 'Slingshot'),
            dn('Enter the Skyview Temple.'),
            ig('Get the Beetle.', 'Beetle'),
            ig('Acquire the Dungeon Map.', 'Map'),
            bo('Defeat Ghirahim (first duel).'),
            ig('Obtain the Ruby Tablet.', 'Ruby Tablet'),
        ]},
        {'group': 'Chapter 3 – Eldin Volcano & Earth Temple', 'objectives': [
            dn('Climb Eldin Volcano and enter the Earth Temple.'),
            ig('Get the Bomb Bag.', 'Bomb Bag'),
            ig('Acquire the Dungeon Map.', 'Map'),
            bo('Defeat Scaldera.'),
            ig('Obtain the Amber Tablet.', 'Amber Tablet'),
        ]},
        {'group': 'Chapter 4 – Lanayru Desert & Mining Facility', 'objectives': [
            ig('Get the Goddess’s Harp at the Temple of Time.', 'Goddess’s Harp'),
            dn('Enter the Lanayru Mining Facility.'),
            ig('Get the Gust Bellows.', 'Gust Bellows'),
            ig('Acquire the Dungeon Map.', 'Map'),
            bo('Defeat Moldarach.'),
            ig('Obtain the Emerald Tablet.', 'Emerald Tablet'),
        ]},
        {'group': 'Chapter 5 – Silent Realms & Sacred Flames', 'objectives': [
            sq('Clear the Faron, Eldin and Lanayru Silent Realm trials.'),
            ig('Temper the blade into the Goddess White Sword via the Sacred Flames.', 'Goddess White Sword'),
        ]},
        {'group': 'Chapter 6 – Ancient Cistern', 'objectives': [
            dn('Enter the Ancient Cistern.'),
            ig('Get the Whip.', 'Whip'),
            ig('Acquire the Dungeon Map.', 'Map'),
            bo('Defeat Koloktos.'),
            ig('Claim Farore’s Flame.', 'Farore’s Flame'),
        ]},
        {'group': 'Chapter 7 – Sandship', 'objectives': [
            dn('Board the Sandship in the Lanayru Sand Sea.'),
            ig('Get the Bow.', 'Bow'),
            ig('Acquire the Dungeon Map.', 'Map'),
            bo('Defeat Tentalus.'),
            ig('Claim Nayru’s Flame.', 'Nayru’s Flame'),
        ]},
        {'group': 'Chapter 8 – Fire Sanctuary', 'objectives': [
            dn('Enter the Fire Sanctuary.'),
            ig('Get the Mogma Mitts.', 'Mogma Mitts'),
            ig('Acquire the Dungeon Map.', 'Map'),
            bo('Defeat Ghirahim (second duel).'),
            ig('Claim Din’s Flame.', 'Din’s Flame'),
        ]},
        {'group': 'Chapter 9 – Sky Keep & the Triforce', 'objectives': [
            ig('Get the Clawshots to reach Sky Keep.', 'Clawshots'),
            dn('Solve the shifting rooms of Sky Keep.'),
            ig('Claim the Triforce.', 'Triforce'),
            bo('Destroy The Imprisoned with the Triforce.'),
        ]},
        {'group': 'Chapter 10 – The Final Battle', 'objectives': [
            st('Travel to the past through the Gate of Time.'),
            ig('Forge the Master Sword.', 'Master Sword'),
            bo('Defeat Ghirahim (final duel).'),
            bo('Defeat Demise.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda  (NES)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda'] = {
    'chapters': [
        {'group': 'Overworld – Getting Started', 'objectives': [
            ig('Take the Wooden Sword from the old man’s cave.', 'Wooden Sword'),
            sq('Gather bombs, candles and the Blue Ring as you explore Hyrule.'),
        ]},
        {'group': 'Level 1 – The Eagle', 'objectives': [
            dn('Enter Level 1.'),
            ig('Get the Bow.', 'Bow'),
            bo('Defeat Aquamentus.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 2 – The Moon', 'objectives': [
            dn('Enter Level 2.'),
            ig('Get the Magical Boomerang.', 'Magical Boomerang'),
            bo('Defeat Dodongo.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 3 – The Manji', 'objectives': [
            dn('Enter Level 3.'),
            ig('Get the Raft.', 'Raft'),
            bo('Defeat Manhandla.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 4 – The Snake', 'objectives': [
            dn('Enter Level 4.'),
            ig('Get the Stepladder.', 'Stepladder'),
            bo('Defeat Gleeok.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 5 – The Lizard', 'objectives': [
            dn('Enter Level 5.'),
            ig('Get the Recorder.', 'Recorder'),
            bo('Defeat Digdogger.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 6 – The Dragon', 'objectives': [
            dn('Enter Level 6.'),
            ig('Get the Magical Rod.', 'Magical Rod'),
            bo('Defeat Gohma.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 7 – The Demon', 'objectives': [
            dn('Enter Level 7 (use the Recorder to reveal it).'),
            ig('Get the Red Candle.', 'Red Candle'),
            bo('Defeat the dungeon guardian.'),
            ig('Recover a Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 8 – The Lion', 'objectives': [
            dn('Enter Level 8.'),
            ig('Get the Magical Key.', 'Magical Key'),
            ig('Get the Book of Magic.', 'Book of Magic'),
            bo('Defeat the dungeon guardian.'),
            ig('Recover the final Triforce Shard.', 'Triforce Shard'),
        ]},
        {'group': 'Level 9 – Death Mountain', 'objectives': [
            dn('Assemble the Triforce of Wisdom and enter Level 9.'),
            ig('Get the Silver Arrow.', 'Silver Arrow'),
            bo('Defeat Ganon with the Silver Arrow.'),
            st('Rescue Princess Zelda.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Zelda II: The Adventure of Link
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['Zelda II: The Adventure of Link'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Learn of the sleeping Princess Zelda and the quest for the Triforce of Courage.'),
            st('Set out from the North Castle to place a crystal in each of the six palaces.'),
        ]},
        {'group': 'Magic Spells (Towns)', 'objectives': [
            ig('Learn Shield in Rauru.', 'Shield Spell'),
            ig('Learn Jump in Ruto.', 'Jump Spell'),
            ig('Learn Life in Saria.', 'Life Spell'),
            ig('Learn Fairy in Mido.', 'Fairy Spell'),
            ig('Learn Fire in Nabooru.', 'Fire Spell'),
            ig('Learn Reflect in Darunia.', 'Reflect Spell'),
            ig('Learn Spell in New Kasuto.', 'Spell Spell'),
            ig('Learn Thunder in Old Kasuto.', 'Thunder Spell'),
        ]},
        {'group': 'Palace 1 – Parapa Palace', 'objectives': [
            dn('Enter Parapa Palace.'),
            ig('Get the Candle.', 'Candle'),
            bo('Defeat Horsehead.'),
            st('Place a crystal in the palace statue.'),
        ]},
        {'group': 'Palace 2 – Midoro Palace', 'objectives': [
            dn('Enter Midoro Palace.'),
            ig('Get the Handy Glove.', 'Handy Glove'),
            bo('Defeat Helmethead.'),
            st('Place a crystal in the palace statue.'),
        ]},
        {'group': 'Palace 3 – Island Palace', 'objectives': [
            dn('Enter the Island Palace.'),
            ig('Get the Raft.', 'Raft'),
            bo('Defeat Rebonack.'),
            st('Place a crystal in the palace statue.'),
        ]},
        {'group': 'Palace 4 – Maze Palace', 'objectives': [
            dn('Enter the Maze Palace.'),
            ig('Get the Boots.', 'Boots'),
            bo('Defeat Carock.'),
            st('Place a crystal in the palace statue.'),
        ]},
        {'group': 'Palace 5 – Ocean Palace', 'objectives': [
            dn('Enter the Ocean Palace.'),
            ig('Get the Flute.', 'Flute'),
            bo('Defeat Gooma.'),
            st('Place a crystal in the palace statue.'),
        ]},
        {'group': 'Palace 6 – Three-Eye Rock Palace', 'objectives': [
            dn('Reveal and enter the Three-Eye Rock Palace.'),
            ig('Get the Magical Key.', 'Magical Key'),
            bo('Defeat Barba.'),
            st('Place the final crystal in the palace statue.'),
        ]},
        {'group': 'The Great Palace', 'objectives': [
            dn('Open the path to the Great Palace in the Valley of Death.'),
            bo('Defeat the Thunderbird.'),
            bo('Defeat your Shadow (Dark Link).'),
            ig('Claim the Triforce of Courage.', 'Triforce of Courage'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Oracle of Ages
# (Per-dungeon items/bosses kept conservative; verify before the run.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Oracle of Ages'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Veran possesses Nayru, the Oracle of Ages, and twists time.'),
            ig('Receive the Harp of Ages.', 'Harp of Ages'),
        ]},
        {'group': 'Dungeon 1 – Spirit’s Grave', 'objectives': [
            dn('Enter Spirit’s Grave.'),
            ig('Get the Power Bracelet.', 'Power Bracelet'),
            bo('Defeat Pumpkin Head.'),
            ig('Recover the 1st Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 2 – Wing Dungeon', 'objectives': [
            dn('Enter the Wing Dungeon.'),
            ig('Get Roc’s Feather.', 'Roc’s Feather'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 2nd Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 3 – Moonlit Grotto', 'objectives': [
            dn('Enter the Moonlit Grotto.'),
            ig('Get the Seed Shooter.', 'Seed Shooter'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 3rd Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 4 – Skull Dungeon', 'objectives': [
            dn('Enter the Skull Dungeon.'),
            ig('Get the Switch Hook.', 'Switch Hook'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 4th Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 5 – Crown Dungeon', 'objectives': [
            dn('Enter the Crown Dungeon.'),
            ig('Get the Cane of Somaria.', 'Cane of Somaria'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 5th Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 6 – Mermaid’s Cave', 'objectives': [
            dn('Enter Mermaid’s Cave.'),
            ig('Get the Mermaid Suit.', 'Mermaid Suit'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 6th Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 7 – Jabu-Jabu’s Belly', 'objectives': [
            dn('Enter Jabu-Jabu’s Belly.'),
            ig('Get the Long Hook.', 'Long Hook'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 7th Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Dungeon 8 – Ancient Tomb', 'objectives': [
            dn('Enter the Ancient Tomb.'),
            bo('Defeat Ramrock.'),
            ig('Recover the 8th Essence of Time.', 'Essence of Time'),
        ]},
        {'group': 'Finale – Ambi’s Palace', 'objectives': [
            st('Confront Veran in Queen Ambi’s palace.'),
            bo('Defeat Veran.'),
            bo('Defeat the revived Ganon (if both Oracle games are linked).'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Oracle of Seasons
# (Per-dungeon items/bosses kept conservative; verify before the run.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Oracle of Seasons'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Onox abducts Din, the Oracle of Seasons, throwing the seasons into chaos.'),
            ig('Receive the Rod of Seasons.', 'Rod of Seasons'),
        ]},
        {'group': 'Dungeon 1 – Gnarled Root Dungeon', 'objectives': [
            dn('Enter the Gnarled Root Dungeon.'),
            bo('Defeat Aquamentus.'),
            ig('Recover the 1st Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 2 – Snake’s Remains', 'objectives': [
            dn('Enter Snake’s Remains.'),
            ig('Get the Power Bracelet.', 'Power Bracelet'),
            bo('Defeat Dodongo.'),
            ig('Recover the 2nd Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 3 – Poison Moth’s Lair', 'objectives': [
            dn('Enter Poison Moth’s Lair.'),
            ig('Get Roc’s Feather.', 'Roc’s Feather'),
            bo('Defeat Mothula.'),
            ig('Recover the 3rd Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 4 – Dancing Dragon Dungeon', 'objectives': [
            dn('Enter the Dancing Dragon Dungeon.'),
            ig('Get the Slingshot.', 'Slingshot'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 4th Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 5 – Unicorn’s Cave', 'objectives': [
            dn('Enter the Unicorn’s Cave.'),
            ig('Get the Magnetic Gloves.', 'Magnetic Gloves'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 5th Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 6 – Ancient Ruins', 'objectives': [
            dn('Enter the Ancient Ruins.'),
            ig('Get the Magical Boomerang.', 'Magical Boomerang'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 6th Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 7 – Explorer’s Crypt', 'objectives': [
            dn('Enter the Explorer’s Crypt.'),
            ig('Get Roc’s Cape.', 'Roc’s Cape'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 7th Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Dungeon 8 – Sword & Shield Maze', 'objectives': [
            dn('Enter the Sword & Shield Maze.'),
            bo('Defeat the dungeon boss.'),
            ig('Recover the 8th Essence of Nature.', 'Essence of Nature'),
        ]},
        {'group': 'Finale – Onox’s Castle', 'objectives': [
            st('Storm Onox’s Castle.'),
            bo('Defeat Onox, General of Darkness.'),
            bo('Defeat the revived Ganon (if both Oracle games are linked).'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Hyrule Warriors  (musou — Legend Mode beats, approximate; verify scenario
# names/order before the run.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['Hyrule Warriors'] = {
    'chapters': [
        {'group': 'Prologue – The Era of the Goddess', 'objectives': [
            st('Defend Hyrule Field as Link; the sorceress Cia’s forces invade.'),
            st('Cia tears open the Gate of Souls, scattering the Triforce across eras.'),
        ]},
        {'group': 'Act 1 – The Land Eras', 'objectives': [
            st('The Sealed Sword: clear Faron Woods alongside Lana.'),
            bo('Defeat King Dodongo.'),
            st('Land in the Sky: fight through the Sky era (Skyward Sword).'),
            bo('Defeat Ghirahim.'),
            st('Eldin Caves: hold the line against the monster horde.'),
            bo('Defeat Gohma.'),
        ]},
        {'group': 'Act 2 – War Across the Ages', 'objectives': [
            st('Travel to the Era of the Hero of Time (Ocarina of Time).'),
            bo('Defeat Manhandla.'),
            st('Travel to the Era of Twilight; rally Midna and the Twilight allies.'),
            bo('Defeat Argorok.'),
            st('Uncover Wizzro and Cia’s true puppet-master, Ganondorf.'),
        ]},
        {'group': 'Act 3 – The Demon King', 'objectives': [
            st('Confront the resurrected Ganondorf.'),
            bo('Defeat the Imprisoned (Dark Beast).'),
            bo('Defeat Ganondorf.'),
            bo('Defeat Ganon, the Demon King.'),
            st('Reseal the Gate of Souls and restore the Triforce.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Hyrule Warriors: Age of Imprisonment  (2025; Imprisoning War prequel to
# TotK). HIGH-LEVEL SKELETON — chapter names/order need verifying by the
# operator before the run.
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['Hyrule Warriors: Age of Imprisonment'] = {
    'chapters': [
        {'group': 'Prologue – Into the Past', 'objectives': [
            st('Zelda is cast back to the era of Hyrule’s founding.'),
            st('Meet King Rauru and Queen Sonia of the founding kingdom.'),
        ]},
        {'group': 'Act 1 – The Rising Threat', 'objectives': [
            st('Rally the Zonai and the early sages against the Gerudo invasion.'),
            st('Ganondorf, king of the Gerudo, pledges false fealty to Hyrule.'),
            bo('Repel a major monster general (verify name).'),
        ]},
        {'group': 'Act 2 – The Demon King Awakens', 'objectives': [
            st('Ganondorf seizes a Secret Stone and becomes the Demon King.'),
            st('Gather the sages to stand against the Demon King’s army.'),
            bo('Defeat a Demon King lieutenant (verify name).'),
        ]},
        {'group': 'Act 3 – The Imprisoning War', 'objectives': [
            st('Wage the Imprisoning War to seal the Demon King.'),
            bo('Defeat Ganondorf, the Demon King.'),
            st('Rauru sacrifices himself to seal Ganondorf away.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Cadence of Hyrule  (rhythm roguelite — procedurally generated; region/boss
# beats rather than a fixed route.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['Cadence of Hyrule'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Octavo casts Hyrule under a sleeping spell and seizes power.'),
            st('Wake as Cadence, then free Link and Zelda from their crystals.'),
            ig('Get a starting weapon and the Sheikah-style map tools.', 'Weapon'),
        ]},
        {'group': 'The Four Regions', 'objectives': [
            st('Explore the overworld in time with the music; light the warp points.'),
            bo('Defeat the guardian of the first region.'),
            bo('Defeat the guardian of the second region.'),
            bo('Defeat the guardian of the third region.'),
            bo('Defeat the guardian of the fourth region.'),
            ig('Recover the four instruments / power-ups from the region bosses.', 'Instrument'),
        ]},
        {'group': 'Finale', 'objectives': [
            st('Storm Octavo’s tower / Hyrule Castle.'),
            bo('Defeat Octavo.'),
            bo('Defeat Ganon (true ending).'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Tri Force Heroes  (level-based co-op; 8 worlds in the
# Drablands. World/boss beats — verify world names before the run.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Tri Force Heroes'] = {
    'chapters': [
        {'group': 'Prologue – Hytopia', 'objectives': [
            st('Princess Styla is cursed by the witch Lady Maud; form the Totem Trio.'),
            ig('Don the Hero’s Tunic and enter the Drablands.', 'Hero’s Tunic'),
        ]},
        {'group': 'Worlds 1–4', 'objectives': [
            dn('Clear World 1 (Woodlands) and its boss.'),
            dn('Clear World 2 (Riverside) and its boss.'),
            dn('Clear World 3 (Volcano) and its boss.'),
            dn('Clear World 4 (Ice Cavern) and its boss.'),
            sq('Gather materials and sew new outfits at Madame Couture’s.'),
        ]},
        {'group': 'Worlds 5–8', 'objectives': [
            dn('Clear World 5 (Fortress) and its boss.'),
            dn('Clear World 6 (Sky) and its boss.'),
            dn('Clear World 7 (Forest temple region) and its boss.'),
            dn('Clear World 8 (Drablands depths) and its boss.'),
        ]},
        {'group': 'Finale', 'objectives': [
            bo('Defeat Lady Maud.'),
            st('Lift Princess Styla’s curse and restore Hytopia.'),
            sq('Take on the Den of Trials for the rarest materials.'),
        ]},
    ],
}


# ═════════════════════════════════════════════════════════════════════════
# Re-releases / remakes — `copy_from` clones the source game's objectives
# (from the DB) and any extra chapters below adjust for added content.
# ═════════════════════════════════════════════════════════════════════════

# Identical content to the HD/original — straight ports.
WALKTHROUGHS['The Legend of Zelda: Skyward Sword'] = {
    'copy_from': 'The Legend of Zelda: Skyward Sword HD',
}
WALKTHROUGHS['The Legend of Zelda: The Wind Waker'] = {
    'copy_from': 'The Legend of Zelda: The Wind Waker HD',
}
WALKTHROUGHS['The Legend of Zelda: Twilight Princess'] = {
    'copy_from': 'The Legend of Zelda: Twilight Princess HD',
}
WALKTHROUGHS['The Legend of Zelda: Twilight Princess (Wii)'] = {
    'copy_from': 'The Legend of Zelda: Twilight Princess HD',
}

# Ocarina of Time 3D — same main quest, plus Master Quest mode.
WALKTHROUGHS['The Legend of Zelda: Ocarina of Time 3D'] = {
    'copy_from': 'The Legend of Zelda: Ocarina of Time',
    'chapters': [
        {'group': 'Master Quest (3DS extra)', 'objectives': [
            sq('Complete Master Quest mode — the remixed, mirrored, harder dungeons.'),
            sq('Use the Sheikah Stones for hint movies on tricky puzzles.'),
            sq('Clear the Boss Challenge / Boss Gauntlet.'),
        ]},
    ],
}

# A Link to the Past & Four Swords (GBA) — the ALttP quest plus the Four
# Swords multiplayer game and the GBA-exclusive bonus content.
WALKTHROUGHS['The Legend of Zelda: A Link to the Past & Four Swords'] = {
    'copy_from': 'The Legend of Zelda: A Link to the Past',
    'chapters': [
        {'group': 'Four Swords (GBA multiplayer)', 'objectives': [
            dn('Clear the Sea of Trees stage.'),
            dn('Clear the Death Mountain stage.'),
            dn('Clear the Vaati’s Palace stage.'),
            bo('Defeat Vaati and rescue Princess Zelda.'),
        ]},
        {'group': 'GBA Bonus – Palace of the Four Sword', 'objectives': [
            sq('Collect the extra Heart Pieces added in the GBA port.'),
            sq('Complete the riddle quest with the talking ‘‘riddle’’ NPCs.'),
            dn('Enter the Palace of the Four Sword (after beating the main quest).'),
            bo('Defeat the four phantom Links inside the Palace of the Four Sword.'),
        ]},
    ],
}

# Hyrule Warriors expansions — same base Legend Mode plus added content.
# (Added-scenario specifics need verifying; kept high-level.)
WALKTHROUGHS['Hyrule Warriors Legends'] = {
    'copy_from': 'Hyrule Warriors',
    'chapters': [
        {'group': 'Legends – Added Content', 'objectives': [
            st('Play the Wind Waker era chapters added in Legends (the Great Sea / Phantom Ganon).'),
            sq('Unlock the added warriors — Linkle, Tetra, King Daphnes, Skull Kid, Toon Link, Medli.'),
            sq('Play Linkle’s Tale and the other added story scenarios.'),
            sq('Clear the new Adventure Mode maps (e.g. the Great Sea map).'),
        ]},
    ],
}
WALKTHROUGHS['Hyrule Warriors: Definitive Edition'] = {
    'copy_from': 'Hyrule Warriors',
    'chapters': [
        {'group': 'Definitive Edition – All Content', 'objectives': [
            st('Play all Legend Mode content from Hyrule Warriors + Legends, including the Wind Waker era.'),
            sq('Unlock the full roster (Linkle, Medli, Marin, Toon Link, Ravio, Yuga, and more).'),
            sq('Clear every bundled Adventure Mode map and DLC pack.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Majora's Mask
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS["The Legend of Zelda: Majora's Mask"] = {
    'chapters': [
        {'group': 'Prologue – Clock Town', 'objectives': [
            st('The Skull Kid steals your horse, Ocarina and your form — you become a Deku Scrub.'),
            ig('Learn the Song of Healing from the Happy Mask Salesman to gain the Deku Mask.', 'Deku Mask'),
            ig('Recover the Ocarina of Time and learn the Song of Time.', 'Ocarina of Time'),
            st('Play the Song of Time to return to the First Day and reset the three-day cycle.'),
            ig('Learn the Song of Soaring (Song of Double Time variants help too).', 'Song of Soaring'),
        ]},
        {'group': 'Southern Swamp & Woodfall', 'objectives': [
            sq('Clear the poison from the Southern Swamp and learn the Sonata of Awakening.'),
            ig('Learn the Sonata of Awakening.', 'Sonata of Awakening'),
            dn('Raise and enter the Woodfall Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Hero’s Bow.', 'Hero’s Bow'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Odolwa.'),
            ig('Receive the Remains of Odolwa and free the Deku Princess.', 'Odolwa’s Remains'),
        ]},
        {'group': 'Mountain Village & Snowhead', 'objectives': [
            ig('Heal Darmani’s spirit to gain the Goron Mask.', 'Goron Mask'),
            ig('Learn the Goron Lullaby from the Goron Elder’s son.', 'Goron Lullaby'),
            ig('Get the Powder Keg licence to blast open Snowhead.', 'Powder Keg'),
            dn('Enter the Snowhead Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Fire Arrows.', 'Fire Arrows'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Goht.'),
            ig('Receive the Remains of Goht and bring spring to the mountains.', 'Goht’s Remains'),
        ]},
        {'group': 'Great Bay', 'objectives': [
            ig('Heal Mikau’s spirit to gain the Zora Mask.', 'Zora Mask'),
            ig('Learn the New Wave Bossa Nova to wake the Giant Turtle.', 'New Wave Bossa Nova'),
            dn('Enter the Great Bay Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Ice Arrows.', 'Ice Arrows'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            bo('Defeat Gyorg.'),
            ig('Receive the Remains of Gyorg.', 'Gyorg’s Remains'),
        ]},
        {'group': 'Ikana Canyon & Stone Tower', 'objectives': [
            ig('Get the Lens of Truth from a cave in the canyon.', 'Lens of Truth'),
            ig('Learn the Elegy of Emptiness from the dead king Igos du Ikana.', 'Elegy of Emptiness'),
            ig('Get the Mirror Shield in the Ikana well / Beneath the Graveyard.', 'Mirror Shield'),
            dn('Climb to and enter the Stone Tower Temple.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Light Arrows.', 'Light Arrows'),
            ig('Acquire the Boss Key.', 'Boss Key'),
            ig('Get the Giant’s Mask.', 'Giant’s Mask'),
            bo('Defeat Twinmold.'),
            ig('Receive the Remains of Twinmold.', 'Twinmold’s Remains'),
        ]},
        {'group': 'The Final Day', 'objectives': [
            ig('Optionally collect all 20 non-transformation masks to earn the Fierce Deity’s Mask.', 'Fierce Deity’s Mask'),
            st('Play the Oath to Order to summon the Four Giants.'),
            st('Halt the falling moon and follow the Skull Kid inside.'),
            bo('Defeat Majora’s Mask, Incarnation and Wrath.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Link's Awakening
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS["The Legend of Zelda: Link's Awakening"] = {
    'chapters': [
        {'group': 'Prologue – Toronbo Shores', 'objectives': [
            st('Wash ashore on Koholint Island and wake in Marin and Tarin’s house.'),
            ig('Recover your Sword from the beach.', 'Sword'),
            ig('Get the Shield from the shop in Mabe Village.', 'Shield'),
            st('Learn you must wake the Wind Fish by gathering the eight Instruments of the Sirens.'),
        ]},
        {'group': 'Dungeon 1 – Tail Cave', 'objectives': [
            ig('Get the Tail Key to open Tail Cave.', 'Tail Key'),
            dn('Enter Tail Cave.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get Roc’s Feather.', 'Roc’s Feather'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat Moldorm.'),
            ig('Recover the Full Moon Cello.', 'Full Moon Cello'),
        ]},
        {'group': 'Dungeon 2 – Bottle Grotto', 'objectives': [
            dn('Enter the Bottle Grotto.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Power Bracelet.', 'Power Bracelet'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat the Genie.'),
            ig('Recover the Conch Horn.', 'Conch Horn'),
        ]},
        {'group': 'Dungeon 3 – Key Cavern', 'objectives': [
            dn('Enter the Key Cavern.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Pegasus Boots.', 'Pegasus Boots'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat Slime Eye.'),
            ig('Recover the Sea Lily’s Bell.', 'Sea Lily’s Bell'),
        ]},
        {'group': 'Dungeon 4 – Angler’s Tunnel', 'objectives': [
            ig('Get the Flippers to swim to the dungeon.', 'Flippers'),
            dn('Enter Angler’s Tunnel.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Hookshot.', 'Hookshot'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat the Angler Fish.'),
            ig('Recover the Surf Harp.', 'Surf Harp'),
        ]},
        {'group': 'Dungeon 5 – Catfish’s Maw', 'objectives': [
            dn('Enter Catfish’s Maw.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Magic Rod.', 'Magic Rod'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat Slime Eel.'),
            ig('Recover the Wind Marimba.', 'Wind Marimba'),
        ]},
        {'group': 'Dungeon 6 – Face Shrine', 'objectives': [
            ig('Retrieve the stolen Bird Key / reach the Face Shrine.', 'Bird Key'),
            dn('Enter the Face Shrine.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Mirror Shield.', 'Mirror Shield'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat Facade.'),
            ig('Recover the Coral Triangle.', 'Coral Triangle'),
        ]},
        {'group': 'Dungeon 7 – Eagle’s Tower', 'objectives': [
            dn('Enter Eagle’s Tower.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Mirror Shield (if not already) / the dungeon item.', 'Mirror Shield'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat the Evil Eagle.'),
            ig('Recover the Organ of Evening Calm.', 'Organ of Evening Calm'),
        ]},
        {'group': 'Dungeon 8 – Turtle Rock', 'objectives': [
            ig('Wake the Turtle Rock with the Ocarina (Frog’s Song of Soul / Ballad).', 'Ocarina'),
            dn('Enter Turtle Rock.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Magic Rod (if needed) / clear the lava rooms.', 'Magic Rod'),
            ig('Acquire the Nightmare Key.', 'Big Key'),
            bo('Defeat Hot Head and the Grim Creeper.'),
            ig('Recover the Thunder Drum.', 'Thunder Drum'),
        ]},
        {'group': 'Side Quest – The Trading Sequence', 'objectives': [
            sq('Trade the Yoshi Doll up the chain to the Magnifying Lens for the final dungeon.'),
            ig('Obtain the Magnifying Lens.', 'Magnifying Lens'),
            ig('Get the Boomerang from the trade hut (optional).', 'Boomerang'),
        ]},
        {'group': 'Finale – The Wind Fish’s Egg', 'objectives': [
            st('Play the Ballad of the Wind Fish atop Mt. Tamaranch to open the Egg.'),
            dn('Enter the Wind Fish’s Egg.'),
            bo('Defeat the shifting Nightmares (Shadow Nightmare / DethI).'),
            st('Wake the Wind Fish.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: The Minish Cap
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: The Minish Cap'] = {
    'chapters': [
        {'group': 'Prologue – Hyrule Town', 'objectives': [
            st('Vaati turns Princess Zelda to stone; set out to reforge the Picori Blade.'),
            ig('Get the Smith’s Sword.', 'Smith’s Sword'),
            ig('Befriend Ezlo, the talking cap, to shrink to Minish size.', 'Ezlo'),
        ]},
        {'group': 'Element of Earth – Deepwood Shrine', 'objectives': [
            dn('Shrink and enter the Deepwood Shrine in the Minish Woods.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Gust Jar.', 'Gust Jar'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat the Big Green ChuChu.'),
            ig('Claim the Earth Element.', 'Earth Element'),
        ]},
        {'group': 'Element of Fire – Cave of Flames', 'objectives': [
            ig('Get the Cane of Pacci from the Minish.', 'Cane of Pacci'),
            dn('Enter the Cave of Flames on Mt. Crenel.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Mole Mitts.', 'Mole Mitts'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat Gleerok.'),
            ig('Claim the Fire Element.', 'Fire Element'),
        ]},
        {'group': 'Element of Water – Fortress of Winds & Temple of Droplets', 'objectives': [
            ig('Get the Bow from the Fortress of Winds.', 'Bow'),
            ig('Get the Flippers / Pegasus Boots toward Lake Hylia.', 'Pegasus Boots'),
            dn('Enter the Temple of Droplets.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Get the Flame Lantern.', 'Flame Lantern'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat the Big Octorok.'),
            ig('Claim the Water Element.', 'Water Element'),
        ]},
        {'group': 'Element of Wind – Palace of Winds', 'objectives': [
            ig('Get the Roc’s Cape.', 'Roc’s Cape'),
            dn('Reach the Cloud Tops and enter the Palace of Winds.'),
            ig('Acquire the Dungeon Map.', 'Map'),
            ig('Acquire the Compass.', 'Compass'),
            ig('Acquire the Big Key.', 'Big Key'),
            bo('Defeat the Gyorg Pair.'),
            ig('Claim the Wind Element.', 'Wind Element'),
        ]},
        {'group': 'Side Quest – Kinstone Fusing', 'objectives': [
            sq('Fuse Kinstones with townsfolk and Minish to open chests and Heart Pieces.'),
        ]},
        {'group': 'Finale – Dark Hyrule Castle', 'objectives': [
            ig('Reforge the Four Sword with the four Elements.', 'Four Sword'),
            dn('Storm Dark Hyrule Castle.'),
            bo('Defeat Vaati (Reborn / Transfigured / Wrath).'),
            st('Restore Princess Zelda and Hyrule.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Breath of the Wild  (open world — Divine Beasts can be
# done in any order.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Breath of the Wild'] = {
    'chapters': [
        {'group': 'The Great Plateau', 'objectives': [
            st('Wake from the Shrine of Resurrection after 100 years.'),
            ig('Get the Sheikah Slate.', 'Sheikah Slate'),
            ig('Clear the four shrines for Magnesis, Stasis, Cryonis and Remote Bombs.', 'Sheikah Runes'),
            ig('Receive the Paraglider from the Old Man (King Rhoam).', 'Paraglider'),
        ]},
        {'group': 'Vah Ruta – Zora', 'objectives': [
            st('Reach Zora’s Domain and help Prince Sidon.'),
            dn('Calm and board Divine Beast Vah Ruta.'),
            bo('Defeat Waterblight Ganon.'),
            ig('Gain Mipha’s Grace.', 'Mipha’s Grace'),
        ]},
        {'group': 'Vah Rudania – Goron', 'objectives': [
            st('Reach Goron City and help Yunobo.'),
            dn('Climb aboard Divine Beast Vah Rudania.'),
            bo('Defeat Fireblight Ganon.'),
            ig('Gain Daruk’s Protection.', 'Daruk’s Protection'),
        ]},
        {'group': 'Vah Medoh – Rito', 'objectives': [
            st('Reach Rito Village and help Teba.'),
            dn('Board Divine Beast Vah Medoh.'),
            bo('Defeat Windblight Ganon.'),
            ig('Gain Revali’s Gale.', 'Revali’s Gale'),
        ]},
        {'group': 'Vah Naboris – Gerudo', 'objectives': [
            st('Reach Gerudo Town and help Chief Riju.'),
            dn('Board Divine Beast Vah Naboris.'),
            bo('Defeat Thunderblight Ganon.'),
            ig('Gain Urbosa’s Fury.', 'Urbosa’s Fury'),
        ]},
        {'group': 'The Master Sword & Memories', 'objectives': [
            ig('Pull the Master Sword from the Korok Forest (needs 13 hearts).', 'Master Sword'),
            sq('Recover the Captured Memories across Hyrule.'),
            sq('Complete shrines for Spirit Orbs and trade them for Heart Containers / Stamina.'),
        ]},
        {'group': 'Hyrule Castle', 'objectives': [
            dn('Storm Hyrule Castle.'),
            bo('Defeat Calamity Ganon.'),
            bo('Defeat Dark Beast Ganon with the Bow of Light.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Tears of the Kingdom  (open world — the four temples
# can be done in any order.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Tears of the Kingdom'] = {
    'chapters': [
        {'group': 'The Great Sky Island', 'objectives': [
            st('Lose the Master Sword and your strength; awaken on the Great Sky Island.'),
            ig('Clear the four shrines for Ultrahand, Fuse, Ascend and Recall.', 'Arm Abilities'),
            ig('Get the Paraglider and the Purah Pad.', 'Paraglider'),
            st('Dive to the surface and report to Lookout Landing.'),
        ]},
        {'group': 'Wind Temple – Rito', 'objectives': [
            st('Reach Rito Village in the blizzard and help Tulin.'),
            dn('Ascend to and clear the Wind Temple.'),
            bo('Defeat Colgera.'),
            ig('Receive the Sage of Wind’s vow (Tulin).', 'Tulin’s Vow'),
        ]},
        {'group': 'Fire Temple – Goron', 'objectives': [
            st('Reach Goron City and free Yunobo from the marble.'),
            dn('Descend to and clear the Fire Temple.'),
            bo('Defeat Marbled Gohma.'),
            ig('Receive the Sage of Fire’s vow (Yunobo).', 'Yunobo’s Vow'),
        ]},
        {'group': 'Water Temple – Zora', 'objectives': [
            st('Reach Zora’s Domain and clear the sludge with Sidon.'),
            dn('Rise to and clear the Water Temple.'),
            bo('Defeat Mucktorok.'),
            ig('Receive the Sage of Water’s vow (Sidon).', 'Sidon’s Vow'),
        ]},
        {'group': 'Lightning Temple – Gerudo', 'objectives': [
            st('Reach Gerudo Town and aid Chief Riju against the Gibdos.'),
            dn('Clear the Lightning Temple.'),
            bo('Defeat Queen Gibdo.'),
            ig('Receive the Sage of Lightning’s vow (Riju).', 'Riju’s Vow'),
        ]},
        {'group': 'Spirit Temple & the Fifth Sage', 'objectives': [
            st('Find Mineru’s spirit and build the Construct in the Depths.'),
            dn('Clear the Spirit Temple.'),
            bo('Defeat the Seized Construct.'),
            ig('Receive the Sage of Spirit’s vow (Mineru).', 'Mineru’s Vow'),
        ]},
        {'group': 'The Master Sword & the Finale', 'objectives': [
            ig('Reclaim the Master Sword from the Light Dragon.', 'Master Sword'),
            sq('Recover the Dragon’s Tears / geoglyph memories.'),
            dn('Descend beneath Hyrule Castle into the Depths.'),
            bo('Defeat Demon King Ganondorf.'),
            bo('Defeat the Demon Dragon.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: A Link Between Worlds  (Lorule sage dungeons can be
# done in any order; items are rented/bought from Ravio.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: A Link Between Worlds'] = {
    'chapters': [
        {'group': 'Hyrule – The Three Pendants', 'objectives': [
            ig('Get your Sword and Shield; gain Ravio’s Bracelet to merge into walls.', 'Ravio’s Bracelet'),
            dn('Clear the Eastern Palace.'),
            bo('Defeat Yuga in the Eastern Palace.'),
            ig('Earn the Pendant of Courage.', 'Pendant of Courage'),
            dn('Clear the House of Gales.'),
            bo('Defeat Margomill.'),
            ig('Earn the Pendant of Wisdom.', 'Pendant of Wisdom'),
            dn('Clear the Tower of Hera.'),
            bo('Defeat Moldorm.'),
            ig('Earn the Pendant of Power.', 'Pendant of Power'),
            ig('Draw the Master Sword.', 'Master Sword'),
        ]},
        {'group': 'Lorule – The Seven Sages', 'objectives': [
            st('Cross into Lorule and meet Princess Hilda.'),
            dn('Clear the Dark Palace and rescue a Sage.'),
            bo('Defeat Gemesaur King.'),
            dn('Clear the Swamp Palace and rescue a Sage.'),
            bo('Defeat Arrghus.'),
            dn('Clear Skull Woods and rescue a Sage.'),
            bo('Defeat Knucklemaster.'),
            dn('Clear the Thieves’ Hideout and rescue a Sage.'),
            bo('Defeat Stalblind.'),
            dn('Clear the Ice Ruins and rescue a Sage.'),
            bo('Defeat Dharkstare.'),
            dn('Clear the Desert Palace and rescue a Sage.'),
            bo('Defeat Zaganaga.'),
            dn('Clear Turtle Rock and rescue a Sage.'),
            bo('Defeat Grinexx.'),
        ]},
        {'group': 'Finale – Lorule Castle', 'objectives': [
            dn('Storm Lorule Castle.'),
            bo('Defeat Yuga Ganon.'),
            st('Restore the Triforces of Hyrule and Lorule.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Phantom Hourglass  (DS; dungeon/boss pairing worth a
# quick verify.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Phantom Hourglass'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Tetra is taken by the Ghost Ship; set sail with Linebeck and the fairy Ciela.'),
            ig('Receive the Phantom Hourglass to survive the Temple of the Ocean King.', 'Phantom Hourglass'),
        ]},
        {'group': 'Temple of Fire', 'objectives': [
            ig('Get the Boomerang.', 'Boomerang'),
            dn('Enter the Temple of Fire.'),
            bo('Defeat Blaaz.'),
            ig('Restore the Spirit of Power, Leaf.', 'Spirit of Power'),
        ]},
        {'group': 'Temple of Wind', 'objectives': [
            ig('Get Bombs.', 'Bombs'),
            dn('Enter the Temple of Wind.'),
            bo('Defeat Cyclok.'),
            ig('Restore the Spirit of Wisdom, Neri.', 'Spirit of Wisdom'),
        ]},
        {'group': 'Temple of Courage', 'objectives': [
            ig('Get the Bow.', 'Bow'),
            dn('Enter the Temple of Courage.'),
            bo('Defeat Crayk.'),
            ig('Recover a Pure Metal (Aquanine) for the Phantom Sword.', 'Aquanine'),
        ]},
        {'group': 'Goron Temple', 'objectives': [
            ig('Get the Bombchus.', 'Bombchus'),
            dn('Enter the Goron Temple.'),
            bo('Defeat Dongorongo.'),
            ig('Recover a Pure Metal (Crimsonine).', 'Crimsonine'),
        ]},
        {'group': 'Temple of Ice & Mutoh’s Temple', 'objectives': [
            ig('Get the Grappling Hook.', 'Grappling Hook'),
            dn('Enter the Temple of Ice.'),
            bo('Defeat Gleeok.'),
            ig('Get the Hammer.', 'Hammer'),
            dn('Enter Mutoh’s Temple.'),
            bo('Defeat Eox.'),
            ig('Recover a Pure Metal (Azurine) and forge the Phantom Sword.', 'Phantom Sword'),
        ]},
        {'group': 'Finale – The Ghost Ship', 'objectives': [
            dn('Board the Ghost Ship and clear the Temple of the Ocean King’s depths.'),
            bo('Defeat Bellum.'),
            bo('Defeat Bellumbeck (Linebeck possessed).'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Spirit Tracks  (DS; dungeon/boss pairing worth a quick
# verify.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Spirit Tracks'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Chancellor Cole steals Princess Zelda’s body; her spirit joins you.'),
            ig('Get the Spirit Flute and gain control of a Phantom for Zelda.', 'Spirit Flute'),
        ]},
        {'group': 'Forest Realm – Forest Temple', 'objectives': [
            ig('Get the Whirlwind.', 'Whirlwind'),
            dn('Restore the Tower of Spirits and enter the Forest Temple.'),
            bo('Defeat Stagnox.'),
            ig('Recover the Forest Rail Map.', 'Forest Rail Map'),
        ]},
        {'group': 'Snow Realm – Snow Temple', 'objectives': [
            ig('Get the Boomerang.', 'Boomerang'),
            dn('Enter the Snow Temple.'),
            bo('Defeat Fraaz.'),
            ig('Recover the Snow Rail Map.', 'Snow Rail Map'),
        ]},
        {'group': 'Ocean Realm – Ocean Temple', 'objectives': [
            ig('Get the Bow.', 'Bow'),
            dn('Enter the Ocean Temple.'),
            bo('Defeat Phytops.'),
            ig('Recover the Ocean Rail Map.', 'Ocean Rail Map'),
        ]},
        {'group': 'Fire Realm – Fire Temple', 'objectives': [
            ig('Get the Whip.', 'Whip'),
            dn('Enter the Fire Temple.'),
            bo('Defeat Cragma.'),
            ig('Recover the Fire Rail Map.', 'Fire Rail Map'),
        ]},
        {'group': 'Sand Realm – Sand Temple', 'objectives': [
            ig('Get the Sand Wand.', 'Sand Wand'),
            dn('Enter the Sand Temple.'),
            bo('Defeat Skeldritch.'),
            ig('Recover the Sand Rail Map.', 'Sand Rail Map'),
        ]},
        {'group': 'Finale – The Dark Realm', 'objectives': [
            ig('Reach the top of the Tower of Spirits and forge the Lokomo Sword / Bow of Light.', 'Bow of Light'),
            bo('Defeat Byrne / Chancellor Cole.'),
            bo('Defeat Malladus and the Demon Train.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Echoes of Wisdom  (2024) — REGION SKELETON; dungeon
# names/order and bosses need verifying before the run.
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Echoes of Wisdom'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Rifts swallow Hyrule and Link vanishes; play as Princess Zelda.'),
            ig('Receive the Tri Rod to create Echoes.', 'Tri Rod'),
            ig('Gain the Swordfighter form via borrowed energy.', 'Swordfighter Form'),
        ]},
        {'group': 'Suthorn Region', 'objectives': [
            dn('Seal the Suthorn rift / dungeon.'),
            bo('Defeat the region boss (verify name).'),
        ]},
        {'group': 'Gerudo Region', 'objectives': [
            dn('Seal the Gerudo Desert rift / dungeon.'),
            bo('Defeat the region boss (verify name).'),
        ]},
        {'group': 'Eldin Region', 'objectives': [
            dn('Seal the Eldin Volcano rift / dungeon.'),
            bo('Defeat the region boss (verify name).'),
        ]},
        {'group': 'Hebra Region', 'objectives': [
            dn('Seal the Hebra Mountains rift / dungeon.'),
            bo('Defeat the region boss (verify name).'),
        ]},
        {'group': 'Jabul Waters', 'objectives': [
            dn('Seal the Jabul Waters rift / dungeon.'),
            bo('Defeat the region boss (verify name).'),
        ]},
        {'group': 'Faron Region', 'objectives': [
            dn('Seal the Faron Wetlands rift / dungeon.'),
            bo('Defeat the region boss (verify name).'),
        ]},
        {'group': 'Finale – The Still World', 'objectives': [
            st('Rescue Link and confront the source of the rifts.'),
            bo('Defeat Null in the Still World.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Four Swords  (multiplayer)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Four Swords'] = {
    'chapters': [
        {'group': 'Prologue', 'objectives': [
            st('Vaati kidnaps Princess Zelda; the Four Sword splits Link into four.'),
        ]},
        {'group': 'The Three Stages', 'objectives': [
            dn('Clear the Sea of Trees, gathering the most Rupees.'),
            dn('Clear Death Mountain.'),
            dn('Clear Vaati’s Palace.'),
            bo('Defeat Vaati and rescue Princess Zelda.'),
        ]},
        {'group': 'Anniversary Edition Extras', 'objectives': [
            sq('Play the Realm of Memories stages themed after past Zelda games.'),
            sq('Complete the Hero’s Trial / single-player challenges.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# The Legend of Zelda: Four Swords Adventures  (level/stage based; level
# names/bosses worth a quick verify.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['The Legend of Zelda: Four Swords Adventures'] = {
    'chapters': [
        {'group': 'Chapter 1 – The Hyrulean Adventure', 'objectives': [
            dn('Whereabouts of the Wind — restore the Four Sword and chase Shadow Link.'),
            dn('Eastern Hyrule — cross the fields and forests.'),
            dn('Death Mountain — climb the volcano.'),
            bo('Defeat the chapter boss.'),
        ]},
        {'group': 'Chapter 2 – Across Hyrule', 'objectives': [
            dn('The Coast / Hyrule Castle approaches.'),
            dn('The Desert of Doubt.'),
            dn('Frozen Hyrule / the lakes.'),
            bo('Defeat the chapter boss.'),
        ]},
        {'group': 'Chapter 3 – The Dark World', 'objectives': [
            dn('The Swamp and the Dark World mirrors.'),
            dn('The Realm of the Heavens / Tower.'),
            bo('Defeat Ganon’s heralds (Phantom Ganon / Shadow Link).'),
            bo('Defeat Ganon and reseal him in the Four Sword.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Hyrule Warriors: Age of Calamity  (BotW prequel musou; chapter beats.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS['Hyrule Warriors: Age of Calamity'] = {
    'chapters': [
        {'group': 'Chapter 1 – The Battle of Hyrule Field', 'objectives': [
            st('A small Guardian (Terrako) travels 100 years into the past to change fate.'),
            st('Fight alongside Link and Impa to defend Hyrule Field.'),
        ]},
        {'group': 'Chapter 2 – Recruiting the Champions', 'objectives': [
            st('Recruit Mipha and the Zora.'),
            st('Recruit Daruk and the Gorons.'),
            st('Recruit Revali and the Rito.'),
            st('Recruit Urbosa and the Gerudo.'),
            bo('Defeat the Yiga Clan leader, Master Kohga.'),
        ]},
        {'group': 'Chapter 3 – The Divine Beasts', 'objectives': [
            st('Pilot the four Divine Beasts against the Calamity’s forces.'),
            bo('Defeat the Blight Ganons attacking the Champions.'),
        ]},
        {'group': 'Chapter 4 – The Great Calamity', 'objectives': [
            st('Confront the prophet Astor and the Harbinger Ganon.'),
            bo('Defeat Harbinger Ganon.'),
            st('The future BotW-era warriors arrive through time to turn the tide.'),
        ]},
        {'group': 'Chapter 5 – Calamity Ganon', 'objectives': [
            st('Repair Terrako and unite the armies of past and future.'),
            bo('Defeat Astor.'),
            bo('Defeat Calamity Ganon.'),
        ]},
    ],
}


# ─────────────────────────────────────────────────────────────────────────
# Link's Crossbow Training  (Wii light-gun spinoff — score/stage based.)
# ─────────────────────────────────────────────────────────────────────────
WALKTHROUGHS["Link's Crossbow Training"] = {
    'chapters': [
        {'group': 'Crossbow Training', 'objectives': [
            st('A target-shooting spinoff using Twilight Princess assets and the Wii Zapper.'),
            sq('Clear all nine levels of Target Shooting, Defender and Ranger stages.'),
            sq('Earn Platinum medals on every stage.'),
            sq('Climb the high-score ranks.'),
        ]},
    ],
}


# ═════════════════════════════════════════════════════════════════════════
# Remakes/ports of the games authored above (copy_from, with extras).
# ═════════════════════════════════════════════════════════════════════════

# Majora's Mask 3D — same quest plus 3DS additions.
WALKTHROUGHS["The Legend of Zelda: Majora's Mask 3D"] = {
    'copy_from': "The Legend of Zelda: Majora's Mask",
    'chapters': [
        {'group': '3DS Additions', 'objectives': [
            sq('Use the overhauled Bombers’ Notebook to track every sidequest and NPC.'),
            sq('Play the new Fishing Holes for the Swamp and Ocean.'),
            sq('Take on the redesigned boss fights and their new weak points.'),
        ]},
    ],
}

# Link's Awakening DX — adds the Color Dungeon.
WALKTHROUGHS["The Legend of Zelda: Link's Awakening DX"] = {
    'copy_from': "The Legend of Zelda: Link's Awakening",
    'chapters': [
        {'group': 'Color Dungeon (DX exclusive)', 'objectives': [
            dn('Enter the Color Dungeon in the Mysterious Forest.'),
            bo('Defeat the Hardhit Beetle / the Color Dungeon boss.'),
            ig('Choose the Red Mail (power) or Blue Mail (defence).', 'Red or Blue Mail'),
        ]},
    ],
}

# Link's Awakening (Switch 2019) — adds the Color Dungeon and Chamber Dungeons.
WALKTHROUGHS["The Legend of Zelda: Link's Awakening (Switch)"] = {
    'copy_from': "The Legend of Zelda: Link's Awakening",
    'chapters': [
        {'group': 'Color Dungeon', 'objectives': [
            dn('Enter the Color Dungeon in the Mysterious Forest.'),
            bo('Defeat the Color Dungeon boss.'),
            ig('Choose the Red Mail (power) or Blue Mail (defence).', 'Red or Blue Mail'),
        ]},
        {'group': 'Chamber Dungeons (Switch extra)', 'objectives': [
            sq('Collect Chamber Stones from dungeons and build dungeons for Dampé.'),
            sq('Clear Dampé’s Chamber Dungeon challenges for rewards.'),
        ]},
    ],
}

# Switch 2 enhanced editions — identical content to the base game.
WALKTHROUGHS['The Legend of Zelda: Breath of the Wild — Nintendo Switch 2 Edition'] = {
    'copy_from': 'The Legend of Zelda: Breath of the Wild',
}
WALKTHROUGHS['The Legend of Zelda: Tears of the Kingdom — Nintendo Switch 2 Edition'] = {
    'copy_from': 'The Legend of Zelda: Tears of the Kingdom',
}


