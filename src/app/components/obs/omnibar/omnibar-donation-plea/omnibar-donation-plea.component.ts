import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-omnibar-donation-plea',
  templateUrl: './omnibar-donation-plea.component.html',
  styleUrls: ['./omnibar-donation-plea.component.css']
})
export class OmnibarDonationPleaComponent implements OnInit {
  public callToAction = true;
  public currentDate: number = Date.now();

  constructor() { }

  ngOnInit() {
  }

}
