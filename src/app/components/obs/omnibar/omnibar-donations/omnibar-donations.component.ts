import { Component, OnInit } from '@angular/core';
import {JgServiceService} from '../../../../services/jg-service/jg-service.service';
import {FundraisingPageDonations} from '../../../../services/jg-service/fundraising-page';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-omnibar-donations',
  templateUrl: './omnibar-donations.component.html',
  styleUrls: ['./omnibar-donations.component.css']
})
export class OmnibarDonationsComponent implements OnInit {
  public fundraisingPageDonations: Observable<FundraisingPageDonations>;
  public timeAgo: TimeAgo;

  constructor( private jgServiceService: JgServiceService ) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');

    this.fundraisingPageDonations = this.jgServiceService.getFundraisingPageDonations().pipe(map(fpd => {
      return fpd;
    }));

  }

}
