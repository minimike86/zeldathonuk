import { Component, HostListener, OnInit } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faFacebook, faTwitch, faYoutube, faTwitter } from '@fortawesome/free-brands-svg-icons';

import { ConfirmationService } from 'primeng/api';


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

  currentGame = '';
  runnerName = '';

  nextGame = '';
  nextGameTime = '';
  nextRunnerName = '';

  constructor( private confirmationService: ConfirmationService ) {
  }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  confirm(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      icon: 'pi pi-exclamation-triangle',
      message: 'Don\'t be fooled by JustGivings "0% Platform Fee"! JustGiving charges non-profits a £39 (+VAT) monthly charge ' +
               'in addition to deducting a "Platform Processing Fee" of 1.9% + £0.20p fee from every donation. ' +
               'Finally JustGiving will further deduct 5% from any GiftAdd added by eligible UK tax payers.',
      accept: () => {
        this.donateJustGiving();
      },
      acceptLabel: 'Donate Anyway',
      acceptButtonStyleClass: 'p-button-warning',
      rejectLabel: 'Cancel',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary'
    });
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/5194665980557244/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateTiltify() {
    window.open('https://donate.tiltify.com/@msec/zeldathonuk-gameblast22', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022', '_blank');
  }

  learnAboutSpecialEffect() {
    window.open('https://www.specialeffect.org.uk/what-we-do', '_blank');
  }

  learnAboutGameBlast() {
    window.open('https://www.gameblast.org.uk/about/', '_blank');
  }

}
