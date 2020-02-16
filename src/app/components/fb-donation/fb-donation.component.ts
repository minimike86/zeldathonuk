import { Component, OnInit } from '@angular/core';
import { Observable, timer } from 'rxjs';
import { FbService } from '../../services/fb-service/fb-service.service';
import { FacebookFundraisingPage } from '../../services/fb-service/facebook-fundraising-page';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-fb-donation',
  templateUrl: './fb-donation.component.html',
  styleUrls: ['./fb-donation.component.css']
})
export class FbDonationComponent implements OnInit {
  public displayTotal: boolean;
  public facebookFundraisingPage: Observable<FacebookFundraisingPage>;

  constructor(private fbService: FbService) {
    this.observableTimer();
  }

  ngOnInit() {
    this.facebookFundraisingPage = this.fbService.getFacebookFundraisingPage().pipe(map(fbDonations => {
      console.log('fbDonations', fbDonations);
      return fbDonations[0];
    }));
  }

  observableTimer() {
    const interval = 10;
    const source = timer(1000, 2000);
    const countdown = source.subscribe(val => {
      if (val % interval === 0) {
        this.displayTotal = !this.displayTotal;
      }
    });
  }

}
