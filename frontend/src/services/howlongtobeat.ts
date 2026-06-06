// Ported from legacy/src/app/services/howlongtobeat-service/howlongtobeat.service.ts
//
// The original code hit a separate `localhost:3000` service. We've folded
// HowLongToBeat proxy responsibilities into the Django backend.

import { api } from '@/lib/api';
import type {
  HowLongToBeatGameDetail,
  HowLongToBeatSearchResult,
} from '@/types/howlongtobeat';

export function search(queryString: string, token?: string | null) {
  return api<HowLongToBeatSearchResult[]>(
    `/api/howlongtobeat/search/${encodeURIComponent(queryString)}/`,
    { token },
  );
}

export function getDetail(gameId: string, token?: string | null) {
  return api<HowLongToBeatGameDetail>(
    `/api/howlongtobeat/detail/${encodeURIComponent(gameId)}/`,
    { token },
  );
}
