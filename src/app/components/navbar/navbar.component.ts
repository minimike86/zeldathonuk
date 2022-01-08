import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { ConfirmationService } from 'primeng/api';
import { timer } from 'rxjs';
import { faFacebook, faAccessibleIcon, faChromecast } from '@fortawesome/free-brands-svg-icons';
import { faSignOutAlt, faBars, faListOl, faPoundSign, faHandHolding, faGamepad, faCaretUp, faCarrot, faHistory } from '@fortawesome/free-solid-svg-icons';
import { faHeart } from '@fortawesome/free-regular-svg-icons';


@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public isCollapsed = true;
  public displayCombinedTotal: boolean;
  public user: any;

  faFacebook = faFacebook;
  faChromecast = faChromecast;
  faHeart = faHeart;
  faBars = faBars;
  faListOl = faListOl;
  faPoundSign = faPoundSign;
  faHandHolding = faHandHolding;
  faCarrot = faCarrot;
  faGamepad = faGamepad;
  faAccessibleIcon = faAccessibleIcon;
  faHistory = faHistory;
  faCaretUp = faCaretUp;
  faSignOutAlt = faSignOutAlt;

  constructor( private auth: AuthService,
               private confirmationService: ConfirmationService ) {
    auth.user$.subscribe(data => {
      console.log('AuthService: ', data);
      this.user = data;
    });
    this.observableTimer();
  }

  ngOnInit() {
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

  logout() {
    this.auth.logout();
  }

  observableTimer() {
    const interval = 30;
    const source = timer(1000, 2000);
    const countdown = source.subscribe(val => {
      if (val % interval === 0) {
        this.displayCombinedTotal = !this.displayCombinedTotal;
      }
    });
  }

}
