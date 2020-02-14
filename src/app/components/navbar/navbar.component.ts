import {Component, Input, OnInit} from '@angular/core';
import {AuthService} from '../../services/firebase/auth/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public isCollapsed = true;
  @Input() showJgDonationComponent: boolean;
  public user: any;

  constructor(private auth: AuthService) {
    auth.user$.subscribe(data => {
      console.log('AuthService: ', data);
      this.user = data;
    });
  }

  ngOnInit() {
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/655011391974449/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

  logout(){
    this.auth.logout();
  }

}
