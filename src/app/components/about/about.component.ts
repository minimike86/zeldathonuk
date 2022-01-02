import {Component, OnInit, ViewChild} from '@angular/core';
import {NgbCarousel, NgbSlideEvent, NgbSlideEventSource} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

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

  constructor() {
  }

  ngOnInit(): void {
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

}
