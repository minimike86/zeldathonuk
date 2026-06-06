import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BreakCountdownService {
  private breakCountdownCollection: AngularFirestoreCollection<BreakCountdown>;
  private breakCountdownData: BreakCountdownId[];

  constructor(private db: AngularFirestore) {
    this.breakCountdownCollection = db.collection<BreakCountdown>('/break-countdown');
    this.getBreakCountdown().subscribe( data => {
      // console.log('getBreakCountdown', data);
      this.breakCountdownData = data;
    });
  }

  getBreakCountdown(): Observable<BreakCountdownId[]> {
    return this.breakCountdownCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as BreakCountdown;
        return { id, ...data };
      }))
    );
  }

  setBreakCountdown(data: Timestamp): void {
    this.breakCountdownCollection.doc('BREAK-COUNTDOWN').update({'timestamp': data});
  }

}

export interface BreakCountdownId extends BreakCountdown {
  id: string;
}

export interface BreakCountdown {
  timestamp: Timestamp;
}
