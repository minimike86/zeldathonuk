import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/655011391974449/', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020', '_blank');
  }

}
