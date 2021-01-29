import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {EMPTY, iif, Observable, of, pipe, range} from 'rxjs';
import { jgEnvironment } from '../../../environments/environment';
import {FundraisingPageDetails, FundraisingPageDonations, JustGivingDonation, Pagination} from './fundraising-page';
import {delay, finalize, map, mergeMap, switchMap, tap} from 'rxjs/operators';

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
  getFundraisingPageDetails(): Observable<FundraisingPageDetails> {
    return this.http.get<FundraisingPageDetails>(jgEnvironment.justgiving.baseUri
            + `/fundraising/pages/${jgEnvironment.justgiving.pageShortName}/`, jgEnvironment.justgiving.httpOptions);
  }

  getFundraisingPageDonations(pageSize: number, pageNumber: number): Observable<FundraisingPageDonations> {
    return this.http.get<FundraisingPageDonations>(jgEnvironment.justgiving.baseUri +
      `/fundraising/pages/${jgEnvironment.justgiving.pageShortName}/donations?pageSize=${pageSize}&pageNumber=${pageNumber}`,
      jgEnvironment.justgiving.httpOptions);
  }

  getAllJustGivingDonations(): Observable<JustGivingDonation[]> {
    const justGivingDonations: JustGivingDonation[] = [];
    // get first page
    return this.getFundraisingPageDonations(150, 1).pipe(
      // get the donations
      map((fundraisingPageDonations: FundraisingPageDonations) => {
        justGivingDonations.push(...fundraisingPageDonations.donations);
        return fundraisingPageDonations.pagination;
      }),
      // if more pages remain get the donations from them as well
      tap(pagination => range(1, pagination.totalPages).pipe(
        delay(5 * 1000),
        tap((pageNumber: number) => {
          console.log('pageNumber', pageNumber);
          this.getFundraisingPageDonations(150, pageNumber).pipe(
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
