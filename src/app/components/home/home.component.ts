import { Component, HostListener, OnInit } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faFacebook, faTwitch, faYoutube, faTwitter } from '@fortawesome/free-brands-svg-icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  innerWidth: any;

  faDiscord = faDiscord;
  faFacebook = faFacebook;
  faTwitch = faTwitch;
  faTwitter = faTwitter;
  faYoutube = faYoutube;
  faInfoCircle = faInfoCircle;

  constructor() { }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/855003971855785/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/276hr-zelda-marathon-benefitting-specialeffec', '_blank');
  }

  learnAboutSpecialEffect() {
    window.open('https://www.specialeffect.org.uk/what-we-do', '_blank');
  }

  learnAboutGameBlast() {
    window.open('https://www.gameblast.org.uk/about/', '_blank');
  }

}
