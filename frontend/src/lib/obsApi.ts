/**
 * Thin wrapper around the Django REST API for the OBS browser sources and
 * the control panel. Both poll-based (sources) and write-based (control)
 * callers use this.
 */
import { api } from '@/lib/api';

export type LayoutKey = '16x9' | '4x3' | '3ds' | 'ds-top' | 'ds-both' | 'fsa-split';

export interface Game {
  id: number;
  title: string;
  platform: string;
  layout_type: LayoutKey;
  default_play_minutes: number;
  box_art_url: string;
  hltb_id: string;
  release_year: number | null;
  items: GameItem[];
}

export interface GameItem {
  id: number;
  game: number;
  name: string;
  image_url: string;
  category: string;
  order: number;
}

export interface Runner {
  id: number;
  name: string;
  channel_url: string;
  is_streamer: boolean;
}

export interface EventModel {
  id: number;
  name: string;
  start_time: string;
  currency_symbol: string;
  is_active: boolean;
}

export interface TimerRun {
  id: number;
  schedule_entry: number;
  started_at: string | null;
  paused_at: string | null;
  accumulated_seconds: number;
  ended_at: string | null;
  is_running: boolean;
  total_seconds: number;
}

export interface ScheduleEntry {
  id: number;
  event: number;
  game: Game;
  runners: Runner[];
  order: number;
  planned_minutes: number | null;
  effective_minutes: number;
  started_at: string | null;
  finished_at: string | null;
  is_completed: boolean;
  notes: string;
  timer: TimerRun | null;
  collected_item_ids: number[];
}

export interface Donation {
  id: number;
  event: number;
  platform: string;
  donor_name: string;
  amount: string;
  currency: string;
  message: string;
  donated_at: string;
  external_id: string;
  gift_aid_amount: string | null;
  image_url: string;
}

export interface DonationTotals {
  by_platform: Array<{
    platform: string;
    currency: string;
    total: string;
    count: number;
  }>;
  grand_total: string;
  donation_count: number;
}

export interface BrbTimer {
  id: number;
  target_time: string;
  message: string;
  is_active: boolean;
  created_at: string;
}

export interface CurrentlyPlaying {
  schedule_entry: number | null;
  schedule_entry_detail: ScheduleEntry | null;
  updated_at: string;
}

export interface AudioTrack {
  id: number;
  title: string;
  artist: string;
  game: string;
  ocr_id: string;
  enabled: boolean;
  order: number;
  url: string;
}

export interface NowPlayingAudio {
  track_id: number | null;
  track: AudioTrack | null;
  is_pinned: boolean;
  is_paused: boolean;
  updated_at: string;
}

export interface NowPlayingAudioPatch {
  track_id?: number | null;
  is_pinned?: boolean;
  is_paused?: boolean;
}

export const obsApi = {
  // Reads
  games: () => api<Game[]>('/api/games/'),
  game: (id: number) => api<Game>(`/api/games/${id}/`),
  events: () => api<EventModel[]>('/api/events/'),
  activeEvent: () => api<EventModel | null>('/api/events/active/'),
  schedule: (eventId?: number) =>
    api<ScheduleEntry[]>(
      eventId ? `/api/schedule/?event=${eventId}` : '/api/schedule/',
    ),
  scheduleEntry: (id: number) => api<ScheduleEntry>(`/api/schedule/${id}/`),
  currentlyPlaying: () => api<CurrentlyPlaying>('/api/currently-playing/'),
  donations: (eventId?: number) =>
    api<Donation[]>(eventId ? `/api/donations/?event=${eventId}` : '/api/donations/'),
  donationTotals: (eventId?: number) =>
    api<DonationTotals>(
      eventId ? `/api/donations/totals/?event=${eventId}` : '/api/donations/totals/',
    ),
  currentBrb: () => api<BrbTimer | null>('/api/brb/current/'),
  audioPlaylist: () => api<AudioTrack[]>('/api/audio/playlist/'),
  nowPlayingAudio: () => api<NowPlayingAudio>('/api/audio/now-playing/'),
  setNowPlayingAudio: (patch: NowPlayingAudioPatch | number | null) => {
    const body: NowPlayingAudioPatch =
      typeof patch === 'object' && patch !== null && !('track_id' in patch && Object.keys(patch).length === 0)
        ? patch
        : { track_id: patch as number | null };
    return api<NowPlayingAudio>('/api/audio/now-playing/', {
      method: 'PUT',
      body,
    });
  },
  updateAudioTrack: (id: number, patch: Partial<AudioTrack>) =>
    api<AudioTrack>(`/api/audio/playlist/`, { method: 'POST', body: { id, ...patch } }),
  // Dev-only: rewrites zelda-themes.ts to drop the import + scenes[] entry
  // and deletes the scene's .tsx file. Backend returns 403 outside DEBUG.
  unregisterScene: (sceneName: string) =>
    api<{
      scene_name: string;
      import_removed: boolean;
      array_edits: number;
      scene_file_deleted: boolean;
    }>('/api/dev/scenes/unregister/', {
      method: 'POST',
      body: { scene_name: sceneName },
    }),

  // Writes
  setCurrentlyPlaying: (scheduleEntryId: number | null) =>
    api<CurrentlyPlaying>('/api/currently-playing/', {
      method: 'PUT',
      body: { schedule_entry: scheduleEntryId },
    }),
  startTimer: (entryId: number) =>
    api<TimerRun>(`/api/schedule/${entryId}/start_timer/`, { method: 'POST' }),
  pauseTimer: (entryId: number) =>
    api<TimerRun>(`/api/schedule/${entryId}/pause_timer/`, { method: 'POST' }),
  resetTimer: (entryId: number) =>
    api<TimerRun>(`/api/schedule/${entryId}/reset_timer/`, { method: 'POST' }),
  stopTimer: (entryId: number) =>
    api<TimerRun>(`/api/schedule/${entryId}/stop_timer/`, { method: 'POST' }),
  toggleCollected: (entryId: number, itemId: number) =>
    api<{ collected: boolean }>(
      `/api/schedule/${entryId}/toggle_collected/`,
      { method: 'POST', body: { item_id: itemId } },
    ),
  setBrb: (payload: { target_time: string; message?: string; is_active?: boolean }) =>
    api<BrbTimer>('/api/brb/', { method: 'POST', body: payload }),
  updateBrb: (id: number, payload: Partial<BrbTimer>) =>
    api<BrbTimer>(`/api/brb/${id}/`, { method: 'PATCH', body: payload }),
};

/** Hook that polls the API on an interval. Bare-bones — replace with TanStack
 *  Query if the project grows. */
import { useEffect, useState } from 'react';

export function usePolledQuery<T>(
  fn: () => Promise<T>,
  intervalMs = 2000,
): { data: T | null; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const result = await fn();
        if (!cancelled) setData(result);
      } catch (e) {
        if (!cancelled) setError(e as Error);
      }
      if (!cancelled) {
        timer = window.setTimeout(tick, intervalMs);
      }
    };

    void tick();
    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs]);

  return { data, error };
}
