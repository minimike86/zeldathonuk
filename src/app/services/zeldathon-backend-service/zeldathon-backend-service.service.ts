import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, of, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ZeldathonBackendService {

  constructor(private http: HttpClient) {
  }

  scrapeFacebookFundraiser(facebookFundraiserId: number): Observable<FacebookFundraisingDetails> {
    return this.http.get<FacebookFundraisingDetails>(`http://localhost:3000/scrape/facebook/fundraiser/${facebookFundraiserId}`);
  }

  scrapeTwitterTweetNewDonation(donationTweet: DonationTweet): Observable<any> {
    return this.http.post(`http://localhost:3000/scrape/twitter/tweet/newDonation`, donationTweet);
  }

  scrapeTwitterTweet(tweetContent: string): Observable<any> {
    const httpHeaders = new HttpHeaders()
      .set('Content-Type', 'application/json');
    return this.http.post(`http://localhost:3000/scrape/twitter/tweet`, JSON.stringify(tweetContent),
      {headers: httpHeaders});
  }

}

export interface FacebookFundraisingDetails {
  progressCard: FacebookProgressCard;
  uniqueDonorCount: number;
  donations: FacebookDonation[];
}

export interface FacebookProgressCard {
  total: number;
  goal: number;
}

export interface FacebookDonation {
  id: number;
  name: string;
  currency: string;
  amount: number;
  profileUrl: string;
  imgDataUri: string;
  date: Date;
  message: string;
}

interface DonationTweet {
  donorName: string;
  currencySymbol: string;
  donationAmount: number;
}

interface Tweet {
  profileImgSrc: string;
  name: string;
  username: string;
  date: string;
  content: string;
  replies: number;
  retweets: number;
  likes: number;
}
