import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import firebase from 'firebase/compat/app';
import FieldValue = firebase.firestore.FieldValue;
import Timestamp = firebase.firestore.Timestamp;
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/compat/firestore';

import {JgService} from '../../jg-service/jg-service.service';
import {JustGivingDonation} from '../../jg-service/fundraising-page';

import {FacebookDonation} from '../../zeldathon-backend-service/zeldathon-backend-service.service';
import {sha256} from 'js-sha256';

import {TrackedDonation, TrackedDonationArray, TrackedDonationId} from './tracked-donation';
import {TiltifyCampaignDonation} from '../../tiltify-service/tiltify.service';
import {FundraisingPage} from '../fundraising-pages/fundraising-pages.service';


@Injectable({
  providedIn: 'root'
})
export class DonationTrackingService {
  private trackedDonationCollection: AngularFirestoreCollection<TrackedDonationArray>;
  private trackedDonationDoc: AngularFirestoreDocument<TrackedDonationArray>;
  private trackedDonationArray: TrackedDonationId[];
  private trackedDonations: TrackedDonation[];

  constructor( private jgService: JgService,
               private db: AngularFirestore ) {
    this.trackedDonations = [];
    this.trackedDonationCollection = db.collection<TrackedDonationArray>('/donations');
    this.trackedDonationDoc = this.trackedDonationCollection.doc('DONATIONS');
    this.getTrackedDonationArray().subscribe( data => {
      this.trackedDonationArray = data;
      this.trackedDonations = data.find(x => x.id === 'DONATIONS').donations;
    });
  }

  getTrackedDonationArray(): Observable<TrackedDonationId[]> {
    return this.trackedDonationCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as TrackedDonationArray;
        return { id, ...data };
      }))
    );
  }

  addTrackedDonation(trackedDonation: TrackedDonation[]): void {
    console.log('addTrackedDonation: ', trackedDonation);
    this.trackedDonationDoc.ref.update({
      donations: FieldValue.arrayUnion(...trackedDonation)
    }).then(() => {
      console.log('TrackedDonation Document successfully written!');
    });
  }

  removeTrackedDonation(trackedDonation: TrackedDonation[]): void {
    console.log('removeTrackedDonation: ', trackedDonation);
    this.trackedDonationDoc.ref.update({
      donations: FieldValue.arrayRemove(...trackedDonation)
    }).then(() => {
      console.log('TrackedDonation Document successfully written!');
    });
  }

  convertJustGivingDonationToTrackedDonation(pageShortName: string, donation: JustGivingDonation): TrackedDonation {
    return {
      id: donation.id !== undefined ? donation.id : 'undefined',
      name: (donation.donorDisplayName !== null && donation.donorDisplayName !== undefined
        && donation.donorDisplayName.length >= 1) ? donation.donorDisplayName
        : (donation.donorRealName !== null && donation.donorRealName !== undefined
          && donation.donorRealName.length >= 1) ? donation.donorRealName
          : 'Anonymous',
      imgUrl: (donation.image !== undefined && donation.image !== null
        && donation.image !== 'https://www.justgiving.com/content/images/graphics/icons/avatars/facebook-avatar.gif')
        ? donation.image : 'undefined',
      message: donation.message !== undefined ? donation.message : '',
      currency: donation.currencyCode,
      donationAmount: typeof(donation.amount) === 'string'
        ? parseFloat(donation.amount) : donation.amount,
      giftAidAmount: typeof(donation.estimatedTaxReclaim) === 'string'
        ? parseFloat(donation.estimatedTaxReclaim) : 0,
      donationSource: 'JustGiving',
      pageShortName: pageShortName,
      donationDate: Timestamp.fromDate(this.jgService.parseJustGivingDateString(donation.donationDate))
    };
  }

  convertFacebookDonationToTrackedDonation(pageShortName: string, donation: FacebookDonation): TrackedDonation {
    return {
      id: donation.id,
      name: (donation.name !== null && donation.name !== undefined) ? donation.name : donation.name,
      imgUrl: donation.imgDataUri !== undefined ? donation.imgDataUri : 'undefined',
      message: donation.message,
      currency: donation.currency,
      donationAmount: typeof(donation.amount) === 'string'
        ? parseFloat(donation.amount) : donation.amount,
      giftAidAmount: 0,
      donationSource: 'Facebook',
      pageShortName: pageShortName,
      donationDate: Timestamp.fromDate(new Date(donation.date))
    };
  }

  convertTiltifyCampaignDonationToTrackedDonation(fundraisingPage: FundraisingPage, donation: TiltifyCampaignDonation): TrackedDonation {
    return {
      id: donation.id,
      name: (donation.name !== null && donation.name !== undefined) ? donation.name : donation.name,
      imgUrl: fundraisingPage.image.url !== undefined ? fundraisingPage.image.url : 'undefined',
      message: donation.comment,
      currency: 'GBP',
      donationAmount: typeof(donation.amount) === 'string'
        ? parseFloat(donation.amount) : donation.amount,
      giftAidAmount: 0,
      donationSource: 'Tiltify',
      pageShortName: fundraisingPage.pageShortName,
      donationDate: Timestamp.fromDate(new Date(donation.completedAt))
    };
  }

  trackedDonationExists(donation: TrackedDonation): boolean {
    return this.trackedDonations?.filter(x => x.id === donation.id).length >= 1;
  }

}
