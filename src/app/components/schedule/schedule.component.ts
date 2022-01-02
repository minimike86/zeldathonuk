import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { TwitchService } from '../../services/twitch-service/twitch-service.service';

import { faFacebook } from '@fortawesome/free-brands-svg-icons';


@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  public gameList: Game[];

  faFacebook = faFacebook;

  public now: Date;
  public isLive = false;

  constructor(private router: Router,
              private twitchService: TwitchService) {
  }

  ngOnInit() {
    this.now = new Date();
    this.gameList = this.getGames();

    this.twitchService.getSearchChannels('zeldathonuk', 1, false).subscribe(data => {
      this.isLive = data.is_live;
    });

  }

  routeToLiveView() {
    this.router.navigate(['']).then();
  }

  isCurrentlyPlaying(index: number): boolean {
    return (this.gameList[index].startDate.getTime() <= this.now.getTime() &&
      this.gameList[index + 1]?.startDate.getTime() > this.now.getTime());
  }

  hasBeenPlayed(index: number): boolean {
    return (this.gameList[index]?.startDate.getTime() <= this.now.getTime());
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/5194665980557244/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022', '_blank');
  }

  getGames(): Game[] {
    const games: Game[] = [];
    const skywardSword = {
      startDate: new Date('2021-02-20 09:00:00'),
      console: 'Wii',
      timeline: 'Original',
      name: 'The Legend of Zelda: Skyward Sword',
      releaseDate: 2011,
      boxArt: '../../../assets/img/cover-art/ss_cover.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Original',
      releaseDate: 2004,
      boxArt: '../../../assets/img/cover-art/Minish_Cap_cover.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Original',
      name: 'The Legend of Zelda: Four Swords',
      releaseDate: 2004,
      boxArt: '../../../assets/img/cover-art/250px-Zelda_fsae.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-secondary',
          text: '4P Co-op'
        },
        {
          type: 'bg-info',
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
      timeline: 'Original',
      name: 'The Legend of Zelda: Ocarina of Time',
      releaseDate: 1998,
      boxArt: '../../../assets/img/cover-art/250px-ZeldaOoTbox.jpg',
      extraBadges: [{
        type: 'bg-primary',
        text: 'Multiplayer Any%'
        },
        {
          type: 'bg-success',
          text: 'OoT Online',
          url: 'https://github.com/hylian-modding/OcarinaOfTimeOnline'
        },
        {
          type: 'bg-info',
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
      timeline: 'Child',
      name: 'The Legend of Zelda: Majora\'s Mask',
      releaseDate: 2000,
      boxArt: '../../../assets/img/cover-art/Majoras_Mask_3D_cover.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Multiplayer Any%'
        },
        {
          type: 'bg-success',
          text: 'MM Online',
          url: 'https://github.com/hylian-modding/MajorasMaskOnline'
        },
        {
          type: 'bg-info',
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
      timeline: 'Child',
      name: 'The Legend of Zelda: Twilight Princess HD',
      releaseDate: 2016,
      boxArt: '../../../assets/img/cover-art/Twilight_Princess_HD_cover.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Child',
      name: 'The Legend of Zelda: Four Swords Adventures',
      releaseDate: 2004,
      boxArt: '../../../assets/img/cover-art/250px-Zeldafourswordsbox.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-secondary',
          text: '4P Co-op'
        },
        {
          type: 'bg-info',
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
      timeline: 'Adult',
      name: 'The Legend of Zelda: The Wind Waker HD',
      releaseDate: 2013,
      boxArt: '../../../assets/img/cover-art/Zelda_TheWindWakerHD.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Adult',
      name: 'The Legend of Zelda: Phantom Hourglass',
      releaseDate: 2007,
      boxArt: '../../../assets/img/cover-art/phantom-hourglass-cover-256.png',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Adult',
      name: 'The Legend of Zelda: Spirit Tracks',
      releaseDate: 2009,
      boxArt: '../../../assets/img/cover-art/Spirit_Tracks_cover.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Downfall',
      name: 'The Legend of Zelda: A Link to the Past',
      releaseDate: 1992,
      boxArt: '../../../assets/img/cover-art/250px-Zelda_SNES.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Multiplayer Any%'
        },
        {
          type: 'bg-success',
          text: 'ALttP Online',
          url: 'https://github.com/alttpo/alttpo'
        },
        {
          type: 'bg-info',
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
      timeline: 'Downfall',
      name: 'The Legend of Zelda: Link\'s Awakening',
      releaseDate: 2019,
      boxArt: '../../../assets/img/cover-art/66255_The_Legend_of_Zelda_Links_Awakening_(2019).jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
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
      timeline: 'Downfall',
      name: 'The Legend of Zelda: A Link Between Worlds',
      releaseDate: 2013,
      boxArt: '../../../assets/img/cover-art/d6qewmw-4f881e91-6d83-46bb-9deb-2140a7266d69.png',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
          text: '16 Hours',
          url: 'https://howlongtobeat.com/game.php?id=12965'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(linkBetweenWorlds);

    const triforceHeroes = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: '3DS',
      timeline: 'Downfall',
      name: 'The Legend of Zelda: Tri Force Heroes',
      releaseDate: 2015,
      boxArt: '../../../assets/img/cover-art/250px-Zelda_triforce-heroes.jpg',
      extraBadges: [{
        type: 'bg-primary',
        text: 'Any%'
      },
        {
          type: 'bg-info',
          text: '14 Hours',
          url: 'https://howlongtobeat.com/game?id=30592'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(triforceHeroes);

    const theLegendOfZelda = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'NES',
      timeline: 'Downfall',
      name: 'The Legend of Zelda',
      releaseDate: 1986,
      boxArt: '../../../assets/img/cover-art/Legend_of_zelda_cover_(with_cartridge)_gold.png',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
          text: '8 Hours',
          url: 'https://howlongtobeat.com/game?id=10025'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(theLegendOfZelda);

    const zeldaIITheAdventureOfLink = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'NES',
      timeline: 'Downfall',
      name: 'Zelda II: The Adventure of Link',
      releaseDate: 1987,
      boxArt: '../../../assets/img/cover-art/Adventure_of_Link_cover.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-info',
          text: '11 Hours',
          url: 'https://howlongtobeat.com/game.php?id=11533'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(zeldaIITheAdventureOfLink);

    const hyruleWarriorsAgeOfCalamity = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'Switch',
      timeline: '???',
      name: 'Hyrule Warriors: Age of Calamity',
      releaseDate: 2020,
      boxArt: '../../../assets/img/cover-art/hyrule-warriors-age-of-calamity-cover.cover_small.jpg',
      extraBadges: [{
          type: 'bg-primary',
          text: 'Any%'
        },
        {
          type: 'bg-danger',
          text: 'New Title',
          url: 'https://www.nintendo.co.uk/Games/Nintendo-Switch/Hyrule-Warriors-Age-of-Calamity-1838129.html'
        },
        {
          type: 'bg-info',
          text: '20 Hours',
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
      timeline: '???',
      name: 'The Legend of Zelda: Breath of the Wild',
      releaseDate: 2017,
      boxArt: '../../../assets/img/cover-art/38019_The_Legend_of_Zelda_Breath_of_the_Wild.jpg',
      extraBadges: [{
        type: 'bg-primary',
        text: 'Any%'
      },
        {
          type: 'bg-info',
          text: '18 Hours',
          url: 'https://howlongtobeat.com/game?id=38019'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(breathOfTheWild);

    const linkToThePastSuperMetroidRandomizer = {
      startDate: new Date((games[games.length - 1].startDate.getTime() +
        (parseInt(games[games.length - 1].extraBadges.find(x => x.text.endsWith('Hours')).text.split(' ')[0], 10) * 60 * 60 * 1000))),
      console: 'SNES',
      timeline: 'Crossover',
      name: 'Super Metroid & A Link to the Past Crossover Item Randomizer',
      releaseDate: 1992,
      boxArt: '../../../assets/img/cover-art/250px-Zelda_SNES_Metroid.jpg',
      extraBadges: [{
        type: 'bg-primary',
        text: 'Multiplayer Any%'
      },
        {
          type: 'bg-danger',
          text: 'Randomizer',
          url: 'https://github.com/tewtal/SMZ3Randomizer'
        },
        {
          type: 'bg-info',
          text: '14 Hours',
          url: 'https://howlongtobeat.com/game?id=10028'
        }],
      runners: [{
        name: 'MSec',
        channelUrl: 'https://www.twitch.tv/msec'
      }],
    };
    games.push(linkToThePastSuperMetroidRandomizer);

    return games;
  }

}


interface Game {
  startDate: Date;
  console: string;
  name: string;
  timeline: string;
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
