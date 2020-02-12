import { Component, OnInit } from '@angular/core';
import {JgServiceService} from '../../../../services/jg-service/jg-service.service';
import {FundraisingPageDonations} from '../../../../services/jg-service/fundraising-page';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Component({
  selector: 'app-omnibar-donations',
  templateUrl: './omnibar-donations.component.html',
  styleUrls: ['./omnibar-donations.component.css']
})
export class OmnibarDonationsComponent implements OnInit {
  public fundraisingPageDonations: Observable<FundraisingPageDonations>;
  public testPageDonations: FundraisingPageDonations;
  public timeAgo: TimeAgo;

  constructor( private jgServiceService: JgServiceService ) {
  }

  ngOnInit() {
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');

    this.fundraisingPageDonations = this.jgServiceService.getFundraisingPageDonations().pipe(map(fpd => {
      return fpd;
    }));

    this.testPageDonations = {
      donations: [
        {
          amount: '2.0000',
          currencyCode: 'GBP',
          donationDate: '/Date(1581460637000+0000)/',
          donationRef: null,
          donorDisplayName: 'first',
          donorLocalAmount: '2.000000',
          donorLocalCurrencyCode: 'GBP',
          estimatedTaxReclaim: 0.5,
          id: 1047294036,
          image: 'https://images.justgiving.com/image/31652f97-914c-419f-92ce-0d0c1f68e6f9.jpg?template=profilesummary',
          message: 'first',
          source: 'SponsorshipDonations',
          thirdPartyReference: null,
          charityId: 184054
        },
        {
          amount: '2.0000',
          currencyCode: 'GBP',
          donationDate: '/Date(1581460637000+0000)/',
          donationRef: null,
          donorDisplayName: 'second',
          donorLocalAmount: '2.000000',
          donorLocalCurrencyCode: 'GBP',
          estimatedTaxReclaim: 0.5,
          id: 1047294036,
          image: 'https://images.justgiving.com/image/31652f97-914c-419f-92ce-0d0c1f68e6f9.jpg?template=profilesummary',
          message: 'second',
          source: 'SponsorshipDonations',
          thirdPartyReference: null,
          charityId: 184054
        },
        {
          amount: '2.0000',
          currencyCode: 'GBP',
          donationDate: '/Date(1581460637000+0000)/',
          donationRef: null,
          donorDisplayName: 'third',
          donorLocalAmount: '2.000000',
          donorLocalCurrencyCode: 'GBP',
          estimatedTaxReclaim: 0.5,
          id: 1047294036,
          image: 'https://images.justgiving.com/image/31652f97-914c-419f-92ce-0d0c1f68e6f9.jpg?template=profilesummary',
          message: 'third',
          source: 'SponsorshipDonations',
          thirdPartyReference: null,
          charityId: 184054
        }
      ],
      id: 'zeldathonuk-gameblast-2020',
      pageShortName: 'zeldathonuk-gameblast-2020',
      pagination: {
        pageNumber: 1,
        pageSizeRequested: 25,
        pageSizeReturned: 1,
        totalPages: 1,
        totalResults: 1
      }
    };
  }

}
