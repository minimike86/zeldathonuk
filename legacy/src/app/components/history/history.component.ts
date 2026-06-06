import {Component, OnInit, SecurityContext, ViewChild} from '@angular/core';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';
import { NgbCarousel, NgbSlideEvent, NgbSlideEventSource } from '@ng-bootstrap/ng-bootstrap';
import { PrimeIcons } from 'primeng/api';
import moment from 'moment';


@Component({
  selector: 'app-about',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.css']
})
export class HistoryComponent implements OnInit {

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

  events1: TimelineEvent[];

  constructor( private sanitizer: DomSanitizer ) {
  }

  ngOnInit(): void {
    this.events1 = [
      {status: '2022 #GameBlast22', date: '25/02/2022 09:00', icon: PrimeIcons.CALENDAR, color: '#E71347', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/M08kI--PDfg'), image: '', description: 'We\'re once again joining SpecialEffect\'s GameBlast charity marathon event #GameBlast22! This February please help us to raise more than ever before for this awesome charity!', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022', facebookUrl: 'https://www.facebook.com/donate/5194665980557244/', tiltifyUrl: 'https://donate.tiltify.com/@msec/zeldathonuk-gameblast22'},
      {status: '2021 #GameBlast21', date: '20/02/2021 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/m4mKtnecpcQ'), image: '', description: 'Last years entry into SpecialEffect\'s GameBlast charity marathon event #GameBlast21. Mike and Lottie were on their own this year due to the ongoing COVID-19 pandemic. We still raised over £1000! Thank you!', justGivingUrl: 'https://www.justgiving.com/fundraising/276hr-zelda-marathon-benefitting-specialeffec', facebookUrl: 'https://www.facebook.com/donate/855003971855785/', tiltifyUrl: ''},
      {status: '2020 #GameBlast20', date: '20/02/2020 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/g-S62aWTpEE'), image: '', description: 'The last Zelda Marathon before the COVID-19 pandemic set in. We played all the classic titles like A Link to the Past, Skyward Sword, Ocarina of Time, as well as our first play through of The Legend of Zelda: Link\'s Awakening remake! We finished the marathon with a frantic Hyrule Castle boss rush in Breath of the Wild.', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', facebookUrl: 'https://www.facebook.com/donate/655011391974449/', tiltifyUrl: ''},
      {status: '2019 #GameBlast19', date: '22/02/2019 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/OKsTUKmf2Ao'), image: '', description: 'Our entry to GameBlast19 we started with Matt attempting his first ever play of Minish Cap, before taking on Majora\'s Mask, and Spirit Tracks.', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2019', facebookUrl: 'https://www.facebook.com/donate/235288154058664/', tiltifyUrl: ''},
      {status: '2018 #GameBlast18', date: '20/02/2018 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/3MoUXQHuDAk'), image: '', description: 'What a great year! For GameBlast18 we speed ran Ocarina of Time on the 3DS completing it in under 2 hours, killing Ganon as child link! We completed Wind Waker HD, replayed Breath of the Wild, beat the original Legend of Zelda in under 3 hours, Sir Eggington was created, and Mike did a backflip on stream for a £20 donation!', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2018', facebookUrl: 'https://www.facebook.com/donate/154880338545073/', tiltifyUrl: ''},
      {status: '2017 #GameBlast17', date: '20/02/2017 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/AuSaRPl5XLk'), image: '', description: 'We started GameBlast17 a week later than everyone else so we could do a play through of the newly released Nintendo Switch and Breath of the Wild. We opened the stream with an unboxing and just played BotW exclusively all weekend with all the blood moon bugs that came with it at launch!', justGivingUrl: 'https://www.justgiving.com/fundraising/gameblast17-michael-warner', facebookUrl: '', tiltifyUrl: ''},
      {status: '2015 #GameBlast15', date: '20/02/2015 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl(''), image: 'https://images.jg-cdn.com/image/d8833274-8d08-42f4-8b3a-6a24ae3a8339.jpg?template=fundraisingpageupdatephotom', description: 'Lacking a venue in addition to other academic commitments for GameBlast15; Mike simply ran this years Zeldathon as a 24 hour stream in his dormitory.', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2015', facebookUrl: '', tiltifyUrl: ''},
      {status: '2014 #GameBlast14', date: '20/02/2014 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl(''), image: 'https://images.jg-cdn.com/image/12006ccb-151c-46c4-8e2a-fc0949638a3d.png', description: 'The first ever GameBlast event, and the year we switched from supporting GamesAid to SpecialEffect exclusively! ', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2014', facebookUrl: '', tiltifyUrl: ''},
      {status: '2012 ZeldaGamesAid2', date: '08/04/2013 13:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl(''), image: 'https://pbs.twimg.com/media/FKRi0EVXEAgCudD?format=jpg&name=large', description: 'ZeldaGamesAid #2 Took place in Bournemouth University\'s main entrance. We played through several titles from The Legend of Zelda video game franchise most memorably The Legend of Zelda: Four Swords Adventures on five massive screens all connected to five GameBoy Advance Players, connected to five GameCube consoles, it was nuts!', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldagamesaid2', facebookUrl: '', tiltifyUrl: ''},
      {status: '2011 ZeldaGamesAid', date: '11/11/2011 09:00', icon: PrimeIcons.CHECK, color: '#62182F', src: this.getSafeResourseUrl('https://www.youtube-nocookie.com/embed/YbTsQ-JGaz4'), image: '', description: 'The one that started it all! When Mike was in his first year at university he wanted to emulate the success of mariomarathon.com by running his own charity live stream and roped in a bunch of friends and fellow students to join. Keeping with Nintendo games we picked the Legend of Zelda franchise and instead of Child\'s Play we picked a UK based gaming charity GamesAid (gamesaid.org). Skyward Sword was releasing on the 18th so we began an 11-day long Zelda Marathon raising £1312 for the charity!', justGivingUrl: 'https://www.justgiving.com/fundraising/zeldamarathon', facebookUrl: '', tiltifyUrl: ''}
    ];
  }

  getSafeResourseUrl(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.sanitizer.sanitize(SecurityContext.URL, url));
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

  getYearsSince2011(): number {
    const zeldaGamesAid1 = moment(new Date(Date.parse('11 Nov 2011 09:00:00 GMT')));
    const duration = moment.duration(moment().diff(zeldaGamesAid1));
    return Math.floor(duration.asYears());
  }

}

export interface TimelineEvent {
  status: string;
  date: string;
  icon: PrimeIcons;
  color: string;
  src: SafeResourceUrl;
  image: string;
  description: string;
  justGivingUrl: string;
  facebookUrl: string;
  tiltifyUrl: string;
}
