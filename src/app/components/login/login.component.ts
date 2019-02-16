import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/firebase/auth/auth.service';
import { Router } from '@angular/router';
import { User } from 'firebase';
import { faGoogle } from "@fortawesome/free-brands-svg-icons";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  private currentUser: User;
  public faGoogle = faGoogle;

  constructor(private authService: AuthService,
              private router: Router) {
    this.authService.user$.subscribe(user => {
      console.log('Logged in: ', user);
      this.currentUser = user;
      if (this.currentUser !== undefined && this.currentUser !== null) {
        this.router.navigateByUrl('');
      }
    });
  }

  ngOnInit() {
    if (this.currentUser !== undefined && this.currentUser !== null) {
      console.log('logged in');
    } else if (this.currentUser === undefined || this.currentUser === null) {
      console.log('not logged in');
      this.login();
    }
  }

  login() {
    this.authService.login('google');
  }

  showPrivacyPolicyModal() {
    //
  }

  showTermsOfServiceModal() {
    //
  }

}
