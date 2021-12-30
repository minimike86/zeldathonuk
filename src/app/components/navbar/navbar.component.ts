import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public isCollapsed = true;
  public displayCombinedTotal: boolean;
  public user: any;

  constructor(private auth: AuthService) {
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

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022', '_blank');
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
