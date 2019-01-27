import { Component, OnInit } from '@angular/core';
import { JgServiceService } from "../../services/jg-service/jg-service.service";
import { timer } from "rxjs";

@Component({
  selector: 'app-jg-donation',
  templateUrl: './jg-donation.component.html',
  styleUrls: ['./jg-donation.component.css']
})
export class JgDonationComponent implements OnInit {

  public fundraisingPageDetails: any;
  public fundraisingPageDonations: any[];

  public displayTotal: boolean;

  constructor(private jgServiceService: JgServiceService) {
    const pageShortName = 'zeldathonuk-gameblast2019';
    jgServiceService.getFundraisingPageDetails(pageShortName).subscribe(data => {
      this.fundraisingPageDetails = data;
    });
    jgServiceService.getFundraisingPageDonations(pageShortName).subscribe(data => {
      this.fundraisingPageDonations = data.donations;
    });
  }

  ngOnInit() {
    this.oberserableTimer();
  }

  oberserableTimer() {
    const interval = 10;
    const source = timer(1000, 2000);
    const countdown = source.subscribe(val => {
      if (val % interval === 0) {
        this.displayTotal = !this.displayTotal;
      }
    });
  }

}
