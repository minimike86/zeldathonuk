import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';

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
    return this.http.post(`http://localhost:3000/scrape/twitter/tweet`, tweetContent);
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
  name: string;
  currency: string;
  amount: number;
  profileUrl?: string;
  imgSrc?: string;
  imgDataUri?: string;
  date: Date;
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
