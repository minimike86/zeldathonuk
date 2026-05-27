/**
 * Thin wrapper around the Django REST API for the OBS browser sources and
 * the control panel. Both poll-based (sources) and write-based (control)
 * callers use this.
 */
import { api } from '@/lib/api';
import { notifyThemeChanged } from '@/lib/themeBus';

/** Pass-through `.then()` callback that fires a theme-changed broadcast
 *  and returns the response unchanged. Use on any mutation that can
 *  affect what /api/theme/ returns so other tabs re-fetch instantly. */
function withThemeBroadcast<T>(value: T): T {
  notifyThemeChanged();
  return value;
}

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
  profile_image_url: string;
}

export type DonationPlatformKey =
  | 'justgiving'
  | 'tiltify'
  | 'facebook'
  | 'twitch'
  | 'paypal'
  | 'direct'
  | 'other';

export interface DonationPage {
  id: number;
  event: number;
  platform: DonationPlatformKey;
  display_label: string;
  label: string;
  url: string;
  external_id: string;
  is_primary: boolean;
  order: number;
  // Denormalised from DonationPlatformProfile — same for every page of the
  // same platform. Kept on the page payload so the picker UI stays flat.
  fees_url: string;
  gift_aid_url: string;
  fee_warning: string;
  minimum_donation_amount: string; // DecimalField serialises as string.
}

