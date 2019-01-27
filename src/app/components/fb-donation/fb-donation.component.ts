import { Component, OnInit } from '@angular/core';
import { timer } from "rxjs";
import {FbServiceService} from "../../services/fb-service/fb-service.service";

@Component({
  selector: 'app-fb-donation',
  templateUrl: './fb-donation.component.html',
  styleUrls: ['./fb-donation.component.css']
})
export class FbDonationComponent implements OnInit {

  public fbTotal: number;
  public displayTotal: boolean;

  constructor(fbServiceService: FbServiceService) {
    fbServiceService.getDonationTotal().subscribe(data => {
      this.fbTotal = data;
    });
  }

  ngOnInit() {
    this.fbTotal = 0;
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
