import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {forkJoin, from, Observable, of, pipe, range, throwError} from 'rxjs';
import { jgEnvironment } from '../../../environments/environment';
import {FundraisingPageDetails, FundraisingPageDonations, JustGivingDonation} from './fundraising-page';
import {
  concatMap,
  map,
  toArray,
  switchMap, catchError,
} from 'rxjs/operators';

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

  getFundraisingPageTotalPages(pageSize: number): Observable<number> {
    return this.getFundraisingPageDonations(pageSize, 1).pipe(map(data => data.pagination.totalPages));
  }

  getJustGivingPageDonations(pageSize: number, pageNumber: number): Observable<JustGivingDonation[]> {
    return this.getFundraisingPageDonations(pageSize, pageNumber).pipe(map(data => data.donations));
  }

  getAllJustGivingDonations(): Observable<JustGivingDonation[]> {
    return this.getFundraisingPageTotalPages(150).pipe(
      concatMap((totalPages: number) => range(1, totalPages).pipe(toArray())),
      switchMap((pageNumbers: number[]) => from(pageNumbers)),
      pipe(
        map((pageNumber: number) => this.getJustGivingPageDonations(150, pageNumber)),
        toArray()
      ),
      switchMap((observables: Observable<JustGivingDonation[]>[]) => {
        return forkJoin(observables)
          .pipe(map(data => data.reduce((result, arr) => [...result, ...arr], [])));
      }),
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
