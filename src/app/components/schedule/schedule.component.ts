import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  public gameList: Game[];

  constructor() { }

  ngOnInit() {
    this.gameList = this.getGames();
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/655011391974449/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

  getGames(): Game[] {
    const games: Game[] = [];
    const skywardSword = {
      startDate: new Date('2021-02-15 09:00:00'),
      console: 'Wii',
      name: 'The Legend of Zelda: Skyward Sword',
      releaseDate: 2011,
      boxArt: '../../../assets/img/cover-art/ss_cover.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '24 Hours',
          url: 'https://howlongtobeat.com/game?id=10042'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(skywardSword);

    const minishCap = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'GBA',
      name: 'The Legend of Zelda: The Minish Cap',
      releaseDate: 2004,
      boxArt: '../../../assets/img/cover-art/Minish_Cap_cover.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '15 Hours',
          url: 'https://howlongtobeat.com/game.php?id=10044'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(minishCap);

    const fourSwordsAnniversaryEdition = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: '3DS',
      name: 'The Legend of Zelda: Four Swords',
      releaseDate: 2004,
      boxArt: '../../../assets/img/cover-art/250px-Zelda_fsae.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-secondary',
          text: '4P Co-op'
        },
        {
          type: 'badge-info',
          text: '4 Hours',
          url: 'https://howlongtobeat.com/game?id=10031'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(fourSwordsAnniversaryEdition);

    const ocarinaOfTime = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'N64',
      name: 'The Legend of Zelda: Ocarina of Time',
      releaseDate: 1998,
      boxArt: '../../../assets/img/cover-art/250px-ZeldaOoTbox.jpg',
      extraBadges: [{
        type: 'badge-primary',
        text: 'Multiplayer Any%'
        },
        {
          type: 'badge-success',
          text: 'OoT Online',
          url: 'https://github.com/hylian-modding/OcarinaOfTimeOnline'
        },
        {
          type: 'badge-info',
          text: '10 Hours',
          url: 'https://howlongtobeat.com/game?id=10035'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(ocarinaOfTime);

    const majorasMask = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'N64',
      name: 'The Legend of Zelda: Majora\'s Mask',
      releaseDate: 2000,
      boxArt: '../../../assets/img/cover-art/Majoras_Mask_3D_cover.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Multiplayer Any%'
        },
        {
          type: 'badge-success',
          text: 'MM Online',
          url: 'https://github.com/hylian-modding/MajorasMaskOnline'
        },
        {
          type: 'badge-info',
          text: '10 Hours',
          url: 'https://howlongtobeat.com/game?id=10034'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(majorasMask);

    const twilightPrincessHd = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'WiiU',
      name: 'The Legend of Zelda: Twilight Princess HD',
      releaseDate: 2016,
      boxArt: '../../../assets/img/cover-art/Twilight_Princess_HD_cover.jpg',
      extraBadges: [{
        type: 'badge-primary',
        text: 'Any%'
      },
        {
          type: 'badge-info',
          text: '20 Hours',
          url: 'https://howlongtobeat.com/game?id=33835'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(twilightPrincessHd);

    const fourSwordsAdventure = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'GC',
      name: 'The Legend of Zelda: Four Swords Adventures',
      releaseDate: 2004,
      boxArt: '../../../assets/img/cover-art/250px-Zeldafourswordsbox.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-secondary',
          text: '4P Co-op'
        },
        {
          type: 'badge-info',
          text: '15 Hours',
          url: 'https://howlongtobeat.com/game?id=10030'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(fourSwordsAdventure);

    const windWakerHd = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'WiiU',
      name: 'The Legend of Zelda: The Wind Waker HD',
      releaseDate: 2013,
      boxArt: '../../../assets/img/cover-art/Zelda_TheWindWakerHD.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '25 Hours',
          url: 'https://howlongtobeat.com/game?id=13142'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(windWakerHd);

    const phantomHourglass = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'DS',
      name: 'The Legend of Zelda: Phantom Hourglass',
      releaseDate: 2007,
      boxArt: '../../../assets/img/cover-art/phantom-hourglass-cover-256.png',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '16 Hours',
          url: 'https://howlongtobeat.com/game?id=10041'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(phantomHourglass);

    const spiritTracks = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'DS',
      name: 'The Legend of Zelda: Spirit Tracks',
      releaseDate: 2009,
      boxArt: '../../../assets/img/cover-art/Spirit_Tracks_cover.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '19 Hours',
          url: 'https://howlongtobeat.com/game?id=10043'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(spiritTracks);

    const linkToThePast = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'SNES',
      name: 'The Legend of Zelda: A Link to the Past',
      releaseDate: 1992,
      boxArt: '../../../assets/img/cover-art/250px-Zelda_SNES.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '15 Hours',
          url: 'https://howlongtobeat.com/game?id=10028'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(linkToThePast);

    const linksAwakeningSwitch = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'Switch',
      name: 'The Legend of Zelda: Link\'s Awakening',
      releaseDate: 2019,
      boxArt: '../../../assets/img/cover-art/66255_The_Legend_of_Zelda_Links_Awakening_(2019).jpg',
      extraBadges: [{
        type: 'badge-primary',
        text: 'Any%'
      },
        {
          type: 'badge-info',
          text: '14 Hours',
          url: 'https://howlongtobeat.com/game?id=66255'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(linksAwakeningSwitch);

    const linkBetweenWorlds = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: '3DS',
      name: 'The Legend of Zelda: A Link Between Worlds',
      releaseDate: 2013,
      boxArt: '../../../assets/img/cover-art/d6qewmw-4f881e91-6d83-46bb-9deb-2140a7266d69.png',
      extraBadges: [{
        type: 'badge-primary',
        text: 'Any%'
      },
        {
          type: 'badge-info',
          text: '16 Hours',
          url: 'https://howlongtobeat.com/game.php?id=12965'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(linkBetweenWorlds);

    const theLegendOfZelda = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'NES',
      name: 'The Legend of Zelda',
      releaseDate: 1986,
      boxArt: '../../../assets/img/cover-art/Legend_of_zelda_cover_(with_cartridge)_gold.png',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-info',
          text: '8 Hours',
          url: 'https://howlongtobeat.com/game?id=10025'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(theLegendOfZelda);

    const hyruleWarriorsAgeOfCalamity = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'Switch',
      name: 'Hyrule Warriors: Age of Calamity',
      releaseDate: 2020,
      boxArt: '../../../assets/img/cover-art/hyrule-warriors-age-of-calamity-cover.cover_small.jpg',
      extraBadges: [{
          type: 'badge-primary',
          text: 'Any%'
        },
        {
          type: 'badge-danger',
          text: 'New Title',
          url: 'https://www.nintendo.co.uk/Games/Nintendo-Switch/Hyrule-Warriors-Age-of-Calamity-1838129.html'
        },
        {
          type: 'badge-info',
          text: '16 Hours',
          url: 'https://howlongtobeat.com/game?id=82895'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(hyruleWarriorsAgeOfCalamity);

    const breathOfTheWild = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'Switch',
      name: 'The Legend of Zelda: Breath of the Wild',
      releaseDate: 2017,
      boxArt: '../../../assets/img/cover-art/38019_The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
      extraBadges: [{
        type: 'badge-primary',
        text: 'Any%'
      },
        {
          type: 'badge-info',
          text: '14 Hours',
          url: 'https://howlongtobeat.com/game?id=38019'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(breathOfTheWild);
    return games;
  }

}


interface Game {
  startDate: Date;
  console: string;
  name: string;
  releaseDate: number;
  boxArt: string;
  extraBadges: Badge[];
  runners: Runner[];
}

interface Badge {
  type: string;
  text: string;
  url?: string;
}

interface Runner {
  name: string;
  channelUrl: string;
}
