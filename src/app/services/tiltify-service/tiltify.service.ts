import { Injectable } from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TiltifyService {

  private accessToken =	'';

  constructor(private http: HttpClient) {
  }

  getCampaignById(id: number): Observable<TiltifyCampaign> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);
    return this.http.get<TiltifyCampaign>(`https://tiltify.com/api/v3/campaigns/${id}`, {headers: httpHeaders});
  }

  getCampaignDonationsById(id: number): Observable<TiltifyCampaignDonations> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken}`);
    return this.http.get<TiltifyCampaignDonations>(`https://tiltify.com/api/v3/campaigns/${id}/donations`, {headers: httpHeaders});
  }

}

export interface TiltifyCampaign {
  meta: {
    status: number
  };
  data: {
    id: number,
    name: string,
    slug: string,
    url: string,
    startsAt: number,
    endsAt: number,
    description: string,
    avatar: {
      src: string,
      alt: string,
      width: number,
      height: number
    },
    causeId: number,
    fundraisingEventId: number,
    fundraiserGoalAmount: number,
    originalGoalAmount: number,
    amountRaised: number,
    supportingAmountRaised: number,
    totalAmountRaised: number,
    supportable: boolean,
    status: string,
    user: {
      id: number,
      username: string,
      slug: string,
      url: string,
      avatar: {
        src: string,
        alt: string,
        width: number,
        height: number
      }
    },
    team: {
      id: number,
      username: string,
      slug: string,
      url: string,
      avatar: {
        src: string,
        alt: string,
        width: number,
        height: number
      }
    },
    livestream: {
      type: string,
      channel: string
    }
  };
}

export interface TiltifyCampaignDonations {
  meta: {
    status: number
  };
  data: TiltifyCampaignDonation[];
  links: {
    prev: string,
    next: string,
    self: string
  };
}

export interface TiltifyCampaignDonation {
  id: number;
  amount: number;
  name: string;
  comment: string;
  completedAt: number;
  rewardId?: number;
}
