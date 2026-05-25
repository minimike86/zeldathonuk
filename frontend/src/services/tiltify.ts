// Ported from legacy/src/app/services/tiltify-service/tiltify.service.ts
//
// In the new architecture the bearer token lives on the Django backend, not in
// the browser. These functions call our backend, which proxies Tiltify with
// the server-held credentials.

import { api } from '@/lib/api';
import type { TiltifyCampaign, TiltifyCampaignDonations } from '@/types/tiltify';

export function getCampaignById(id: number, token?: string | null) {
  return api<TiltifyCampaign>(`/api/tiltify/campaigns/${id}/`, { token });
}

export function getCampaignDonationsById(id: number, token?: string | null) {
  return api<TiltifyCampaignDonations>(`/api/tiltify/campaigns/${id}/donations/`, { token });
}
