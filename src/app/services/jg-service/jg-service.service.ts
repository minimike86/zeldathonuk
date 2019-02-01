import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class JgServiceService {

  private jgPage: string;
  private jgCampaign: string;
  private jgCharity: string;
  private httpOptions: any;

  private prod: boolean;
  private baseProdUri: string;
  private baseTestUri: string;
  private testCreditCard: {
    type: 'Master Card',
    number: '4111111111111111',
    expiry: '01/2020',
    cv2: '123'
    verifyStepPswd: '12345',
  };
  private testPayPal: {
    username: 'paypalsandboxapi@justgiving.com',
    password: 'letmeinplease',
  };

  constructor(private http: HttpClient) {
    this.prod = true;
    this.jgPage = 'zeldathonuk-gameblast2019'; //'zeldathonuk-testfundraising-page435';
    this.jgCampaign = 'https://www.justgiving.com/campaign/gameblast19';
    this.jgCharity = 'https://www.justgiving.com/specialeffect';
    this.baseTestUri = 'https://api.staging.justgiving.com/v1';
    this.baseProdUri = 'https://api.justgiving.com/v1';
    this.httpOptions = {
      headers: new HttpHeaders({
        'Accept':  'application/json',
        'x-api-key': '6cb44e17'
      })
    };
  }


  /**
   * CAMPAIGNS ENDPOINTS
   * Create and query campaign pages
   */
  getCampaignDetails(charityName: string, campaignName: string) {
    //GET
    const uri = '/campaigns/{charityName}/{campaignName}';
  }


  /**
   * FUNDRAISING ENDPOINTS
   * Create, edit or manage fundraising pages
   */
  getFundraisingPageDetails(pageShortName: string): Observable<any> {
    //GET
    const uri = '/fundraising/pages/{pageShortName}/';
    if (this.prod) {
      return this.http.get(this.baseProdUri + uri.replace('{pageShortName}', pageShortName), this.httpOptions);
    } else {
      return this.http.get(this.baseTestUri + uri.replace('{pageShortName}', pageShortName), this.httpOptions);
    }
  }

  getFundraisingPageDonations(pageShortName: string): Observable<any> {
    //GET
    const uri = '/fundraising/pages/{pageShortName}/donations';
    if (this.prod) {
      return this.http.get(this.baseProdUri + uri.replace('{pageShortName}', pageShortName), this.httpOptions);
    } else {
      return this.http.get(this.baseTestUri + uri.replace('{pageShortName}', pageShortName), this.httpOptions);
    }
  }

  updateOfflineAmount(pageShortName: string) {
    //PUT
    const uri = '/fundraising/pages/{pageShortName}/offline';
  }


  /**
   * DONATION ENDPOINTS
   * Query specific donations by ID or reference
   */
  getDonationDetails(donationId: number) {
    //GET
    const uri = '/donation/{donationId}';
  }

  getDonationIdByDonationRef(donationRef: string) {
    //GET
    const uri = '/donationId/{donationRef}';
  }

  getDonationStatus(donationId: number) {
    //GET
    const uri = '/donation/{donationId}/status ';
  }

}