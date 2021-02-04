import { Injectable } from '@angular/core';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {
  HighlightedDonation,
  HighlightedDonationId,
  TrackedDonation,
} from '../donation-tracking/tracked-donation';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class DonationHighlightService {
  private highlightedDonationCollection: AngularFirestoreCollection<HighlightedDonation>;
  private highlightedDonationDoc: AngularFirestoreDocument<HighlightedDonation>;
  private highlightedDonationId: HighlightedDonationId[];
  private highlightedDonation: TrackedDonation;

  constructor( private db: AngularFirestore ) {
    this.highlightedDonationCollection = db.collection<HighlightedDonation>('/highlighted-donation');
    this.highlightedDonationDoc = this.highlightedDonationCollection.doc('HIGHLIGHT-DONATION');
    this.getHighlightedDonation().subscribe( data => {
      this.highlightedDonationId = data;
      this.highlightedDonation = data.find(x => x.id === 'HIGHLIGHT-DONATION').donation;
    });
  }

  getHighlightedDonation(): Observable<HighlightedDonationId[]> {
    return this.highlightedDonationCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as HighlightedDonation;
        return { id, ...data };
      }))
    );
  }

  setDonationHighlight(highlightedDonation: HighlightedDonation) {
    this.highlightedDonationDoc.set({donation: highlightedDonation.donation, show: highlightedDonation.show}).then(() => {
      console.log('DonationHighlight Document successfully written!');
    });
  }

}
