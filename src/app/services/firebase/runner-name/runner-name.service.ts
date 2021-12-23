import { Injectable } from '@angular/core';
import {AngularFirestore, AngularFirestoreCollection} from '@angular/fire/compat/firestore';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {RunnerName, RunnerNameId} from './runner-name';

@Injectable({
  providedIn: 'root'
})
export class RunnerNameService {
  private runnerNameCollection: AngularFirestoreCollection<RunnerName>;
  private runnerNameData: RunnerNameId[];

  constructor(private db: AngularFirestore) {
    this.runnerNameCollection = db.collection<RunnerName>('/runner-name');
    this.getRunnerName().subscribe( data => {
      this.runnerNameData = data;
    });
  }

  getRunnerName(): Observable<RunnerNameId[]> {
    return this.runnerNameCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const id = a.payload.doc.id;
        const data = a.payload.doc.data() as RunnerName;
        return { id, ...data };
      }))
    );
  }

  setRunnerName(data: RunnerName): void {
    this.runnerNameCollection.doc('e9Iy55yT6TgC91xriRrR').update(data);
  }

}
