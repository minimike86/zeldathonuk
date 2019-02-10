import { Component, HostListener, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  isApiCall: boolean;

  innerHeight: any;
  innerWidth: any;

  ngOnInit() {
    this.isApiCall = window.location.toString().includes('api') || window.location.toString().includes('obs');
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // console.log(window.innerHeight, window.innerWidth);
    this.innerHeight = window.innerHeight;
    this.innerWidth = window.innerWidth;
  }

}
