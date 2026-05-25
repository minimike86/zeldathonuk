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
    return this.http.get<FacebookFundraisingDetails>(`http://localhost:3000/facebook/fundraiser/${facebookFundraiserId}`);
  }

  scrapeTwitterTweetNewDonation(donationTweet: DonationTweet): Observable<any> {
    return this.http.post(`http://localhost:3000/twitter/tweet/newDonation`, donationTweet);
  }

  scrapeTwitterTweet(tweetContent: string): Observable<any> {
    return this.http.post(`http://localhost:3000/twitter/tweet`, tweetContent);
  }

}

export interface FacebookFundraisingDetails {
  fundraiserID: number;
  fundraiserDetails: FacebookFundraiserDetails;
  progressCard: FacebookProgressCard;
  donations: FacebookDonation[];
}

interface FacebookFundraiserDetails {
  title: string;
  story: string;
  coverImage: string;
  charity: string;
  charityUrl: string;
  fundraiser: string;
  fundraiserUrl: string;
  eventDate: string;
  expiryDate: string;
  currencyCode: string;
  currencySymbol: string;
}

interface FacebookProgressCard {
  total: number;
  goal: number;
  donated: number;
  invited: number;
  shared: number;
}

export interface FacebookDonation {
  id: string;
  name: string;
  currency: string;
  amount: number;
  profileUrl?: string;
  imgSrc?: string;
  imgDataUri?: string;
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
