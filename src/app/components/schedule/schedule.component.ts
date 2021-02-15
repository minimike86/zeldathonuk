import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbCarousel, NgbSlideEvent, NgbSlideEventSource} from '@ng-bootstrap/ng-bootstrap';
import {Router} from '@angular/router';
import {SearchChannelsData, TwitchService} from '../../services/twitch-service/twitch-service.service';
import {GameLineupService} from '../../services/firebase/game-lineup/game-lineup.service';
import {map} from 'rxjs/operators';
import {GameLineUpId} from '../../services/firebase/game-lineup/game-lineup';
import {ZeldaGame} from '../../models/zelda-game';
import {Observable} from 'rxjs';
import {CurrentlyPlayingService} from '../../services/firebase/currently-playing/currently-playing.service';
import {CountUpService} from '../../services/countup-service/countup.service';
import {CurrentlyPlayingId} from '../../services/firebase/currently-playing/currently-playing';


@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  public currentlyPlaying: string;
  public timer: string;
  public gameLineUp: Map<string, ZeldaGame>;
  public gameList$: Observable<ZeldaGame[]>;

  public images = ['https://images.justgiving.com/image/292f8261-199e-439a-847a-a5f4ad270b07.jpg',
    'https://images.justgiving.com/image/9d54ff22-3185-4a7b-812a-66df7c774ce6.jpg',
    'https://news.bournemouth.ac.uk/wp-content/uploads/2013/05/Zelda.jpg',
    'https://www.bournemouthecho.co.uk/resources/images/9466146.jpg'].map((n) => `${n}`);
  public alts = ['2011', '2011', '2012', '2019'];
  public urls = ['https://www.bournemouthecho.co.uk/news/9390449.gamers-raise-funds-for-charity-with-zelda-marathon/',
    'https://www.bournemouthecho.co.uk/news/9390449.gamers-raise-funds-for-charity-with-zelda-marathon/',
    'https://assets.bournemouth.ac.uk/news-archive/newsandevents/News/2013/apr/contentonly_1_8925_8925.html',
    'https://www.bournemouthecho.co.uk/news/17444417.zeldathonuk-play-legend-zelda-specialeffect/'];
  public paused = false;
  public unpauseOnArrow = false;
  public pauseOnIndicator = false;
  public pauseOnHover = true;
  public pauseOnFocus = true;
  @ViewChild('carousel', {static : true}) carousel: NgbCarousel;

  public now: Date;
  public isLive = false;

  constructor(private router: Router,
              private countUpService: CountUpService,
              private currentlyPlayingService: CurrentlyPlayingService,
              private gameLineUpService: GameLineupService,
              private twitchService: TwitchService) {
  }

  ngOnInit() {
    this.now = new Date();

    this.currentlyPlayingService.getCurrentlyPlaying().pipe(
      map((data: CurrentlyPlayingId[]) => {
        this.currentlyPlaying = data.find(x => x.id === 'CURRENTLY-PLAYING').index;
      })
    ).subscribe();

    this.countUpService.getTimer().pipe(
      map((data: string) => {
        this.timer = data;
      })
    ).subscribe();

    this.twitchService.getSearchChannels('zeldathonuk', 1, false).pipe(
      map((data: SearchChannelsData) => {
        this.isLive = data.is_live;
      })
    ).subscribe();

    this.gameList$ = this.gameLineUpService.getGameLineUp().pipe(
      map((data: GameLineUpId[]) => {
        this.gameLineUp = data.find(x => x.id === 'GAME-LINEUP').gameLineUp;
        return Object.values(this.gameLineUp)
          .filter((x: ZeldaGame) => x.active === true)
          .sort((a: ZeldaGame, b: ZeldaGame) => a.order - b.order);
      }),
    );

  }

  routeToLiveView() {
    this.router.navigate(['']).then();
  }

  togglePaused() {
    if (this.paused) {
      this.carousel.cycle();
    } else {
      this.carousel.pause();
    }
    this.paused = !this.paused;
  }

  onSlide(slideEvent: NgbSlideEvent) {
    if (this.unpauseOnArrow && slideEvent.paused &&
      (slideEvent.source === NgbSlideEventSource.ARROW_LEFT || slideEvent.source === NgbSlideEventSource.ARROW_RIGHT)) {
      this.togglePaused();
    }
    if (this.pauseOnIndicator && !slideEvent.paused && slideEvent.source === NgbSlideEventSource.INDICATOR) {
      this.togglePaused();
    }
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/855003971855785/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/276hr-zelda-marathon-benefitting-specialeffec', '_blank');
  }

  isCurrentlyPlaying(game: ZeldaGame): boolean {
    return game.gameProgressKey === this.currentlyPlaying
        && this.timer !== '00:00:00';
  }

  hasBeenPlayed(game: ZeldaGame): boolean {
    return game.endDate !== undefined
        && game.endDate !== null;
  }

}
