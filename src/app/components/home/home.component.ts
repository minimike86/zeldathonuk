import { Component, OnInit } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faTwitch, faYoutube, faTwitter } from '@fortawesome/free-brands-svg-icons'

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  faFacebook = faFacebook;
  faTwitch = faTwitch;
  faTwitter = faTwitter;
  faYoutube = faYoutube;
  faInfoCircle = faInfoCircle;

  constructor() { }

  ngOnInit() {
  }

  donateFacebook() {
    window.open('https://www.facebook.com/ZeldathonUK/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast2019', '_blank');
  }

  learnAboutSpecialEffect() {
    window.open('https://www.specialeffect.org.uk/what-we-do', '_blank');
  }

  learnAboutGameBlast() {
    window.open('https://www.gameblast19.org.uk/faq/', '_blank');
  }

}
