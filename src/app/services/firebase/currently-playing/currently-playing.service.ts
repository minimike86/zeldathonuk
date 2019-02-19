import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { Observable } from "rxjs";
import { map } from 'rxjs/operators';
import { CurrentlyPlaying, CurrentlyPlayingId } from "./currently-playing";

@Injectable({
  providedIn: 'root'
})
export class CurrentlyPlayingService {
  private currentlyPlayingCollection: AngularFirestoreCollection<CurrentlyPlaying>;
  private currentlyPlaying: CurrentlyPlayingId[];

  public minishCapDesc = {
    coverArt: '../../../../../assets/img/cover-art/Minish_Cap_cover.jpg',
    gameName: 'The Legend of Zelda: The Minish Cap',
    gameType: 'Casual Any%',
    gamePlatform: 'GBA',
    gameRelYear: '2004',
    gameEstimate: '11:00:00'
  };
  public majorasMaskDesc = {
    coverArt: '../../../../../assets/img/cover-art/Majoras_Mask_3D_cover.jpg',
    gameName: 'The Legend of Zelda: Majora\'s Mask 3D',
    gameType: 'Casual Any%',
    gamePlatform: '3DS',
    gameRelYear: '2009',
    gameEstimate: '16:45:00'
  };
  public spiritTracksDesc = {
    coverArt: '../../../../../assets/img/cover-art/Spirit_Tracks_cover.jpg',
    gameName: 'The Legend of Zelda: Spirit Tracks',
    gameType: 'Casual Any%',
    gamePlatform: 'DS',
    gameRelYear: '2004',
    gameEstimate: '14:49:00'
  };
  public adventureOfLinkDesc = {
    coverArt: '../../../../../assets/img/cover-art/Adventure_of_Link_cover.jpg',
    gameName: 'Zelda II: The Adventure of Link',
    gameType: 'Casual Any%',
    gamePlatform: 'NES',
    gameRelYear: '1987',
    gameEstimate: '14:49:00'
  };
  public twilightPrincessDesc = {
    coverArt: '../../../../../assets/img/cover-art/Twilight_Princess_HD_cover.jpg',
    gameName: 'The Legend of Zelda: Twilight Princess HD',
    gameType: 'Casual Any%',
    gamePlatform: 'WiiU',
    gameRelYear: '2006',
    gameEstimate: '21:42:00'
  };
  public linksAwakeningDesc = {
    coverArt: '../../../../../assets/img/cover-art/Links_Awakening_cover.jpg',
    gameName: 'The Legend of Zelda: Link\'s Awakening DX',
    gameType: 'Casual Any%',
    gamePlatform: 'GBC',
    gameRelYear: '1993',
    gameEstimate: '10:32:00'
  };
  public gameList = [this.minishCapDesc, this.majorasMaskDesc, this.spiritTracksDesc, this.adventureOfLinkDesc, this.twilightPrincessDesc, this.linksAwakeningDesc];

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
    this.currentlyPlayingCollection.doc('bFrAHwuF1iksUjYAkhj3').set(data);
  }

}
