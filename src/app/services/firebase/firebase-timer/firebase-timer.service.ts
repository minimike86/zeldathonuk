import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { CountUpTimer, CountUpTimerId } from './count-up-timer';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;

@Injectable({
  providedIn: 'root'
})
export class FirebaseTimerService {
  private countUpCollection: AngularFirestoreCollection<CountUpTimer>;
  private countUpData: CountUpTimerId[];

  constructor(private db: AngularFirestore) {
    this.countUpCollection = db.collection<CountUpTimer>('/count-up');
    this.getCountUpTimer().subscribe( data => {
      this.countUpData = data;
    });
  }

  getCountUpTimer(): Observable<CountUpTimerId[]> {
    return this.countUpCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as CountUpTimer;
        return { id, ...data };
      }))
    );
  }

  setCountUpTimerStartDate(data: Timestamp): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'startDate': data});
  }

  setCountUpTimerStopDate(data: Timestamp): void {
    data === undefined || data === null ? this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'stopDate': null})
      : this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'stopDate': data});
  }

  setCountUpTimerIsStarted(data: boolean): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'isStarted': data});
  }

  setCountUpTimerHasPaused(data: boolean): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'hasPaused': data});
  }

  setCountUpTimerIsStopped(data: boolean): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'isStopped': data});
  }

}
