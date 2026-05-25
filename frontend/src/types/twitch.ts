// Ported from legacy/src/app/services/twitch-service/twitch-service.service.ts

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

export interface UserInformationData {
  data: UserInformation[];
}

export interface ChannelInformation {
  broadcaster_id: string;
  broadcaster_name: string;
  game_name: string;
  game_id: string;
  broadcaster_language: string;
  title: string;
}

export interface SearchChannelsResult {
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

export interface SearchChannelsResponse {
  data: SearchChannelsResult[];
  pagination: { cursor: string };
}
