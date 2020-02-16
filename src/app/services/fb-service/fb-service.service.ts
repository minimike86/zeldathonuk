import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FacebookFundraisingPage } from './facebook-fundraising-page';

@Injectable({
  providedIn: 'root'
})
export class FbService {

  private url = 'https://us-central1-zeldathonuk.cloudfunctions.net/getFacebookDonations';

  constructor(private http: HttpClient) {
  }

  getFacebookFundraisingPage(): Observable<FacebookFundraisingPage> {
    return this.http.get<FacebookFundraisingPage>(this.url);
  }

}
