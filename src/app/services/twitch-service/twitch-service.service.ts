import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {twitchEnvironment} from '../../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class TwitchService {

  constructor(private http: HttpClient) {
  }

  getUserInformation(): Observable<UserInformationData> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${twitchEnvironment.accessToken}`)
      .set('Client-Id', twitchEnvironment.clientId);
    return this.http.get<UserInformationData>(
      `https://api.twitch.tv/helix/users`, {headers: httpHeaders});
  }

  getUserInformationById(userId: number): Observable<UserInformationData> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${twitchEnvironment.accessToken}`)
      .set('Client-Id', twitchEnvironment.clientId);
    return this.http.get<UserInformationData>(
      `https://api.twitch.tv/helix/users?id=${userId}`, {headers: httpHeaders});
  }

  getChannelInformation(broadcasterId: number): Observable<ChannelInformation> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${twitchEnvironment.accessToken}`)
      .set('Client-Id', twitchEnvironment.clientId);
    return this.http.get<ChannelInformation>(
      `https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, {headers: httpHeaders});
  }

  getSearchChannels(query: string, first: number, liveOnly: boolean): Observable<SearchChannelsResponse> {
    const httpHeaders = new HttpHeaders()
      .set('Authorization', `Bearer ${twitchEnvironment.accessToken}`)
      .set('Client-Id', twitchEnvironment.clientId);
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

export interface UserInformationData {
  data: UserInformation[];
}

export interface UserInformation {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
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
