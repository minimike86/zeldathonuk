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
      .set('Authorization', `Bearer ${this.accessToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.get<ChannelInformation>(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, {headers: httpHeaders});
  }

  getSearchChannels(query: string, first: number, liveOnly: boolean): Observable<SearchChannelsResponse> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${this.accessToken.access_token}`)
      .set('Client-Id', this.clientId);
    return this.http.get<RawSearchChannelsResponse>(
      `https://api.twitch.tv/helix/search/channels?query=${query}&first=${first}&live_only=${liveOnly}`,
      {headers: httpHeaders}).pipe(map(rawData => {
        return rawData.data[0];
    }));
  }

}

export interface AccessToken {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string[];
  token_type: string;
}

export interface ChannelInformation {
  broadcaster_id: string;       // Twitch User ID of this channel owner
  broadcaster_name: string;     // Twitch user display name of this channel owner
  game_name: string;            // Name of the game being played on the channel
  game_id: string;              // Current game ID being played on the channel
  broadcaster_language: string; // Language of the channel. Either the ISO 639-1 two-letter code for a supported stream language or “other”.
  title: string;                // Title of the stream
}

export interface RawSearchChannelsResponse {
  data: SearchChannelsResponse[];
  pagination: {
    cursor: string
  };
}

export interface SearchChannelsResponse {
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
