import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/firestore';
import {GameLineUp, GameLineUpId} from './game-lineup';
import {GameItems, GameItemsId} from '../game-item/game-item';
import {Observable, pipe} from 'rxjs';
import {map, switchMap, take} from 'rxjs/operators';
import {ZeldaGame} from '../../../models/zelda-game';

@Injectable({
  providedIn: 'root'
})
export class GameLineupService {
  private gameLineUpCollection: AngularFirestoreCollection<GameLineUp>;

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

  addGameToLineUp(keyString: string, zeldaGame: ZeldaGame) {
    const newGame: GameLineUp = {
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
          order: zeldaGame.order
        }
      }
    };
    this.gameLineUpCollection.doc('ChgBotZzXpt8oeRPAmtg').set(newGame, {merge: true}).then();
  }

}
