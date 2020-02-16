import { Component, OnInit } from '@angular/core';
import {FbService} from '../../services/fb-service/fb-service.service';
import {Observable, timer} from 'rxjs';
import {FacebookFundraisingPage} from '../../services/fb-service/facebook-fundraising-page';
import {map} from 'rxjs/operators';
import {FundraisingPageDetails, FundraisingPageDonations} from '../../services/jg-service/fundraising-page';
import {JgService} from '../../services/jg-service/jg-service.service';

@Component({
  selector: 'app-combined-total',
  templateUrl: './combined-total.component.html',
  styleUrls: ['./combined-total.component.css']
})
export class CombinedTotalComponent implements OnInit {
  public displayTotal: boolean;

  public facebookFundraisingPage: Observable<FacebookFundraisingPage>;
  public justgivingFundraisingPageDetails: Observable<FundraisingPageDetails>;
  public justgivingFundraisingPageDonations: Observable<FundraisingPageDonations>;

  public totalRaised: number;
  public donorCount: number;

  constructor(private fbService: FbService,
              private jgService: JgService) {
    this.observableTimer();
  }

  ngOnInit() {
    this.facebookFundraisingPage = this.fbService.getFacebookFundraisingPage().pipe(map(fbDonations => {
      console.log('fbDonations', fbDonations);
      return fbDonations[0];
    }));
    this.justgivingFundraisingPageDetails = this.jgService.getFundraisingPageDetails().pipe(map(fpDetails => {
      console.log('fpDetails', fpDetails);
      return fpDetails;
    }));
    this.justgivingFundraisingPageDonations = this.jgService.getFundraisingPageDonations().pipe(map(fpDonations => {
      console.log('fpDonations', fpDonations);
      return fpDonations;
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

  getDonationTotal(fundraisingPageDetails: FundraisingPageDetails, facebookFundraisingPage: FacebookFundraisingPage): number {
    const totalRaisedOnline = (fundraisingPageDetails && fundraisingPageDetails.totalRaisedOnline ) !== null
      ? fundraisingPageDetails.totalRaisedOnline : '0';
    const totalRaisedOffline = (fundraisingPageDetails && fundraisingPageDetails.totalRaisedOffline ) !== null
      ? fundraisingPageDetails.totalRaisedOffline : '0';
    return parseInt(totalRaisedOnline, 0) + parseInt(totalRaisedOffline, 0) + facebookFundraisingPage.amountRaised;
  }

  getDonorCount(fundraisingPageDonations: FundraisingPageDonations, facebookFundraisingPage: FacebookFundraisingPage): number {
    return fundraisingPageDonations.donations.length + facebookFundraisingPage.donorCount;
  }

}
