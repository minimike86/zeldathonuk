import { Component, OnInit } from '@angular/core';
import {JgServiceService} from "../../../../services/jg-service/jg-service.service";
import TimeAgo from 'javascript-time-ago'
import en from 'javascript-time-ago/locale/en'

@Component({
  selector: 'app-omnibar-donations',
  templateUrl: './omnibar-donations.component.html',
  styleUrls: ['./omnibar-donations.component.css']
})
export class OmnibarDonationsComponent implements OnInit {
  public fundraisingPageDonations: FundraisingPageDonations;
  public timeAgo: TimeAgo;

  constructor(private jgs: JgServiceService) {
    jgs.getFundraisingPageDonations(1000).asObservable().subscribe(data => {
      this.fundraisingPageDonations = data;
    });
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB')
  }

}
