import { Component, OnInit } from '@angular/core';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import {ConfirmationService} from 'primeng/api';

@Component({
  selector: 'app-charity',
  templateUrl: './charity.component.html',
  styleUrls: ['./charity.component.css']
})
export class CharityComponent implements OnInit {
  faFacebook = faFacebook;

  constructor( private confirmationService: ConfirmationService ) {
  }

  ngOnInit(): void {
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