export interface EventModel {
  id: number;
  name: string;
  start_time: string;
  currency_symbol: string;
  is_active: boolean;
  logo_url: string;
  banner_url: string;
  /** SpecialEffect's current GameBlast campaign logo for this event.
   *  Updated annually in /control/events. Blank → consumers fall back
   *  to the static GB22 asset shipped in /public/assets/img/. */
  gameblast_logo_url: string;
  donation_pages: DonationPage[];
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

export type SlotType = 'game' | 'start' | 'meal' | 'sleep' | 'break' | 'end';

export interface ScheduleEntry {
  id: number;
  event: number;
  slot_type: SlotType;
  title: string;
  display_title: string;
  game: Game | null;
  parent_entry: number | null;
  start_offset_minutes: number;
  runners: Runner[];
  order: number;
  planned_minutes: number | null;
  effective_minutes: number;
  started_at: string | null;
  finished_at: string | null;
  is_completed: boolean;
  was_skipped: boolean;
  current_objective: string;
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

export interface ThemeSettings {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
  primary: string;
  primary_bright: string;
  secondary: string;
  background_from: string;
  background_to: string;
  text_color: string;
  text_muted: string;
  line_color: string;
  logo_url: string;
  logo_small_url: string;
  favicon_url: string;
  background_video_url: string;
  background_image_url: string;
  button_gradient_from: string;
  button_gradient_to: string;
  button_text_color: string;
  button_border_color: string;
  divider_thickness: number;
  image_hue_rotate: number;
  link_color: string;
  link_hover_color: string;
  heading_font: string;
  body_font: string;
  updated_at: string;
}

export interface DonationTotals {
  by_platform: Array<{
    platform: string;
    display_label: string;
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

// ── Omnibar v2 ─────────────────────────────────────────────────────────────

export interface PlaythroughEvent {
  id: number;
  schedule_entry: number;
  kind: string;
  payload: Record<string, unknown>;
  created_at: string;
  expires_at: string | null;
}

export type OmnibarLane = 'top' | 'bottom' | 'both';

export interface OmnibarOverride {
  id: number;
  kind: string;
  payload: Record<string, unknown>;
  target_lane: OmnibarLane;
  starts_at: string;
  expires_at: string;
  priority: number;
  is_active: boolean;
  is_live: boolean;
  created_at: string;
}

export interface ExternalEvent {
  id: number;
  source: string;
  kind: string;
  payload: Record<string, unknown>;
  occurred_at: string;
  consumed_at: string | null;
}

export interface Incentive {
  id: number;
  event: number;
  name: string;
  description: string;
  image_url: string;
  goal_amount: string;
  current_amount: string;
  is_active: boolean;
  reached_at: string | null;
  schedule_entry: number | null;
  order: number;
  payload: Record<string, unknown>;
  progress_pct: number;
  is_reached: boolean;
  created_at: string;
  updated_at: string;
}

export interface IncentiveContributeResult extends Incentive {
  newly_reached: boolean;
}

export interface Milestone {
  id: number;
  event: number;
  name: string;
  threshold_amount: string;
  celebration_message: string;
  reached_at: string | null;
  audio_url: string;
  order: number;
  is_reached: boolean;
  created_at: string;
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
  themeSettings: () => api<ThemeSettings>('/api/theme/'),
  // Theme mutations broadcast via themeBus on success so other tabs in
  // the same browser re-fetch immediately. Cross-browser / cross-device
  // updates ride <ThemeProvider>'s 3s poll. Centralising the notify
  // here means any caller (current or future) gets push-to-tabs
  // semantics without having to remember to fire it themselves.
  updateThemeSettings: (patch: Partial<ThemeSettings>, token?: string | null) =>
    api<ThemeSettings>('/api/theme/', { method: 'PATCH', body: patch, token }).then(
      withThemeBroadcast,
    ),
  themesList: () => api<ThemeSettings[]>('/api/themes/'),
  themeCreate: (body: Partial<ThemeSettings>) =>
    api<ThemeSettings>('/api/themes/', { method: 'POST', body }).then(withThemeBroadcast),
  themeUpdate: (id: number, body: Partial<ThemeSettings>) =>
    api<ThemeSettings>(`/api/themes/${id}/`, { method: 'PATCH', body }).then(
      withThemeBroadcast,
    ),
  themeDelete: (id: number) =>
    api<void>(`/api/themes/${id}/`, { method: 'DELETE' }).then(withThemeBroadcast),
  themeActivate: (id: number) =>
    api<ThemeSettings>(`/api/themes/${id}/activate/`, { method: 'POST' }).then(
      withThemeBroadcast,
    ),
  themeDuplicate: (id: number) =>
    api<ThemeSettings>(`/api/themes/${id}/duplicate/`, { method: 'POST' }).then(
      withThemeBroadcast,
    ),
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
  updateScheduleEntry: (
    entryId: number,
    patch: Partial<Pick<ScheduleEntry, 'current_objective' | 'was_skipped' | 'notes' | 'is_completed'>>,
  ) =>
    api<ScheduleEntry>(`/api/schedule/${entryId}/`, {
      method: 'PATCH',
      body: patch,
    }),
  setBrb: (payload: { target_time: string; message?: string; is_active?: boolean }) =>
    api<BrbTimer>('/api/brb/', { method: 'POST', body: payload }),
  updateBrb: (id: number, payload: Partial<BrbTimer>) =>
    api<BrbTimer>(`/api/brb/${id}/`, { method: 'PATCH', body: payload }),

  // ── Omnibar v2 ────────────────────────────────────────────────────────
  // Streams: PlaythroughEvent, OmnibarOverride, ExternalEvent, Incentive,
  // Milestone. The omnibar polls *Since variants on a fast interval; the
  // control panel uses the full lists + mutation actions.

  // Playthrough events (boss-defeated, item-collected, …)
  playthroughEvents: (params?: { scheduleEntryId?: number; since?: string }) => {
    const qs = new URLSearchParams();
    if (params?.scheduleEntryId != null) qs.set('schedule_entry', String(params.scheduleEntryId));
    if (params?.since) qs.set('since', params.since);
    const tail = qs.toString();
    return api<PlaythroughEvent[]>(
      tail ? `/api/playthrough-events/?${tail}` : '/api/playthrough-events/',
    );
  },
  createPlaythroughEvent: (body: {
    schedule_entry: number;
    kind: string;
    payload?: Record<string, unknown>;
    expires_at?: string;
  }) => api<PlaythroughEvent>('/api/playthrough-events/', { method: 'POST', body }),
  deletePlaythroughEvent: (id: number) =>
    api<void>(`/api/playthrough-events/${id}/`, { method: 'DELETE' }),

  // Overrides
  overrides: () => api<OmnibarOverride[]>('/api/overrides/'),
  overridesActive: () => api<OmnibarOverride[]>('/api/overrides/active/'),
  createOverride: (body: {
    kind: string;
    payload?: Record<string, unknown>;
    target_lane?: OmnibarLane;
    starts_at?: string;
    expires_at: string;
    priority?: number;
    is_active?: boolean;
  }) => api<OmnibarOverride>('/api/overrides/', { method: 'POST', body }),
  activateOverride: (id: number) =>
    api<OmnibarOverride>(`/api/overrides/${id}/activate/`, { method: 'POST' }),
  deactivateOverride: (id: number) =>
    api<OmnibarOverride>(`/api/overrides/${id}/deactivate/`, { method: 'POST' }),
  deleteOverride: (id: number) =>
    api<void>(`/api/overrides/${id}/`, { method: 'DELETE' }),

  // External events (Twitch / Discord / …)
  externalEvents: (params?: { source?: string; since?: string; unconsumed?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.source) qs.set('source', params.source);
    if (params?.since) qs.set('since', params.since);
    if (params?.unconsumed) qs.set('unconsumed', 'true');
    const tail = qs.toString();
    return api<ExternalEvent[]>(
      tail ? `/api/external-events/?${tail}` : '/api/external-events/',
    );
  },
  consumeExternalEvent: (id: number) =>
    api<ExternalEvent>(`/api/external-events/${id}/consume/`, { method: 'POST' }),

  // Incentives
  incentives: (params?: { eventId?: number; activeOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.eventId != null) qs.set('event', String(params.eventId));
    if (params?.activeOnly) qs.set('active', 'true');
    const tail = qs.toString();
    return api<Incentive[]>(tail ? `/api/incentives/?${tail}` : '/api/incentives/');
  },
  createIncentive: (body: {
    event: number;
    name: string;
    goal_amount: string;
    description?: string;
    image_url?: string;
    is_active?: boolean;
    schedule_entry?: number | null;
    order?: number;
  }) => api<Incentive>('/api/incentives/', { method: 'POST', body }),
  contributeToIncentive: (id: number, amount: string) =>
    api<IncentiveContributeResult>(
      `/api/incentives/${id}/contribute/`,
      { method: 'POST', body: { amount } },
    ),
  deleteIncentive: (id: number) =>
    api<void>(`/api/incentives/${id}/`, { method: 'DELETE' }),

  // Milestones
  milestones: (params?: { eventId?: number; reached?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.eventId != null) qs.set('event', String(params.eventId));
    if (params?.reached != null) qs.set('reached', params.reached ? 'true' : 'false');
    const tail = qs.toString();
    return api<Milestone[]>(tail ? `/api/milestones/?${tail}` : '/api/milestones/');
  },
  createMilestone: (body: {
    event: number;
    name: string;
    threshold_amount: string;
    celebration_message?: string;
    audio_url?: string;
    order?: number;
  }) => api<Milestone>('/api/milestones/', { method: 'POST', body }),
  markMilestoneReached: (id: number) =>
    api<Milestone>(`/api/milestones/${id}/mark_reached/`, { method: 'POST' }),
  deleteMilestone: (id: number) =>
    api<void>(`/api/milestones/${id}/`, { method: 'DELETE' }),
};

/** Hook that polls the API on an interval. Bare-bones — replace with TanStack
 *  Query if the project grows. */
import { useEffect, useRef, useState } from 'react';

export function usePolledQuery<T>(
  fn: () => Promise<T>,
  intervalMs = 2000,
  // Pass values whose change should cancel the current tick and re-fetch
  // immediately. Typical use: `[event?.id]` for a query that depends on a
  // value loaded by an earlier query — otherwise the first tick fires with
  // the stale value and the user waits a full interval for the next one.
  deps: unknown[] = [],
): { data: T | null; error: Error | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  // Keep the latest fn in a ref so closures created with dynamic state
  // (e.g. `() => obsApi.schedule(event.id)`) always read the current value
  // instead of being frozen at the mount-time closure.
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const tick = async () => {
      try {
        const result = await fnRef.current();
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
  }, [intervalMs, ...deps]);

  return { data, error };
}
