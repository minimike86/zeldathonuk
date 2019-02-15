import { Component, OnInit } from '@angular/core';
import {JgServiceService} from "../../services/jg-service/jg-service.service";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'


@Component({
  selector: 'app-donations',
  templateUrl: './donations.component.html',
  styleUrls: ['./donations.component.css']
})
export class DonationsComponent implements OnInit {
  public fundraisingPageDetails: any;
  public fundraisingPageDonations: any[];
  private timeAgo: TimeAgo;

  constructor(private jgServiceService: JgServiceService) {
    jgServiceService.getFundraisingPageDetails().subscribe(data => {
      this.fundraisingPageDetails = data;
    });
    jgServiceService.getFundraisingPageDonations().subscribe(data => {
      console.log('getFundraisingPageDonations: ', data);
      this.fundraisingPageDonations = data.donations;
    });
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB')
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/235288154058664/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast2019', '_blank');
  }

  getDate(dateStr: string): Date {
    const date1 = parseInt(dateStr.substring(6,dateStr.length-7));
    return new Date(date1);
  }

}
