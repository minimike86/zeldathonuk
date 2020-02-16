import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {BehaviorSubject, Observable, of, ReplaySubject} from 'rxjs';
import { jgEnvironment } from '../../../environments/environment';
import {Donation, FundraisingPageDetails, FundraisingPageDonations} from './fundraising-page';

@Injectable({
  providedIn: 'root'
})
export class JgService {
  private _testDonations: ReplaySubject<Donation[]> = new ReplaySubject<Donation[]>();

  private jgCampaign: string;
  private jgCharity: string;

  constructor(private http: HttpClient) {
    this.jgCampaign = 'https://www.justgiving.com/campaign/gameblast20';
    this.jgCharity = 'https://www.justgiving.com/specialeffect';
  }

  /**
   * CAMPAIGNS ENDPOINTS
   * Create and query campaign pages
   */
  getCampaignDetails(charityName: string, campaignName: string) {
    // GET
    const uri = '/campaigns/{charityName}/{campaignName}';
  }


  /**
   * FUNDRAISING ENDPOINTS
   * Create, edit or manage fundraising pages
   */
  getFundraisingPageDetails(): Observable<FundraisingPageDetails> {
    return this.http.get<FundraisingPageDetails>(jgEnvironment.justgiving.baseUri
            + `/fundraising/pages/${jgEnvironment.justgiving.pageShortName}/`, jgEnvironment.justgiving.httpOptions);
  }

  getFundraisingPageDonations(): Observable<FundraisingPageDonations> {
    return this.http.get<FundraisingPageDonations>(jgEnvironment.justgiving.baseUri
            + `/fundraising/pages/${jgEnvironment.justgiving.pageShortName}/donations`, jgEnvironment.justgiving.httpOptions);
  }

  updateOfflineAmount(pageShortName: string) {
    // PUT
    const uri = '/fundraising/pages/{pageShortName}/offline';
  }


  /**
   * DONATION ENDPOINTS
   * Query specific donations by ID or reference
   */
  getDonationDetails(donationId: number) {
    // GET
    const uri = '/donation/{donationId}';
  }

  getDonationIdByDonationRef(donationRef: string) {
    // GET
    const uri = '/donationId/{donationRef}';
  }

  getDonationStatus(donationId: number) {
    // GET
    const uri = '/donation/{donationId}/status ';
  }

}
