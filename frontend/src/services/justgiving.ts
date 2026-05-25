// Ported from legacy/src/app/services/jg-service/jg-service.service.ts
//
// JustGiving's `x-api-key` header lives on the Django backend now — these
// functions call our proxy endpoints. Pagination of full donation lists is
// performed server-side to keep the round trips off the browser.

import { api } from '@/lib/api';
import type {
  FundraisingPageDetails,
  FundraisingPageDonations,
  JustGivingDonation,
} from '@/types/justgiving';

export function getFundraisingPageDetails(pageShortName: string, token?: string | null) {
  return api<FundraisingPageDetails>(
    `/api/justgiving/fundraising/pages/${encodeURIComponent(pageShortName)}/`,
    { token },
  );
}

export function getFundraisingPageDonations(
  pageShortName: string,
  pageSize: number,
  pageNumber: number,
  token?: string | null,
) {
  const qs = new URLSearchParams({
    pageSize: String(pageSize),
    pageNumber: String(pageNumber),
  });
  return api<FundraisingPageDonations>(
    `/api/justgiving/fundraising/pages/${encodeURIComponent(pageShortName)}/donations/?${qs}`,
    { token },
  );
}

export function getAllFundraisingPageDonations(pageShortName: string, token?: string | null) {
  return api<JustGivingDonation[]>(
    `/api/justgiving/fundraising/pages/${encodeURIComponent(pageShortName)}/donations/all/`,
    { token },
  );
}
