import { Injectable } from '@angular/core';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';

import { TrackedDonation, TrackedDonationId } from './tracked-donation';


@Injectable({
  providedIn: 'root'
})
export class DonationTrackingService {
  private trackedDonationCollection: AngularFirestoreCollection<TrackedDonation>;
  private trackedDonationIds: TrackedDonationId[];

  constructor( private db: AngularFirestore ) {
    this.trackedDonationCollection = db.collection<TrackedDonation>('/donations');
    this.getTrackedDonationIds().subscribe( data => {
      this.trackedDonationIds = data;
    });
  }

  getTrackedDonationIds(): Observable<TrackedDonationId[]> {
    return this.trackedDonationCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as TrackedDonation;
        return { id, ...data };
      }))
    );
  }

  addTrackedDonation(trackedDonation: TrackedDonation): void {
    console.log('addTrackedDonation: ', trackedDonation);
    this.trackedDonationCollection.add(trackedDonation).then();
  }

}
