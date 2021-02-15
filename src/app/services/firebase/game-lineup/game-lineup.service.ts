import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/firestore';
import {GameLineUp, GameLineUpId} from './game-lineup';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ZeldaGame} from '../../../models/zelda-game';
import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;
import * as moment from 'moment';


@Injectable({
  providedIn: 'root'
})
export class GameLineupService {
  private gameLineUpCollection: AngularFirestoreCollection<GameLineUp>;
  private gameLineUpCollectionDoc: AngularFirestoreDocument<GameLineUp>;

  constructor(private db: AngularFirestore) {
    this.gameLineUpCollection = db.collection<GameLineUp>('/game-lineup');
    this.gameLineUpCollectionDoc = this.gameLineUpCollection.doc('GAME-LINEUP');
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

  updateGameFinished(oldGame: ZeldaGame, newGame: ZeldaGame) {
    const update = {};
    update[`gameLineUp.${oldGame.gameProgressKey}.endDate`] = Timestamp.now();
    this.gameLineUpCollectionDoc.ref.update(update).then(() => {
      console.log('endDate Document successfully written!');
    });
    update[`gameLineUp.${newGame.gameProgressKey}.startDate`] = Timestamp.now();
    this.gameLineUpCollectionDoc.ref.update(update).then(() => {
      console.log('startDate Document successfully written!');
    });
  }

  addGameToLineUp(keyString: string, zeldaGame: ZeldaGame) {
    const newGame: any = {
      // @ts-ignore
      gameLineUp: {
        [keyString]: {
          coverArt: zeldaGame.coverArt,
          gameName: zeldaGame.gameName,
          gameType: zeldaGame.gameType,
          gamePlatform: zeldaGame.gamePlatform,
          gameRelYear: zeldaGame.gameRelYear,
          gameEstimate: zeldaGame.gameEstimate,
          gameProgressKey: zeldaGame.gameProgressKey,
          active: zeldaGame.active,
          order: zeldaGame.order,
          timeline: zeldaGame.timeline,
          extraBadges: zeldaGame.extraBadges,
          runners: zeldaGame.runners,
          startDate: Timestamp.fromDate(moment(zeldaGame.startDate, 'YYYY-MM-DDTkk:mm').toDate()),
          endDate: zeldaGame.endDate
        }
      }
    };
    this.gameLineUpCollection.doc('GAME-LINEUP').set(newGame, {merge: true}).then();
  }

}
