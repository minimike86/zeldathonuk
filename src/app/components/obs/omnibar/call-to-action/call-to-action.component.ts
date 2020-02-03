import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-call-to-action',
  templateUrl: './call-to-action.component.html',
  styleUrls: ['./call-to-action.component.css']
})
export class CallToActionComponent implements OnInit {
  public callToAction = true;

  public currentDate: number = Date.now();

  constructor() { }

  ngOnInit() {
  }

}
