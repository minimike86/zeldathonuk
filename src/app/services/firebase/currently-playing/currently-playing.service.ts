import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CurrentlyPlayingService {
  private currentlyPlayingCollection: AngularFirestoreCollection<CurrentlyPlaying>;
  private currentlyPlaying: CurrentlyPlayingId[];

  constructor(public db: AngularFirestore) {
    this.currentlyPlayingCollection = db.collection<CurrentlyPlaying>('/currently-playing');
    this.getCurrentlyPlaying().subscribe( data => {
      this.currentlyPlaying = data;
    });
  }

  getCurrentlyPlaying(): Observable<CurrentlyPlayingId[]> {
    return this.currentlyPlayingCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as CurrentlyPlaying;
        return { id, ...data };
      }))
    );
  }

  setCurrentlyPlaying(data: CurrentlyPlaying): void {
    this.currentlyPlayingCollection.doc('bFrAHwuF1iksUjYAkhj3').set(data);
  }

}


export interface CurrentlyPlayingId extends CurrentlyPlaying {
  id: string;
}

export interface CurrentlyPlaying {
  coverArt: string;
  gameName: string;
  gameType: string;
  gamePlatform: string;
  gameRelYear: string;
  gameEstimate: string;
}

