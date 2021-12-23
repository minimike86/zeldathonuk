import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CurrentlyPlaying, CurrentlyPlayingId } from './currently-playing';


@Injectable({
  providedIn: 'root'
})
export class CurrentlyPlayingService {
  private currentlyPlayingCollection: AngularFirestoreCollection<CurrentlyPlaying>;
  public currentlyPlaying: CurrentlyPlayingId[] = [];

  constructor(private db: AngularFirestore) {
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
    this.currentlyPlayingCollection.doc('CURRENTLY-PLAYING').set(data);
  }

}
