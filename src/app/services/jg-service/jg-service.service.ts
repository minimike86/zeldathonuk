import { Injectable, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class JgServiceService {
  private jgCampaign: string;
  private jgCharity: string;

  private fundraisingPageDetailsData$ = new BehaviorSubject<FundraisingPageDetails[]>([]);
  private fundraisingPageDonationsData$ = new BehaviorSubject<FundraisingPageDonations>({
    donations: [],
    pageShortName: null,
    pagination: null
  });

  constructor(private http: HttpClient) {
    this.jgCampaign = 'https://www.justgiving.com/campaign/gameblast19';
    this.jgCharity = 'https://www.justgiving.com/specialeffect';
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
  getFundraisingPageDetails(interval: number): BehaviorSubject<FundraisingPageDetails[]> {
    if (interval !== undefined) {
      setInterval(() => {
        this.http
          .get<FundraisingPageDetails[]>(environment.justgiving.baseUri + `/fundraising/pages/${environment.justgiving.pageShortName}/`, environment.justgiving.httpOptions)
          .subscribe(
            (data: any) => {
              //console.log("GetFundraisingPages: ", data);
              this.fundraisingPageDetailsData$.next(data);
            },
            (err: any) => console.error("GetFundraisingPages: ERROR"),
            () => console.log("GetFundraisingPages: Complete")
          );
      }, interval);
    }
    this.http
      .get<FundraisingPageDetails[]>(environment.justgiving.baseUri + `/fundraising/pages/${environment.justgiving.pageShortName}/`, environment.justgiving.httpOptions)
      .subscribe(
        (data: any) => {
          //console.log("GetFundraisingPages: ", data);
          this.fundraisingPageDetailsData$.next(data);
        },
        (err: any) => console.error("GetFundraisingPages: ERROR"),
        () => console.log("GetFundraisingPages: Complete")
      );
    return this.fundraisingPageDetailsData$;
  }

  getFundraisingPageDonations(interval: number): BehaviorSubject<FundraisingPageDonations> {
    if (interval !== undefined) {
      setInterval(() => {
        this.http
          .get<FundraisingPageDonations>(environment.justgiving.baseUri + `/fundraising/pages/${environment.justgiving.pageShortName}/donations`, environment.justgiving.httpOptions)
          .subscribe (
            (data: any) => {
              //console.log("GetFundraisingPageDonations: ", data);
              this.fundraisingPageDonationsData$.next(data);
            },
            (err: any) => console.error("GetFundraisingPageDonations: ERROR"),
            () => console.log("GetFundraisingPageDonations: Complete")
          );
      }, interval);
    }
    this.http
      .get<FundraisingPageDonations>(environment.justgiving.baseUri + `/fundraising/pages/${environment.justgiving.pageShortName}/donations`, environment.justgiving.httpOptions)
      .subscribe (
        (data: any) => {
          //console.log("GetFundraisingPageDonations: ", data);
          this.fundraisingPageDonationsData$.next(data);
        },
        (err: any) => console.error("GetFundraisingPageDonations: ERROR"),
        () => console.log("GetFundraisingPageDonations: Complete")
      );
    return this.fundraisingPageDonationsData$;
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
