import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { CountUpTimer, CountUpTimerId } from "./count-up-timer";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import * as firebase from 'firebase/app'
import 'firebase/firestore'

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

  setCountUpTimerStartDate(data: Date): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'startDate':firebase.firestore.Timestamp.fromDate(data)});
  }

  setCountUpTimerStopDate(data: Date): void {
    data === undefined || data === null ? this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'stopDate':null})
      : this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'stopDate':firebase.firestore.Timestamp.fromDate(data)});
  }

  setCountUpTimerIsStarted(data: boolean): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'isStarted':data});
  }

  setCountUpTimerHasPaused(data: boolean): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'hasPaused':data});
  }

  setCountUpTimerIsStopped(data: boolean): void {
    this.countUpCollection.doc('vuect9iPi4vNbssTOgLC').update({'isStopped':data});
  }

}