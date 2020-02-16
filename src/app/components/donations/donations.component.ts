import {AfterViewInit, Component, OnInit} from '@angular/core';
import {JgService} from '../../services/jg-service/jg-service.service';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {Observable} from 'rxjs';
import {FundraisingPageDonations} from '../../services/jg-service/fundraising-page';


/**
 * COMPONENT IS DISPLAYED WITHIN THE DONATIONS PAGE
 */
@Component({
  selector: 'app-donations',
  templateUrl: './donations.component.html',
  styleUrls: ['./donations.component.css']
})
export class DonationsComponent implements OnInit {
  public timeAgo: TimeAgo;
  public fundraisingPageDonations: Observable<FundraisingPageDonations>;

  constructor(private jgService: JgService) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');
    this.fundraisingPageDonations = this.jgService.getFundraisingPageDonations();
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/655011391974449/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

  getDate(dateStr: string): Date {
    const date1 = parseInt(dateStr.substring(6, dateStr.length - 7), 0);
    return new Date(date1);
  }

}
