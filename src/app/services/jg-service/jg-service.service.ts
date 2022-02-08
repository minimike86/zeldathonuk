import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, range } from 'rxjs';
import { jgEnvironment } from '../../../environments/environment';
import { FundraisingPageDetails, FundraisingPageDonations, JustGivingDonation } from './fundraising-page';
import { delay, map, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JgService {
  private jgCampaign: string;
  private jgCharity: string;

  constructor(private http: HttpClient) {
    this.jgCampaign = 'https://www.justgiving.com/campaign/gameblast21';
    this.jgCharity = 'https://www.justgiving.com/specialeffect';
  }

  // "/Date(1610767455000+0000)/"
  parseJustGivingDateString(donationDate: string): Date {
    return new Date(parseInt(donationDate.slice(6, donationDate.length - 5), 10));
  }

  /**
   * FUNDRAISING ENDPOINTS
   * Create, edit or manage fundraising pages
   */
  getFundraisingPageDetails(pageShortName: string): Observable<FundraisingPageDetails> {
    return this.http.get<FundraisingPageDetails>(jgEnvironment.justgiving.baseUri
      + `/fundraising/pages/${pageShortName}/`, jgEnvironment.justgiving.httpOptions);
  }

  getFundraisingPageDetailsByPageShortName(pageShortName: string): Observable<FundraisingPageDetails> {
    return this.http.get<FundraisingPageDetails>(jgEnvironment.justgiving.baseUri
      + `/fundraising/pages/${pageShortName}/`, jgEnvironment.justgiving.httpOptions);
  }

  getFundraisingPageDonations(pageShortName: string, pageSize: number, pageNumber: number): Observable<FundraisingPageDonations> {
    return this.http.get<FundraisingPageDonations>(jgEnvironment.justgiving.baseUri +
      `/fundraising/pages/${pageShortName}/donations?pageSize=${pageSize}&pageNumber=${pageNumber}`,
      jgEnvironment.justgiving.httpOptions);
  }

  getFundraisingPageDonationsByPageShortName(pageShortName: string,
                                             pageSize: number, pageNumber: number): Observable<FundraisingPageDonations> {
    return this.http.get<FundraisingPageDonations>(jgEnvironment.justgiving.baseUri +
      `/fundraising/pages/${pageShortName}/donations?pageSize=${pageSize}&pageNumber=${pageNumber}`,
      jgEnvironment.justgiving.httpOptions);
  }

  getAllJustGivingDonations(pageShortName: string): Observable<JustGivingDonation[]> {
    const justGivingDonations: JustGivingDonation[] = [];
    // get first page
    return this.getFundraisingPageDonations(pageShortName, 150, 1).pipe(
      // get the donations
      map((fundraisingPageDonations: FundraisingPageDonations) => {
        justGivingDonations.push(...fundraisingPageDonations.donations);
        return fundraisingPageDonations.pagination;
      }),
      // if more pages remain get the donations from them as well
      tap(pagination => range(2, pagination.totalPages).pipe(
        delay(5 * 1000),
        tap((pageNumber: number) => {
            console.log('pageNumber', pageNumber);
            this.getFundraisingPageDonations(pageShortName, 150, pageNumber).pipe(
              tap((fundraisingPageDonations: FundraisingPageDonations) => {
                justGivingDonations.push(...fundraisingPageDonations.donations);
              })
            );
          }
        ))),
      switchMap(() => {
        // console.log('switchMap justGivingDonations', justGivingDonations);
        return of(justGivingDonations);
      })
    );
  }

  getAllJustGivingDonationsByPageShortName(pageShortName: string): Observable<JustGivingDonation[]> {
    const justGivingDonations: JustGivingDonation[] = [];
    // get first page
    return this.getFundraisingPageDonationsByPageShortName(pageShortName, 150, 1).pipe(
      // get the donations
      map((fundraisingPageDonations: FundraisingPageDonations) => {
        justGivingDonations.push(...fundraisingPageDonations.donations);
        return fundraisingPageDonations.pagination;
      }),
      // if more pages remain get the donations from them as well
      tap(pagination => range(2, pagination.totalPages).pipe(
        tap((pageNumber: number) => {
            console.log('pageNumber', pageNumber);
            this.getFundraisingPageDonationsByPageShortName(pageShortName, 150, pageNumber).pipe(
              tap((fundraisingPageDonations: FundraisingPageDonations) => {
                justGivingDonations.push(...fundraisingPageDonations.donations);
              })
            );
          }
        ))),
      switchMap(() => {
        console.log('switchMap justGivingDonations', justGivingDonations);
        return of(justGivingDonations);
      })
    );
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


  /**
   * CAMPAIGNS ENDPOINTS
   * Create and query campaign pages
   */
  getCampaignDetails(charityName: string, campaignName: string) {
    // GET
    const uri = '/campaigns/{charityName}/{campaignName}';
  }

}
