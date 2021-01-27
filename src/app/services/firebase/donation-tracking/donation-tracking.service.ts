import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import firebase from 'firebase/app';
import FieldValue = firebase.firestore.FieldValue;
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';

import {TrackedDonation, TrackedDonationArray, TrackedDonationId} from './tracked-donation';


@Injectable({
  providedIn: 'root'
})
export class DonationTrackingService {
  private trackedDonationCollection: AngularFirestoreCollection<TrackedDonationArray>;
  private trackedDonationDoc: AngularFirestoreDocument<TrackedDonationArray>;
  private trackedDonationArray: TrackedDonationId[];

  constructor( private db: AngularFirestore ) {
    this.trackedDonationCollection = db.collection<TrackedDonationArray>('/donations');
    this.trackedDonationDoc = this.trackedDonationCollection.doc('DONATIONS');
    this.getTrackedDonationArray().subscribe( data => {
      this.trackedDonationArray = data;
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
      console.log('Document successfully written!');
    });
  }

  removeTrackedDonation(trackedDonation: TrackedDonation[]): void {
    console.log('removeTrackedDonation: ', trackedDonation);
    this.trackedDonationDoc.ref.update({
      donations: FieldValue.arrayRemove(...trackedDonation)
    }).then(() => {
      console.log('Document successfully written!');
    });
  }

}
