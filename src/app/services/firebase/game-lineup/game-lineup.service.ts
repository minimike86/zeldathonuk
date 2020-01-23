import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {GameLineUp, GameLineUpId} from './game-lineup';
import {GameItems, GameItemsId} from '../game-item/game-item';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ZeldaGame} from '../../../models/zelda-game';

@Injectable({
  providedIn: 'root'
})
export class GameLineupService {
  private gameLineUpCollection: AngularFirestoreCollection<GameLineUp>;
  private gameLineup: GameLineUp;

  constructor(private db: AngularFirestore) {
    this.gameLineUpCollection = db.collection<GameLineUp>('/game-lineup');
  }

  getGameLineUp(): Observable<GameLineUp[]> {
    return this.gameLineUpCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data();
        return { id, ...data };
      }))
    );
  }

}
