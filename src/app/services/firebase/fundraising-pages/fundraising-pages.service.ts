import {Injectable} from '@angular/core';
import {JgService} from '../../jg-service/jg-service.service';
import {AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;
import {JgImage} from '../../jg-service/fundraising-page';


@Injectable({
  providedIn: 'root'
})
export class FundraisingPagesService {
  private fundraisingPagesCollection: AngularFirestoreCollection<any>;
  private fundraisingPagesDoc: AngularFirestoreDocument<any>;
  private fundraisingPagesIdArray: FundraisingPageId[];
  private fundraisingPages: FundraisingPage[];

  constructor( private jgService: JgService,
               private db: AngularFirestore ) {
    this.fundraisingPages = [];
    this.fundraisingPagesCollection = db.collection<any>('/fundraising-pages');
    this.fundraisingPagesDoc = this.fundraisingPagesCollection.doc('FUNDRAISING-PAGES');
    this.getFundraisingPagesIdArray().subscribe( data => {
      this.fundraisingPagesIdArray = data;
      this.fundraisingPages = data.find(x => x.id === 'FUNDRAISING-PAGES').fundraisingPages;
    });
  }

  getFundraisingPagesIdArray(): Observable<FundraisingPageId[]> {
    return this.fundraisingPagesCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as FundraisingPages;
        return { id, ...data };
      }))
    );
  }

  setFundraisingPages(fundraisingPages: FundraisingPage[]) {
    this.fundraisingPagesDoc.set({fundraisingPages: fundraisingPages}).then(() => {
      console.log('FundraisingPage Document successfully written!');
    });
  }

}

export interface FundraisingPageId extends FundraisingPages {
  id: string;
}
export interface FundraisingPages {
  fundraisingPages: FundraisingPage[];
}

export interface FundraisingPage {
  pageId: number;
  pageShortName: string;
  eventDate: Timestamp;
  expiryDate: Timestamp;
  image: JgImage;
  title: string;
  story: string;
  currencyCode: string;
  currencySymbol: string;
  grandTotalRaisedExcludingGiftAid: string;
  vendor: string;
}
