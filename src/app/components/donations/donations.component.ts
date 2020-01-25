import { Component, OnInit } from '@angular/core';
import {JgServiceService} from "../../services/jg-service/jg-service.service";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'


/**
 * COMPONENT IS DISPLAYED WITHIN THE DONATIONS PAGE
 */
@Component({
  selector: 'app-donations',
  templateUrl: './donations.component.html',
  styleUrls: ['./donations.component.css']
})
export class DonationsComponent implements OnInit {
  public fundraisingPageDetails: FundraisingPageDetails[];
  public fundraisingPageDonations: FundraisingPageDonations;
  public timeAgo: TimeAgo;

  constructor(private jgServiceService: JgServiceService) {
    jgServiceService.getFundraisingPageDetails(1000 * 60).subscribe(data => {
      this.fundraisingPageDetails = data;
    });
    jgServiceService.getFundraisingPageDonations(1000 * 60).subscribe(data => {
      this.fundraisingPageDonations = data;
    });
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/235288154058664/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

  getDate(dateStr: string): Date {
    const date1 = parseInt(dateStr.substring(6, dateStr.length - 7), 0);
    return new Date(date1);
  }

}
