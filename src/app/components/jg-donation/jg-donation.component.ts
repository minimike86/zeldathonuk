import { Component, OnInit } from '@angular/core';
import { JgServiceService } from "../../services/jg-service/jg-service.service";
import { timer } from "rxjs";


/**
 * COMPONENT IS DISPLAYED WITHIN THE NAVBAR
 */
@Component({
  selector: 'app-jg-donation',
  templateUrl: './jg-donation.component.html',
  styleUrls: ['./jg-donation.component.css']
})
export class JgDonationComponent implements OnInit {
  public fundraisingPageDetails: FundraisingPageDetails[];
  public fundraisingPageDonations: FundraisingPageDonations;
  public displayTotal: boolean;

  constructor(private jgServiceService: JgServiceService) {
    jgServiceService.getFundraisingPageDetails(1000*60).subscribe(data => {
      this.fundraisingPageDetails = data;
    });
    jgServiceService.getFundraisingPageDonations(1000*60).subscribe(data => {
      this.fundraisingPageDonations = data;
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
