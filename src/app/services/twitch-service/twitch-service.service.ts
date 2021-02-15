import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, delay, map, retry} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TwitchService {

  private clientId = 'g1aemw0yex5u12xuumeakmmfarie6q';
  private clientSecret = '######';

  private accessToken: AccessToken = {
    access_token: '######',
    expires_in: 5167700,
    token_type: 'bearer'
  };

  constructor(private http: HttpClient) {
  }

  getChannelInformation(broadcasterId: string): Observable<ChannelInformation> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.appToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.get<ChannelInformation>(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`,
      {headers: httpHeaders});
  }

  getSearchChannels(query: string, first: number, liveOnly: boolean): Observable<SearchChannelsData> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.appToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.get<SearchChannelsData>(
      `https://api.twitch.tv/helix/search/channels?query=${query}&first=${first}&live_only=${liveOnly}`,
      {headers: httpHeaders}).pipe(map((rawData: any) => {
        return rawData.data[0];
    }));
  }

  getGamesById(id: string): Observable<GamesData> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.appToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.get<GamesData>(`https://api.twitch.tv/helix/games?id=${id}`,
                                    {headers: httpHeaders}).pipe(map((rawData: any) => {
      return rawData.data[0];
    }));
  }

  getGamesByName(name: string): Observable<GamesData> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.appToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.get<GamesData>(`https://api.twitch.tv/helix/games?name=${name}`,
                                    {headers: httpHeaders}).pipe(map((rawData: any) => {
      return rawData.data[0];
    }));
  }

  /**
   * Modifies channel information for users.
   * @param broadcasterId         - ID of the channel to be updated
   * @param gameId                - The current game ID being played on the channel
   * @param broadcasterLanguage   - The language of the channel. Must be either the ISO 639-1 two-letter code or “other”.
   * @param title                 - The title of the stream
   */
  updateChannel(broadcasterId: string, gameId: string, broadcasterLanguage: string, title: string): Observable<any> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.userToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.patch<any>(`https://api.twitch.tv/helix/channels/?broadcaster_id=${broadcasterId}`,
        {
                game_id: gameId,
                broadcaster_language: broadcasterLanguage,
                title: title
              },
      {headers: httpHeaders});
  }

  /**
   * Creates a marker in the stream of a user specified by user ID. A marker is an arbitrary point in a stream that the broadcaster wants
   * to mark; e.g., to easily return to later. The marker is created at the current timestamp in the live broadcast when the request is
   * processed. Markers can be created by the stream owner or editors. The user creating the marker is identified by a Bearer token.
   * @param userId            - ID of the broadcaster in whose live stream the marker is created.
   * @param description       - Description of or comments on the marker. Max length is 140 characters.
   */
  createStreamMaker(userId: string, description?: string): Observable<StreamMarkerResponse> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.userToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.post<any>(`https://api.twitch.tv/helix/streams/markers`,
        {
                user_id: userId,
                description: description
              },
      {headers: httpHeaders});
  }

}

export interface StreamMarkerData {
  id: string;
  created_at: string;
  description: string;
  position_seconds: number;
}

export interface StreamMarkerResponse {
  data: StreamMarkerData[];
}

export interface AccessToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string[];
  token_type: string;
}

export interface ChannelInformation {
  broadcaster_id: string;
  broadcaster_name: string;
  game_name: string;
  game_id: string;
  broadcaster_language: string;
  title: string;
}

export interface GamesResponse {
  data: GamesResponse[];
  pagination: {
    cursor: string
  };
}

export interface GamesData {
  id: string;
  name: string;
  box_art_url: string;
}

export interface SearchChannelsResponse {
  data: SearchChannelsData[];
  pagination: {
    cursor: string
  };
}

export interface SearchChannelsData {
  game_id: string;
  id: string;
  display_name: string;
  broadcaster_language: string;
  title: string;
  thumbnail_url: string;
  is_live: boolean;
  started_at?: string;
  tag_ids?: string;
}
