import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class FbServiceService {

  url: string;
  httpOptions:  any;
  fbFundraiserData: any;

  constructor(http: HttpClient) {
    this.url = 'https://cors-anywhere.herokuapp.com/https://mobile.facebook.com/nt/screen/?params=%7B%22fundraiser_campaign_id%22%3A235288154058664%7D&path=%2Ffundraiser%2F&_rdr';
    this.httpOptions = {
      headers: new HttpHeaders({
        'X-Requested-With': 'zeldathonuk',
        'Content-Type': 'application/json; charset="utf-8"'
      })
    };
    console.log('requesting fb data');
    http.get(this.url, this.httpOptions).subscribe(
    nxtData => {},
    errData => {
      this.fbFundraiserData = errData.error.text;
      console.log( this.fbFundraiserData.toString() );
    });
    console.log('subscribe started');
  }

  getDonationTotal(): Observable<any> {
    return new BehaviorSubject(this.fbFundraiserData).asObservable();
  }

}
