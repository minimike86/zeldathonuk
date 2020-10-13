import {AfterViewInit, Component, ElementRef, OnInit, Renderer2, ViewChild} from '@angular/core';
import {DomSanitizer} from '@angular/platform-browser';


@Component({
  selector: 'app-audio-visualizer',
  templateUrl: './audio-visualizer.component.html',
  styleUrls: ['./audio-visualizer.component.css']
})
export class AudioVisualizerComponent implements OnInit, AfterViewInit {

  @ViewChild('canvas', {static: false})
  canvas: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasBeatLeft', {static: false})
  canvasBeatLeft: ElementRef<HTMLCanvasElement>;

  @ViewChild('canvasBeatRight', {static: false})
  canvasBeatRight: ElementRef<HTMLCanvasElement>;

  public ctx: CanvasRenderingContext2D;
  public canvasToggle = false;

  @ViewChild('audioElement', {static: false})
  audioElement: ElementRef;
  public audio: HTMLAudioElement;

  public audioLibrary: AudioLibraryItem[] = [];
  public playingLibraryIndex: number;

  @ViewChild('youtubeEmbed', {static: false})
  youtubeElement: ElementRef;
  public youtubeIFrame: HTMLIFrameElement;
  public youtubeId: string;

  public timeRemaining: TimeRemaining = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  };

  public audioCtx: AudioContext;
  public source: MediaElementAudioSourceNode;
  public analyser: AnalyserNode;
  public fftLen: number;
  public fft: Uint8Array;

  public beatColour: string | CanvasGradient;

  constructor(private renderer: Renderer2,
              public sanitizer: DomSanitizer) {
  }

  ngOnInit(): void {
    this.calcTimeRemaining();
    // Define audio files
    this.getAudioLibrary();
    this.playingLibraryIndex = Math.floor(Math.random() * (this.audioLibrary.length));
    // Define audio element
    this.audio = new Audio();
    this.audio.src = this.audioLibrary[this.playingLibraryIndex].url;
    this.beatColour = this.audioLibrary[this.playingLibraryIndex].beatColour;
    this.audio.autoplay = false;
    this.audio.controls = false;
  }

  ngAfterViewInit(): void {
    // Add audio to audio container ElementRef
    this.renderer.appendChild(this.audioElement.nativeElement, this.audio);
    setTimeout(() => {
      this.getAudioContext();
    }, 1000);
    this.updateYoutubeVideo();
  }

  calcTimeRemaining() {
    setInterval(() => {
      const now = new Date();
      const gameBlastStartDate = new Date(Date.parse('15 Feb 2021 08:00:00 GMT'));
      const milliseconds = gameBlastStartDate.getTime() - now.getTime();
      const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));
      const hours = Math.floor(((milliseconds / (1000 * 60 * 60)) % 24));
      const minutes = Math.floor(((milliseconds / (1000 * 60)) % 60));
      const seconds = Math.floor((milliseconds / 1000) % 60);
      this.timeRemaining = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds
      };
    }, 1000);
  }

  zeroPad(num: number, maxLen: number): string {
    if (maxLen > 2) {
      if (num < 10) {
        return ('00' + num);
      } else if (num < 100) {
        return ('0' + num);
      } else {
        return ('' + num);
      }
    } else if (maxLen <= 2) {
      if (num < 10) {
        return ('0' + num);
      } else {
        return ('' + num);
      }
    }
  }

  getAudioLibrary() {
    const ianAislingTogether = {
      url: './assets/audio/Ian%20Aisling%20-%20Together%20-%20A%20Zelda%20Animation%20OST%20-%2005%20Fi\'s%20Theme%20Reimagined.mp3',
      songName: 'Together - A Zelda Animation OST',
      songAuthor: 'by Ian Aisling',
      beatColour: 'rgba(255, 255, 255, 0.5)',
      youtubeId: 'FZ7skiQRhAU'
    };
    this.audioLibrary.push(ianAislingTogether);
    const djCutmanMeowMeowBowWow = {
      url: './assets/audio/Zelda - Link\'s Awakening - Sword Search Remix - Dj CUTMAN\'s Meow Meow & Bow Wow - GameChops.mp3',
      songName: 'Meow Meow & Bow Wow',
      songAuthor: 'by Dj CUTMAN',
      beatColour: 'rgba(218, 165, 32, 0.75)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(djCutmanMeowMeowBowWow);
    const swiimLozHipHopRemix = {
      url: './assets/audio/The Legend of Zelda_ Breath Of The Wild [S W II M Hip-Hop remix].mp3',
      songName: 'The Legend of Zelda: Breath Of The Wild [S W II M Hip-Hop remix]',
      songAuthor: 'by S W II M',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(swiimLozHipHopRemix);
    const depazMiphaLofi = {
      url: './assets/audio/ｍｉｐｈａ ｌｏｆｉ _ Zelda Breath of the Wild (depaz).mp3',
      songName: 'ｍｉｐｈａ ｌｏｆｉ | Zelda Breath of the Wild (depaz)',
      songAuthor: 'by depaz',
      beatColour: 'rgba(220, 20, 60, 0.85)',
      youtubeId: 'ooMMSJ1-a7Q'
    };
    this.audioLibrary.push(depazMiphaLofi);
    const tinyDrumTarreyTown = {
      url: './assets/audio/The Legend of Zelda - Tarrey Town (Lofi Hip-Hop Remix).mp3',
      songName: 'The Legend of Zelda - Tarrey Town (Lofi Hip-Hop Remix)',
      songAuthor: 'by Tiny Drum',
      beatColour: 'rgba(160, 82, 45, 0.5)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(tinyDrumTarreyTown);
    const blueBrewMusicShiekahTower = {
      url: './assets/audio/The Legend of Zelda_ Breath of the Wild - Shiekah Tower [Remix].mp3',
      songName: 'The Legend of Zelda: Breath of the Wild - Shiekah Tower [Remix]',
      songAuthor: 'by Blue Brew Music',
      beatColour: 'rgba(230, 230, 250, 0.65)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(blueBrewMusicShiekahTower);
    const turtleSchoolSilentPrincess = {
      url: './assets/audio/silent princess (zelda).mp3',
      songName: 'silent princess (zelda\'s lullaby lofi beat)',
      songAuthor: 'by turtleschool',
      beatColour: 'rgba(186, 85, 211, 0.5)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(turtleSchoolSilentPrincess);
    const ezekielusZorasDomain = {
      url: './assets/audio/Zora\'s Domain (lofi hip hop remix).mp3',
      songName: 'Zora\'s Domain (lofi hip hop remix)',
      songAuthor: 'by Ezekielus',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: '_ABFkqIeKts'
    };
    this.audioLibrary.push(ezekielusZorasDomain);
    const krisSukkarBotwChill = {
      url: './assets/audio/Breath Of The Wild Chill Remix.mp3',
      songName: 'Breath Of The Wild Chill Remix',
      songAuthor: 'by Kris Sukkar',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(krisSukkarBotwChill);
    const wizardOfLonelinessCookinInHateno = {
      url: './assets/audio/Cookin In Hateno Village.mp3',
      songName: 'Cookin In Hateno Village',
      songAuthor: 'by Wizard of Loneliness',
      beatColour: 'rgba(255, 165, 0, 0.75)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(wizardOfLonelinessCookinInHateno);
    const wizardOfLonelinessCalmGrindTarreyTown = {
      url: './assets/audio/Calm Grind In Tarrey Town.mp3',
      songName: 'Calm Grind In Tarrey Town',
      songAuthor: 'by Wizard of Loneliness',
      beatColour: 'rgba(120, 55, 55, 0.75)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(wizardOfLonelinessCalmGrindTarreyTown);
    const kenkuraExtendedStay = {
      url: './assets/audio/Extended Stay (Zelda Music).mp3',
      songName: 'Extended Stay (Zelda Music)',
      songAuthor: 'by Kenkura',
      beatColour: 'rgba(212, 175, 55, 0.85)',
      youtubeId: 'sh7HJGDpeE0'
    };
    this.audioLibrary.push(kenkuraExtendedStay);
    const kamiZorasDomainLofi = {
      url: './assets/audio/Kami Zora\'s Domain (lofi version).mp3',
      songName: 'Zora\'s Domain (lofi version)',
      songAuthor: 'by Kami',
      beatColour: 'rgba(100, 100, 255, 0.5)',
      youtubeId: 'ScJJETH7uoE'
    };
    this.audioLibrary.push(kamiZorasDomainLofi);
    const ljayBotwChillLofi = {
      url: './assets/audio/The Legend of Zelda_ Breath of the Wild (Chill Lo-Fi Remix).mp3',
      songName: 'The Legend of Zelda: Breath of the Wild (Chill Lo-Fi Remix)',
      songAuthor: 'by L - Jay',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'ORYcDNTN3z4'
    };
    this.audioLibrary.push(ljayBotwChillLofi);
    const meoKidRitoVillage = {
      url: './assets/audio/meo kid rito village.mp3',
      songName: 'rito village',
      songAuthor: 'by meo kid',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 't0XHYAtqEis'
    };
    this.audioLibrary.push(meoKidRitoVillage);
    const digitalGreatFairyFountain = {
      url: './assets/audio/zelda great fairy fountain (lofi).mp3',
      songName: 'zelda great fairy fountain (lofi)',
      songAuthor: 'by digital',
      beatColour: 'rgba(255,182,193, 0.85)',
      youtubeId: 'OKkT8lZSLoE'
    };
    this.audioLibrary.push(digitalGreatFairyFountain);
    const cyntheBeatBotwRemix = {
      url: './assets/audio/Remix Zelda breath Of The Wild By cynthé.mp3',
      songName: 'Remix Zelda breath Of The Wild By cynthé',
      songAuthor: 'by cynthé beat',
      beatColour: 'rgba(0, 255, 50, 0.5)',
      youtubeId: 'OKkT8lZSLoE'
    };
    this.audioLibrary.push(cyntheBeatBotwRemix);
    const liltommyjOpenYourEyes = {
      url: './assets/audio/Open Your Eyes (Zelda - Breath of the Wild Remix).mp3',
      songName: 'Open Your Eyes (Zelda: Breath of the Wild Remix)',
      songAuthor: 'by liltommyj',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'xCKRI_3q13Q'
    };
    this.audioLibrary.push(liltommyjOpenYourEyes);
    const gameChopsZeldaLofiHipHop = {
      url: './assets/audio/Ocarina of Chill ▸ Zelda Lofi Hip Hop.mp3',
      songName: 'Ocarina of Chill ▸ Zelda Lofi Hip Hop',
      songAuthor: 'by GameChops',
      beatColour: 'rgba(0, 255, 10, 0.85)',
      youtubeId: 'HnV4uOhuaw4'
    };
    this.audioLibrary.push(gameChopsZeldaLofiHipHop);
    const gameChopsTalTalHeightsRemix = {
      url: './assets/audio/Dj CUTMAN - Mountain Range (Zelda - TalTal Heights Remix) - Meow Meow & Bow Wow - GameChops.mp3',
      songName: 'Mountain Range (Zelda: TalTal Heights Remix)',
      songAuthor: 'by Dj CUTMAN',
      beatColour: 'rgba(139, 69, 19, 0.75)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(gameChopsTalTalHeightsRemix);
    const coffeeDateOutsetIsland = {
      url: './assets/audio/Zelda - Wind Waker ▸ Outset Island _ Coffee Date Lofi Remix.mp3',
      songName: 'Zelda: Wind Waker ▸ Outset Island ~ Coffee Date Lofi Remix',
      songAuthor: 'by Coffee Date',
      beatColour: 'rgba(65, 105, 225, 0.75)',
      youtubeId: 'ajndmZ5B3a8'
    };
    this.audioLibrary.push(coffeeDateOutsetIsland);
    const gameChopsSmoothMcGrooveOutsetIsland = {
      url: './assets/audio/Zelda Windwaker ▸ Outset Island ▸ Grimecraft and CG5 Remix.mp3',
      songName: 'Zelda Windwaker ▸ Outset Island ▸ Grimecraft and CG5 Remix',
      songAuthor: 'by Smooth McGroove & GameChops',
      beatColour: 'rgba(0, 100, 255, 0.75)',
      youtubeId: 'ajndmZ5B3a8'
    };
    this.audioLibrary.push(gameChopsSmoothMcGrooveOutsetIsland);
    const jonasDuzzledLoFiOfTheGoddess = {
      url: './assets/audio/LoFi of the Goddess ▸ Legend of Zelda.mp3',
      songName: 'LoFi of the Goddess ▸ Legend of Zelda',
      songAuthor: 'by Jonas & Duzzled',
      beatColour: 'rgba(105, 205, 105, 0.5)',
      youtubeId: 'r4tHItL1xLs'
    };
    this.audioLibrary.push(jonasDuzzledLoFiOfTheGoddess);
    const chuckNoneFairyFountain = {
      url: './assets/audio/Chuck None - Fairy Fountain (Legend Of Zelda).mp3',
      songName: 'Chuck None - Fairy Fountain (Legend Of Zelda)',
      songAuthor: 'by Chuck None',
      beatColour: 'rgba(255,182,193, 0.85)',
      youtubeId: 'OKkT8lZSLoE'
    };
    this.audioLibrary.push(chuckNoneFairyFountain);
    const toniLeysDangerousToGoAlone = {
      url: './assets/audio/toniLeysDangerousToGoAlonemp3.mp3',
      songName: 'Zelda ▸ It\'s Dangerous To Go Alone ~ Toni Leys Remix',
      songAuthor: 'by Toni Leys',
      beatColour: 'rgba(154, 205, 50, 0.75)',
      youtubeId: 'OKkT8lZSLoE'
    };
    this.audioLibrary.push(toniLeysDangerousToGoAlone);
    const helyntAstralObservatory = {
      url: './assets/audio/Astral Observatory (feat. Dj Cutman) - Super LoFi World - Helynt.mp3',
      songName: 'Astral Observatory (feat. Dj Cutman) - Super LoFi World - Helynt',
      songAuthor: 'by Helynt',
      beatColour: 'rgba(0, 100, 255, 0.75)',
      youtubeId: '_HdIGu5T7l0'
    };
    this.audioLibrary.push(helyntAstralObservatory);
    const djCutmanVistingOldFriend = {
      url: './assets/audio/Visting an Old Friend (Links Awakening).mp3',
      songName: 'Visting an Old Friend (Link\'s Awakening)',
      songAuthor: 'by Dj CUTMAN',
      beatColour: 'rgba(112, 128, 144, 0.85)',
      youtubeId: 'tAfSAalYCVI'
    };
    this.audioLibrary.push(djCutmanVistingOldFriend);
    const duzzledMarinsHouse = {
      url: './assets/audio/Duzzled Link\'s Awakening - Marin\'s House (Remix).mp3',
      songName: 'Link\'s Awakening - Marin\'s House (Remix)',
      songAuthor: 'by Duzzled',
      beatColour: 'rgba(0, 100, 255, 0.85)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(duzzledMarinsHouse);
    const player2WindWakerRemix = {
      url: './assets/audio/player2-the-legend-of-zelda-wind-waker.mp3',
      songName: 'The Legend of Zelda - Wind Waker (Player2 Remix)',
      songAuthor: 'by Player2',
      beatColour: 'rgba(30, 144, 255, 0.85)',
      youtubeId: 'ajndmZ5B3a8'
    };
    this.audioLibrary.push(player2WindWakerRemix);
    const djCutmanBalladOfTheWindFish = {
      url: './assets/audio/Dj CUTMAN and Spamtron Ballad Of The Wind Fish.mp3',
      songName: 'Ballad Of The Wind Fish',
      songAuthor: 'by Dj CUTMAN and Spamtron',
      beatColour: 'rgba(135, 206, 250, 0.85)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(djCutmanBalladOfTheWindFish);
    const bloodCodeBalladOfTheWindFish = {
      url: './assets/audio/Link\'s Awakening ▸ Ballad of the Wind Fish _ Lofi Hip Hop Remix.mp3',
      songName: 'Link\'s Awakening ▸ Ballad of the Wind Fish ~ Lofi Hip Hop Remix',
      songAuthor: 'by Blood Code',
      beatColour: 'rgba(100, 50, 255, 0.5)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(bloodCodeBalladOfTheWindFish);
    const chewieGateOfTime = {
      url: './assets/audio/The Legend of Zelda_ Skyward Sword - Gate of Time (Arrangement).mp3',
      songName: 'Zelda: Skyward Sword ▸ Gate of Time ~ Chewie Lofi Hip Hop Remix',
      songAuthor: 'by Chewie',
      beatColour: 'rgba(147, 112, 219, 0.5)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(chewieGateOfTime);
    const vectorUTalTalHeights = {
      url: './assets/audio/zelda-links-awakening-tal-tal-heights-vector-u-remi.mp3',
      songName: 'Zelda - Link\'s Awakening: Tal Tal Heights (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(255, 105, 180, 0.85)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(vectorUTalTalHeights);
    const glasysDarkWorld = {
      url: './assets/audio/GLASYS - Dark World (Zelda cover).mp3',
      songName: 'Zelda: Dark World ~ Synth Performance by Glasys',
      songAuthor: 'by Glasys',
      beatColour: 'rgba(128, 0, 0, 0.85)',
      youtubeId: '7gmkeZyWkXM'
    };
    this.audioLibrary.push(glasysDarkWorld);
    const chuckNoneLostWoods = {
      url: './assets/audio/Chuck None - Lost Woods (Legend of Zelda).mp3',
      songName: 'Chuck None - Lost Woods (Legend of Zelda)',
      songAuthor: 'by Chuck None',
      beatColour: 'rgba(107, 142, 35, 0.85)',
      youtubeId: 'wKnXURkR1ng'
    };
    this.audioLibrary.push(chuckNoneLostWoods);
    const besso0GonZealousZora = {
      url: './assets/audio/Besso0 & GonZealous - Zora.mp3',
      songName: 'Besso0 & GonZealous - Zora\'s Domain (Lo-fi Hip Hop Edit)',
      songAuthor: 'by Besso0 & GonZealous',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'Owbnvee4JLc'
    };
    this.audioLibrary.push(besso0GonZealousZora);
    const tinyWavesPhoneticHero = {
      url: './assets/audio/Phonetic Hero - Goddess (Zelda.mp3',
      songName: 'Phonetic Hero - Goddess (Zelda\'s Lullaby)',
      songAuthor: 'by Tiny Waves',
      beatColour: 'rgba(255, 255, 100, 0.5)',
      youtubeId: 'r4tHItL1xLs'
    };
    this.audioLibrary.push(tinyWavesPhoneticHero);
    const tinyWavesRitoVillage = {
      url: './assets/audio/Besso0 & GonZealous - Rito Village (Lo-fi Edit).mp3',
      songName: 'Besso0 & GonZealous - Rito Village (Lo-fi Edit)',
      songAuthor: 'by Tiny Waves',
      beatColour: 'rgba(20, 150, 255, 0.5)',
      youtubeId: '8Ibu6uLJgl4'
    };
    this.audioLibrary.push(tinyWavesRitoVillage);
    const vectorUDarkWorld = {
      url: './assets/audio/Zelda_ Dark World (Vector U Remix).mp3',
      songName: 'Zelda: Dark World (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(255, 0, 0, 0.5)',
      youtubeId: 'FaFbzH6xd1o'
    };
    this.audioLibrary.push(vectorUDarkWorld);
    const vectorUKoopasRoad = {
      url: './assets/audio/Vector U_Super Mario 64_ Koopa.mp3',
      songName: 'Super Mario 64: Koopa\'s Road (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(255, 50, 0, 0.5)',
      youtubeId: 'NdpaJH0ZEuU'
    };
    this.audioLibrary.push(vectorUKoopasRoad);
    const vectorUMilkBar = {
      url: './assets/audio/vectorUMilkBar.mp3',
      songName: 'Zelda - Majora\'s Mask: Milk Bar (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(255, 255, 255, 0.6)',
      youtubeId: 'EXwn_zu-Q9A'
    };
    this.audioLibrary.push(vectorUMilkBar);
    const vectorUSongOfHealing = {
      url: './assets/audio/vectorUSongOfHealing.mp3',
      songName: 'Zelda - Majora\'s Mask: Song Of Healing (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(0, 200, 0, 0.5)',
      youtubeId: 'dqc4gno0Hso'
    };
    this.audioLibrary.push(vectorUSongOfHealing);
    const vectorUDragonRoost = {
      url: './assets/audio/Zelda - The Wind Waker_ Dragon Roost Island (Vector U Remix).mp3',
      songName: 'Zelda - The Wind Waker: Dragon Roost Island (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(255, 20, 80, 0.5)',
      youtubeId: 'Phh-CEOA7fc'
    };
    this.audioLibrary.push(vectorUDragonRoost);
    const vectorUMabeVillage = {
      url: './assets/audio/Zelda - Links Awakening Mabe Village (Vector U Remix).mp3',
      songName: 'Zelda - Link\'s Awakening: Mabe Village (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(60, 200, 60, 0.5)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(vectorUMabeVillage);
    const vectorUTwilightPrincessHyruleField = {
      url: './assets/audio/Zelda - Twilight Princess_ Hyrule Field (Vector U Remix).mp3',
      songName: 'Zelda - Twilight Princess: Hyrule Field (Vector U Remix)',
      songAuthor: 'by Vector U',
      beatColour: 'rgba(60, 200, 60, 0.5)',
      youtubeId: 'cRse4leqXgc'
    };
    this.audioLibrary.push(vectorUTwilightPrincessHyruleField);
    setTimeout(() => {
      const qumuRainbowRoad = {
        url: './assets/audio/Mario Kart 64 - Rainbow Road (Qumu Remix).mp3',
        songName: 'Mario Kart 64 - Rainbow Road (Qumu Remix)',
        songAuthor: 'by Qumu',
        beatColour: this.getRainbowGradient(),
        youtubeId: 'FuX5_OWObA0'
      };
      this.audioLibrary.push(qumuRainbowRoad);
    }, 1500);
    const qumuSpiritTracksOverworld = {
      url: './assets/audio/LoZ spirit tracks- Realm Overworld [Remix] by Qumu.mp3',
      songName: 'The Legend of Zelda: Spirit Tracks - Realm Overworld [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(255, 127, 80, 0.75)',
      youtubeId: '1-tJnmNP5ow'
    };
    this.audioLibrary.push(qumuSpiritTracksOverworld);
    const qumuSwordSearch = {
      url: './assets/audio/The Legend of Zelda - Link\'s Awakening - Sword Search [Lofi _ Chill Remix].mp3',
      songName: 'The Legend of Zelda: Link\'s Awakening - Sword Search [Lofi / Chill Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(154, 205, 50, 0.5)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(qumuSwordSearch);
    const qumuDragonRoost = {
      url: './assets/audio/The Legend of Zelda - The Wind Waker - Dragon Roost Island [Remix].mp3',
      songName: 'The Legend of Zelda: The Wind Waker - Dragon Roost Island [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(220, 20, 60, 0.85)',
      youtubeId: 'ajndmZ5B3a8'
    };
    this.audioLibrary.push(qumuDragonRoost);
    const qumuHatenoVillage = {
      url: './assets/audio/The Legend of Zelda - The Wind Waker - Dragon Roost Island [Remix].mp3',
      songName: 'The Legend of Zelda - Breath of the Wild - Hateno Village [Lofi / Chill Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(165, 42, 42, 0.85)',
      youtubeId: 'UqeKNyHaA3g'
    };
    this.audioLibrary.push(qumuHatenoVillage);
    const qumuDarkmoonCaverns = {
      url: './assets/audio/Diddy Kong Racing - Darkmoon Caverns [Remix].mp3',
      songName: 'Diddy Kong Racing - Darkmoon Caverns [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(75, 0, 130, 0.85)',
      youtubeId: 'kNzDhsgRJxI'
    };
    this.audioLibrary.push(qumuDarkmoonCaverns);
    const qumuKassTheme = {
      url: './assets/audio/The Legend of Zelda_ Breath of the Wild - Kass.mp3',
      songName: 'The Legend of Zelda: Breath of the Wild - Kass Theme [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'TP061wI3chs'
    };
    this.audioLibrary.push(qumuKassTheme);
    const qumuOutsetIsland = {
      url: './assets/audio/The Legend of Zelda_ The Wind Waker - Outset Island [Remix].mp3',
      songName: 'The Legend of Zelda: The Wind Waker - Outset Island [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(0, 255, 255, 0.5)',
      youtubeId: 'ajndmZ5B3a8'
    };
    this.audioLibrary.push(qumuOutsetIsland);
    const qumuKoumeAndKotake = {
      url: './assets/audio/The Legend of Zelda_ Ocarina of Time - Koume and Kotake (Twinrova).mp3',
      songName: 'The Legend of Zelda: Ocarina of Time - Koume and Kotake (Twinrova)',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(210, 105, 30, 0.85)',
      youtubeId: 'bnTkFf7gJGE'
    };
    this.audioLibrary.push(qumuKoumeAndKotake);
    const qumuCallingFourGiants = {
      url: './assets/audio/Legend of Zelda_ Majora_Calling the Four Giants_Qumu.mp3',
      songName: 'Legend of Zelda: Majora\'s Mask - Calling the Four Giants - Reorchestrated',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(178, 34, 34, 0.85)',
      youtubeId: 'kROittKt-R8'
    };
    this.audioLibrary.push(qumuCallingFourGiants);
    const qumuHyruleField = {
      url: './assets/audio/Legend of Zelda - Ocarina of Time  - Hyrule Field [Remix].mp3',
      songName: 'Legend of Zelda: Ocarina of Time - Hyrule Field [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(34, 139, 34, 0.75)',
      youtubeId: 'HnV4uOhuaw4'
    };
    this.audioLibrary.push(qumuHyruleField);
    const qumuZeldasLullabyLofi = {
      url: './assets/audio/Zelda\'s Lullaby [Lofi _ Chill Remix].mp3',
      songName: 'Zelda\'s Lullaby [Lofi / Chill Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(186, 85, 211, 0.5)',
      youtubeId: 'qSlCTNxbhwU'
    };
    this.audioLibrary.push(qumuZeldasLullabyLofi);
    const qumuLaOverworld = {
      url: './assets/audio/The Legend of Zelda - Link\'s Awakening - Overworld [Remix].mp3',
      songName: 'The Legend of Zelda: Link\'s Awakening - Overworld [Remix]',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(50, 205, 50, 0.5)',
      youtubeId: 'ZROB4TnYH_I'
    };
    this.audioLibrary.push(qumuLaOverworld);
    const qumuMidnasLament = {
      url: './assets/audio/Qumu Legend of Zelda Twilight Princess - Midna.mp3',
      songName: 'Legend of Zelda Twilight Princess - Midna\'s Lament - Remix',
      songAuthor: 'by Qumu',
      beatColour: 'rgba(0,  255, 127, 0.5)',
      youtubeId: 'Wj74_yHw0-0'
    };
    this.audioLibrary.push(qumuMidnasLament);
    const robMirandaSpiritFlute = {
      url: './assets/audio/Spirit Flute (The Legend Of Zelda Spirit Tracks Cover).mp3',
      songName: 'Spirit Flute (The Legend Of Zelda Spirit Tracks Cover)',
      songAuthor: 'by Rob Miranda',
      beatColour: 'rgba(220, 20, 60, 0.85)',
      youtubeId: '1-tJnmNP5ow'
    };
    this.audioLibrary.push(robMirandaSpiritFlute);
    const vgrSongOfStorms = {
      url: './assets/audio/VGR The Legend Of Zelda - Song Of Storms (Remix).mp3',
      songName: 'The Legend Of Zelda - Song Of Storms (Remix)',
      songAuthor: 'by Video Game Remixes',
      beatColour: 'rgba(245, 245, 245, 0.5)',
      youtubeId: 'Y1r3qWNEh7s'
    };
    this.audioLibrary.push(vgrSongOfStorms);
    const jukeRemixMinishVillage = {
      url: './assets/audio/JukeRemix_Zelda_ The Minish Cap - Minish Village [Remake].mp3',
      songName: 'Zelda: The Minish Cap - Minish Village [Remake]',
      songAuthor: 'by Juke Remix',
      beatColour: 'rgba(178, 34, 34, 0.75)',
      youtubeId: 'mvL2LBLJSjc'
    };
    this.audioLibrary.push(jukeRemixMinishVillage);
    const jonnyDesutoroiyaMinishWoods = {
      url: './assets/audio/The Legend Of Zelda The Minish Cap - Minish Woods (Jonny Desutoroiyā Remix).mp3',
      songName: 'The Legend Of Zelda The Minish Cap - Minish Woods (Jonny Desutoroiyā Remix)',
      songAuthor: 'by Jonny Desutoroiyā',
      beatColour: 'rgba(0, 255, 50, 0.5)',
      youtubeId: 'zVJlHipL8_0'
    };
    this.audioLibrary.push(jonnyDesutoroiyaMinishWoods);
    const jakenVaatisRevenge = {
      url: './assets/audio/The Elemental Sanctuary (Vaati\'s Revenge Minish Cap Remix).mp3',
      songName: 'The Elemental Sanctuary (Vaati\'s Revenge Minish Cap Remix)',
      songAuthor: 'by JAKEN',
      beatColour: 'rgba(255, 100, 255, 0.5)',
      youtubeId: 'm5oeAXrn6v0'
    };
    this.audioLibrary.push(jakenVaatisRevenge);
    const nintilinkDarkHyruleCastle = {
      url: './assets/audio/Legend of Zelda The Minish Cap - Dark Hyrule Castle _ by Nintilink.mp3',
      songName: 'Legend of Zelda The Minish Cap - Dark Hyrule Castle',
      songAuthor: 'by Nintilink',
      beatColour: 'rgba(255, 0, 0, 0.5)',
      youtubeId: '6NsnoRlZ-Bo'
    };
    this.audioLibrary.push(nintilinkDarkHyruleCastle);
    const tirianMassotHouseHyruleTownPicoriFestivalMinigame = {
      url: './assets/audio/The Legend of Zelda_ The Minish Cap - Part 2_ House, Hyrule Town, Picori Festival & Minigame.mp3',
      songName: 'The Legend of Zelda: The Minish Cap - Part 2: House, Hyrule Town, Picori Festival & Minigame',
      songAuthor: 'by Tirian Massot',
      beatColour: 'rgba(120, 155, 55, 0.5)',
      youtubeId: 'qxOt-nhe0Kc'
    };
    this.audioLibrary.push(tirianMassotHouseHyruleTownPicoriFestivalMinigame);
    const smoothMcGrooveTpLakeHylia = {
      url: './assets/audio/Zelda_ Twilight Princess - Lake Hylia Smooth McGroove Acapella.mp3',
      songName: 'Zelda: Twilight Princess - Lake Hylia Acapella',
      songAuthor: 'by Smooth McGroove',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 'YuVo5TS3--Q'
    };
    this.audioLibrary.push(smoothMcGrooveTpLakeHylia);
    const hotlineSehwaniSacredGrove = {
      url: './assets/audio/ZELDA_ Sacred Grove ｌｏｆｉ恩ぞス【_ＲＥＭＩＸ】Legend of Zelda Twilight Princess.mp3',
      songName: 'ZELDA: Sacred Grove ｌｏｆｉ恩ぞス【﻿ＲＥＭＩＸ】Legend of Zelda Twilight Princess',
      songAuthor: 'by Hotline Sehwani',
      beatColour: 'rgba(250, 250, 50, 0.5)',
      youtubeId: 'fa_lGwlsLao'
    };
    this.audioLibrary.push(hotlineSehwaniSacredGrove);
    const supershigiFisThemeVocal = {
      url: './assets/audio/Supershigi Legend of Zelda  Skyward Sword - Fi.mp3',
      songName: 'Legend of Zelda Skyward Sword - Fi\'s Theme (vocal remix)',
      songAuthor: 'by Supershigi',
      beatColour: 'rgba(0, 100, 255, 0.5)',
      youtubeId: 't6eVkWEcBCQ'
    };
    this.audioLibrary.push(supershigiFisThemeVocal);
    const polasterBambooIslandLofi = {
      url: './assets/audio/Polaster Zelda Skyward Sword - Bamboo Island (Lofi Hip Hop Remix).mp3',
      songName: 'Zelda Skyward Sword - Bamboo Island (Lofi Hip Hop Remix)',
      songAuthor: 'by Polaster',
      beatColour: 'rgba(0, 255, 25, 0.5)',
      youtubeId: 'HJKefg_rIYc'
    };
    this.audioLibrary.push(polasterBambooIslandLofi);
    const mindshiftLanayruMiningFacility = {
      url: './assets/audio/Zelda Skyward Sword - Lanayru Mining Facility (MindShift Remix).mp3',
      songName: 'Zelda Skyward Sword - Lanayru Mining Facility (MindShift Remix)',
      songAuthor: 'by ıllıllı m̷i̷n̷d̷s̷h̷i̷f̷t̷ ıllıllı',
      beatColour: 'rgba(194, 178, 128, 0.5)',
      youtubeId: 'uVcMjjU7J5w'
    };
    this.audioLibrary.push(mindshiftLanayruMiningFacility);
    const jukeRemixSkyloft = {
      url: './assets/audio/Juke Remix Zelda_ Skyward Sword - Skyloft [Remake].mp3',
      songName: 'Zelda: Skyward Sword - Skyloft [Remake]',
      songAuthor: 'by Juke Remix',
      beatColour: 'rgba(255, 0, 0, 0.85)',
      youtubeId: 'YakHbkChQaI'
    };
    this.audioLibrary.push(jukeRemixSkyloft);
    const xoraSkywardSwordBazaar = {
      url: './assets/audio/TLoZ Skyward Sword - Bazaar (Xora Remix).mp3',
      songName: 'TLoZ Skyward Sword - Bazaar (Xora Remix)',
      songAuthor: 'by Xora',
      beatColour: 'rgba(212, 175, 55, 0.85)',
      youtubeId: 'BbEbl_GBLO4'
    };
    this.audioLibrary.push(xoraSkywardSwordBazaar);
    const jukeRemixIslandInTheSky = {
      url: './assets/audio/Juke Remix Zelda_ Skyward Sword - Island In The Sky [Remake].mp3',
      songName: 'Zelda: Skyward Sword - Island In The Sky [Remake]',
      songAuthor: 'by Juke Remix',
      beatColour: 'rgba(193, 190, 186, 0.5)',
      youtubeId: 'uVcMjjU7J5w'
    };
    this.audioLibrary.push(jukeRemixIslandInTheSky);
    const djJoMolgeraBattleTheme = {
      url: './assets/audio/Molgera Battle Theme (Dubstep Remix).mp3',
      songName: 'Molgera Battle Theme (Dubstep Remix)',
      songAuthor: 'by dj-Jo',
      beatColour: 'rgba(255, 69, 0, 0.5)',
      youtubeId: 'c5bNrAXaT4M'
    };
    this.audioLibrary.push(djJoMolgeraBattleTheme);
  const smoothMcGrooveHyruleTemple = {
      url: './assets/audio/Smooth McGroove Hyrule Temple (Legend of Zelda Remix).mp3',
      songName: 'Hyrule Temple (Legend of Zelda Remix)',
      songAuthor: 'by dj-Jo and Smooth McGroove',
      beatColour: 'rgba(255, 50, 0, 0.5)',
      youtubeId: 'iQ_r_TCDG58'
    };
    this.audioLibrary.push(smoothMcGrooveHyruleTemple);
    const vgrSpiritTracksSacredDuet = {
      url: './assets/audio/VGR The Legend Of Zelda Spirit Tracks - Sacred Duet (Remix).mp3',
      songName: 'The Legend Of Zelda Spirit Tracks - Sacred Duet (Remix)',
      songAuthor: 'by Video Game Remixes',
      beatColour: 'rgba(212, 175, 55, 0.85)',
      youtubeId: '1-tJnmNP5ow'
    };
    this.audioLibrary.push(vgrSpiritTracksSacredDuet);
    const dagustSkywardSwordFisTheme = {
      url: './assets/audio/VGR Dagust The Legend of Zelda (Skyward Sword) - Fi.mp3',
      songName: 'The Legend of Zelda (Skyward Sword) - Fi\'s Theme (Dasgust Remix)',
      songAuthor: 'by Dagust',
      beatColour: 'rgba(75, 100, 255, 0.5)',
      youtubeId: '1-tJnmNP5ow'
    };
    this.audioLibrary.push(dagustSkywardSwordFisTheme);
    const jeeshHeroOfTime = {
      url: './assets/audio/Hero Of Time - The Legend Of Zelda Remix  - Jeesh.mp3',
      songName: 'Hero Of Time - The Legend Of Zelda Remix - Jeesh',
      songAuthor: 'by Jeesh',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'ak_ujxsRG1I'
    };
    this.audioLibrary.push(jeeshHeroOfTime);
    const defalcoSariasSong = {
      url: './assets/audio/JMKM & DeFalco - Saria.mp3',
      songName: 'JMKM & DeFalco - Saria\'s Song (feat. Ka\'ala)',
      songAuthor: 'by 🐬defalco🐬',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'SU5rUqZjK7k'
    };
    this.audioLibrary.push(defalcoSariasSong);
    const skrubilonibusZeldaChilKakarikoVillage = {
      url: './assets/audio/Zelda & Chill - Kakariko Village.mp3',
      songName: 'Zelda & Chill - Kakariko Village',
      songAuthor: 'by Skrubilonibus',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'Je89wXwiNhI'
    };
    this.audioLibrary.push(skrubilonibusZeldaChilKakarikoVillage);
    const jtbsGreenheart = {
      url: './assets/audio/Greenheart _ Ocarina of Time _ Hip Hop [Sampled].mp3',
      songName: 'Greenheart | Ocarina of Time | Hip Hop [Sampled]',
      songAuthor: 'by j t b s',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'PZVmAR5UuZM'
    };
    this.audioLibrary.push(jtbsGreenheart);
    const alanGeeSheiksTheme = {
      url: './assets/audio/Alan Gee Sheiks Theme - Hip Hop Remix.mp3',
      songName: 'Sheik\'s Theme - Hip Hop Remix - Ocarina of Time - Koji Kondo',
      songAuthor: 'by Alan Gee',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'Ko2oOJ8M_BE'
    };
    this.audioLibrary.push(alanGeeSheiksTheme);
    const alanGeeGreatFairysFountainTheme = {
      url: './assets/audio/Alan Gee Great Fairy Theme Hip Hop Remix.mp3',
      songName: 'Great Fairy\'s Fountain Theme - The Legend of Zelda - Hip Hop Remix - Koji Kondo',
      songAuthor: 'by Alan Gee',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'OKkT8lZSLoE'
    };
    this.audioLibrary.push(alanGeeGreatFairysFountainTheme);
    const raisiSuperMario3XZeldaPatience = {
      url: './assets/audio/SuperMario3XZelda_Patience_TheThrowaways2_RealDealRaisi_K.mp3',
      songName: 'Super Mario 3 X Zelda | Patience | #TheThrowaways2 | @RealDealRaisi_K',
      songAuthor: 'by Raisi K. the RaisinMan',
      beatColour: 'rgba(0, 255, 100, 0.5)',
      youtubeId: 'Gf969TVazxE'
    };
    this.audioLibrary.push(raisiSuperMario3XZeldaPatience);
  }

  onCanvasClick() {
    this.canvasToggle = !this.canvasToggle;
  }

  playNextSong() {
    this.playingLibraryIndex < this.audioLibrary.length - 1 ? this.playingLibraryIndex++ : this.playingLibraryIndex = 0;
    this.source.mediaElement.src = this.audioLibrary[this.playingLibraryIndex].url;
    this.beatColour = this.audioLibrary[this.playingLibraryIndex].beatColour;
    this.source.mediaElement.load();
    this.source.mediaElement.play().then();
    this.updateYoutubeVideo();
  }

  updateYoutubeVideo() {
    if (this.youtubeElement) {
      // Remove existing child elements
      const childElements = this.youtubeElement.nativeElement.children;
      for (const child of childElements) {
        this.renderer.removeChild(this.youtubeElement.nativeElement, child);
      }
      // Add new child element
      this.youtubeId = this.audioLibrary[this.playingLibraryIndex].youtubeId;
      this.youtubeIFrame = this.renderer.createElement('iframe');
      this.youtubeIFrame.className = 'audio-viz-video-bg';
      this.youtubeIFrame.frameBorder = '0';
      this.youtubeIFrame.src = `https://youtube.com/embed/${this.youtubeId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0`;
      this.renderer.appendChild(this.youtubeElement.nativeElement, this.youtubeIFrame);
    }
  }

  playRandomSong() {
    this.playingLibraryIndex = Math.floor(Math.random() * (this.audioLibrary.length));
    this.playNextSong();
  }

  getAudioContext() {
    this.audioCtx = new AudioContext();
    this.analyser = this.audioCtx.createAnalyser();
    this.source = this.audioCtx.createMediaElementSource(this.audio);
    this.source.mediaElement.onended = () => {
      this.playNextSong();
    };
    this.source.mediaElement.play().then();
    this.source.connect(this.analyser);
    this.analyser.fftSize = 2048;
    this.fftLen = this.analyser.frequencyBinCount;
    this.fft = new Uint8Array(this.fftLen);
    this.analyser.connect(this.audioCtx.destination);
    this.visualizeAnalyser();
  }

  visualizeAnalyser() {
    setInterval(() => {
      const dataArray = new Float32Array(this.analyser.frequencyBinCount);
      if (this.canvasToggle) {
        this.analyser.getFloatTimeDomainData(dataArray);
      } else {
        this.analyser.getFloatFrequencyData(dataArray);
      }
      const filtered = this.getFilteredRawData(dataArray);
      const normalised = this.getNormalisedAudioData(filtered);
      this.draw(normalised);
      this.renderBeat(this.canvasBeatLeft.nativeElement);
      this.renderBeat(this.canvasBeatRight.nativeElement);
    }, 30 / 1000);
  }

  renderBeat(canvas) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.lineWidth = 6;
    ctx.strokeStyle = this.beatColour;
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // fill FFT buffer
    this.analyser.getByteFrequencyData(this.fft);

    // average data from some bands
    const v = (this.fft[1] + this.fft[2]) / 512;

    const cx = canvas.width * 0.5;
    const cy = canvas.height * 0.5;
    const radiusMax = Math.min(cx, cy) - 20;
    const radiusMin = radiusMax * 0.1;

    // draw arc using interpolated range with exp. of v
    ctx.beginPath();
    ctx.arc(cx, cy, radiusMin + (radiusMax - radiusMin) * v * v * v * v, 0, 6.28);
    ctx.closePath();
    ctx.stroke();

    // feedback effect
    ctx.drawImage(canvas, -8, -8,
      canvas.width + 16, canvas.height + 16);
  }

  visualizeAudioStatic(url) {
    fetch(url)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => this.audioCtx?.decodeAudioData(arrayBuffer))
      .then(audioBuffer => {
        const filtered = this.getFilteredAudioData(audioBuffer);
        const normalised = this.getNormalisedAudioData(filtered);
        this.draw(normalised);
      });
  }

  getFilteredRawData(rawData: Float32Array | Uint8Array): any[] {
    const samples = 64; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
  }

  getFilteredAudioData(audioBuffer: AudioBuffer): any[] {
    const rawData: Float32Array = audioBuffer?.getChannelData(0);  // We only need to work with one channel of data
    const samples = 256; // Number of samples we want to have in our final data set
    const blockSize = Math.floor(rawData?.length / samples); // the number of samples in each subdivision
    const filteredData = [];
    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i; // the location of the first sample in the block
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum = sum + Math.abs(rawData[blockStart + j]); // find the sum of all the samples in the block
      }
      filteredData.push(sum / blockSize); // divide the sum by the block size to get the average
    }
    return filteredData;
  }

  getNormalisedAudioData(filteredData: any): any[] {
    const multiplier = Math.pow(Math.max(...filteredData), -1);
    return filteredData.map(n => n * multiplier);
  }

  draw(normalizedData) {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const padding = 20;
    this.canvas.nativeElement.width = this.canvas.nativeElement.offsetWidth * dpr;
    this.canvas.nativeElement.height = (this.canvas.nativeElement.offsetHeight + padding * 2) * dpr;
    this.ctx.scale(dpr, dpr);
    this.ctx.translate(0, this.canvas.nativeElement.offsetHeight * 0.6 + padding);  // Set Y = 0 to be in the middle of the canvas

    // draw the line segments
    const width = this.canvas.nativeElement.offsetWidth / normalizedData.length;
    // console.log('normalizedData:', normalizedData);
    for (let i = 0; i < normalizedData.length; i++) {
      const x = width * i;
      let height = normalizedData[i] * this.canvas.nativeElement.offsetHeight - padding;
      if (height < 0) {
        height = 0;
      } else if (height > this.canvas.nativeElement.offsetHeight * 0.6) {
        height = 1;
      }
      // console.log('drawLineSegment:', x, height, width, (i + 1) % 2);
      this.drawLineSegment(this.ctx, x, height, width, (i + 1) % 2, i, normalizedData.length);
    }
  }

  getRainbowGradient(): CanvasGradient {
    if (this.ctx) {
      const rainbowGradient = this.ctx.createRadialGradient(0, 0,
        0.1,
        this.canvas.nativeElement.width / 2,
        this.canvas.nativeElement.height / 2,
        245);
      rainbowGradient.addColorStop(0, 'red');
      rainbowGradient.addColorStop(2.8 / 6, 'red');
      rainbowGradient.addColorStop(3.1 / 6, 'orange');
      rainbowGradient.addColorStop(3.25 / 6, 'yellow');
      rainbowGradient.addColorStop(3.5 / 6, 'green');
      rainbowGradient.addColorStop(3.75 / 6, 'blue');
      rainbowGradient.addColorStop(3.9 / 6, 'indigo');
      rainbowGradient.addColorStop(4 / 6, 'violet');
      rainbowGradient.addColorStop(1, 'violet');
      return rainbowGradient;
    }
  }

  drawLineSegment(ctx, x, y, width, isEven, i, length) {
    ctx.lineWidth = 1; // how thick the line is
    if (i < (length / 7)) {
      ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)'; // what color our line is
    } else if (i < (length / 7) * 2) {
      ctx.strokeStyle = 'rgba(150, 255, 255, 0.5)'; // what color our line is
    } else if (i < (length / 7) * 3) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'; // what color our line is
    } else if (i < (length / 7) * 4) {
      ctx.strokeStyle = 'rgba(255, 200, 255, 0.5)'; // what color our line is
    } else if (i < (length / 7) * 5) {
      ctx.strokeStyle = 'rgba(255, 150, 255, 0.5)'; // what color our line is
    } else if (i < (length / 7) * 6) {
      ctx.strokeStyle = 'rgba(255, 0, 255, 0.5)'; // what color our line is
    }
    ctx.beginPath();
    y = isEven ? y : -y;
    ctx.moveTo(x, 0);
    ctx.arc(x + width / 2, y * 0.7, width / 2, Math.PI, 0, isEven);
    ctx.lineTo(x + width, 0);
    ctx.stroke();
  }

}


interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}


interface AudioLibraryItem {
  url: string;
  songName: string;
  songAuthor: string;
  beatColour: string | CanvasGradient;
  youtubeId?: string;
}
