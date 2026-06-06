import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {HowLongToBeatGameDetail, HowLongToBeatSearchResult} from './howlongtobeat-models';


@Injectable({
  providedIn: 'root'
})
export class HowLongToBeatService {

  constructor( private httpClient: HttpClient ) {
  }

  search(queryString: string): Observable<HowLongToBeatSearchResult[]> {
    return this.httpClient.get<HowLongToBeatSearchResult[]>(`http://localhost:3000/howlongtobeat/search/${queryString}`);
  }

  getDetail(gameId: string): Observable<HowLongToBeatGameDetail> {
    return this.httpClient.get<HowLongToBeatGameDetail>(`http://localhost:3000/howlongtobeat/detail/${gameId}`);
  }

}
