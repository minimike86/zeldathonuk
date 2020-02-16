import { Injectable } from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OmnibarContentService {

  private currentOmnibarContentId: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor() {
  }

  getCurrentOmnibarContentId(): Observable<number> {
    return this.currentOmnibarContentId.asObservable();
  }

  setCurrentOmnibarContentId(id: number, timeout: number): void {
    console.log('switching to next Omnibar Content Id', id);
    setTimeout(() => {
      return this.currentOmnibarContentId.next(id);
    }, timeout);
  }

}
