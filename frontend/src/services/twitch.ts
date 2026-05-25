// Ported from legacy/src/app/services/twitch-service/twitch-service.service.ts
//
// Twitch client-id and access token live on the Django backend. These call
// our proxy endpoints.

import { api } from '@/lib/api';
import type {
  ChannelInformation,
  SearchChannelsResult,
  UserInformationData,
} from '@/types/twitch';

export function getUserInformation(token?: string | null) {
  return api<UserInformationData>('/api/twitch/users/', { token });
}

export function getUserInformationById(userId: number, token?: string | null) {
  return api<UserInformationData>(`/api/twitch/users/?id=${userId}`, { token });
}

export function getChannelInformation(broadcasterId: number, token?: string | null) {
  return api<ChannelInformation>(
    `/api/twitch/channels/?broadcaster_id=${broadcasterId}`,
    { token },
  );
}

export function searchChannels(
  query: string,
  first: number,
  liveOnly: boolean,
  token?: string | null,
) {
  const qs = new URLSearchParams({
    query,
    first: String(first),
    live_only: String(liveOnly),
  });
  return api<SearchChannelsResult>(`/api/twitch/search/channels/?${qs}`, { token });
}
