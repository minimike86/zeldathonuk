import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { GameLineUp, GameLineUpId } from './game-lineup';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ScheduledVideoGame, VideoGame } from '../../../models/video-game';
import firebase from 'firebase/compat/app';
import FieldValue = firebase.firestore.FieldValue;
import { Timestamp } from '@firebase/firestore';


@Injectable({
  providedIn: 'root'
})
export class GameLineupService {
  private gameLineUpCollection: AngularFirestoreCollection<GameLineUp>;
  private availableGamesDoc: AngularFirestoreDocument<GameLineUp>;
  private activeScheduleDoc: AngularFirestoreDocument<GameLineUp>;

  constructor(private db: AngularFirestore) {
    this.gameLineUpCollection = db.collection<GameLineUp>('/game-lineup');
    this.availableGamesDoc = this.gameLineUpCollection.doc('AVAILABLE-GAMES');
    this.activeScheduleDoc = this.gameLineUpCollection.doc('ACTIVE-SCHEDULE');
  }

  getGameLineUp(): Observable<GameLineUpId[]> {
    return this.gameLineUpCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data();
        return { id, ...data };
      }))
    );
  }

  addAvailableGames(zeldaGames: VideoGame[]): void {
    console.log('addAvailableGames: ', zeldaGames);
    this.availableGamesDoc.ref.update({
      availableGames: FieldValue.arrayUnion(...zeldaGames)
    }).then(() => {
      console.log('availableGames Document successfully written!');
    });
  }

  removeAvailableGames(videoGames: VideoGame[]): void {
    console.log('removeTrackedDonation: ', videoGames);
    this.availableGamesDoc.ref.update({
      availableGames: FieldValue.arrayRemove(...videoGames)
    }).then(() => {
      console.log('availableGames Document successfully written!');
    });
  }

  updateGameToActiveSchedule(scheduledVideoGame: ScheduledVideoGame[]): void {
    console.log('updateGameToActiveSchedule: ', scheduledVideoGame);
    this.activeScheduleDoc.ref.update({
      activeSchedule: FieldValue.arrayUnion(...scheduledVideoGame)
    }).then(() => {
      console.log('activeSchedule Document successfully written!');
    });
  }

  purgeActiveSchedule(): void {
    console.log('purgeActiveSchedule: ');
    this.activeScheduleDoc.ref.set({
      activeSchedule: []
    }, {merge: true}).then(() => {
      console.log('activeSchedule Document successfully written!');
    });
  }

  removeGameFromActiveSchedule(scheduledVideoGame: ScheduledVideoGame[]): void {
    console.log('removeTrackedDonation: ', scheduledVideoGame);
    this.activeScheduleDoc.ref.update({
      activeSchedule: FieldValue.arrayRemove(...scheduledVideoGame)
    }).then(() => {
      console.log('activeSchedule Document successfully written!');
    });
  }

  updateActiveScheduleStartTimestamp(date: Date): void {
    console.log('startTimestamp: ', date);
    this.activeScheduleDoc.ref.update({
      startTimestamp: Timestamp.fromDate(date)
    }).then(() => {
      console.log('startTimestamp Document successfully written!');
    });
  }

}
