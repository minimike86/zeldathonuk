import { Component, OnInit } from '@angular/core';
import { JgServiceService } from '../../services/jg-service/jg-service.service';
import {Observable, timer} from 'rxjs';


/**
 * COMPONENT IS DISPLAYED WITHIN THE NAVBAR
 */
@Component({
  selector: 'app-jg-donation',
  templateUrl: './jg-donation.component.html',
  styleUrls: ['./jg-donation.component.css']
})
export class JgDonationComponent implements OnInit {
  public displayTotal: boolean;
  public fundraisingPageDetails: Observable<FundraisingPageDetails>;
  public fundraisingPageDonations: Observable<FundraisingPageDonations>;

  constructor(private jgServiceService: JgServiceService) {
    this.fundraisingPageDetails = jgServiceService.getFundraisingPageDetails();
    this.fundraisingPageDonations = jgServiceService.getFundraisingPageDonations();
  }

  ngOnInit() {
    this.observableTimer();
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

  getDonationTotal(fundraisingPageDetails: FundraisingPageDetails): number {
    const totalRaisedOnline: number = (fundraisingPageDetails && fundraisingPageDetails.totalRaisedOnline ) !== null
      ? fundraisingPageDetails.totalRaisedOnline : 0;
    const totalRaisedOffline: number = (fundraisingPageDetails && fundraisingPageDetails.totalRaisedOffline ) !== null
      ? fundraisingPageDetails.totalRaisedOffline : 0;
    return totalRaisedOnline + totalRaisedOffline;
  }

}
