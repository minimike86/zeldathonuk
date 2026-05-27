/**
 * Thin wrapper around the Django REST API for the OBS browser sources and
 * the control panel. Both poll-based (sources) and write-based (control)
 * callers use this.
 */
import { api } from '@/lib/api';
import { notifyCharitySlidesChanged } from '@/lib/charityBus';
import { notifyEventChanged } from '@/lib/eventBus';
import { notifyThemeChanged } from '@/lib/themeBus';

/** Pass-through `.then()` callback that fires a theme-changed broadcast
 *  and returns the response unchanged. Use on any mutation that can
 *  affect what /api/theme/ returns so other tabs re-fetch instantly. */
function withThemeBroadcast<T>(value: T): T {
  notifyThemeChanged();
  return value;
}

/** Same pattern as `withThemeBroadcast` but for the charity slide
 *  list. Wraps any successful charity mutation so other tabs in this
 *  browser (notably an open /obs/omnibar) re-fetch immediately
 *  instead of waiting on the poll cycle. */
function withCharityBroadcast<T>(value: T): T {
  notifyCharitySlidesChanged();
  return value;
}

/** Same pattern but for Event row mutations. Subscribers (the omnibar,
 *  the ad-panel carousel) bump their event poll the moment this fires,
 *  so /control/omnibar layout changes land on /obs/omnibar in one
 *  render frame instead of waiting up to the active-event poll. */
function withEventBroadcast<T>(value: T): T {
  notifyEventChanged();
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
  /** Per-game omnibar layout override. Same shape as
   *  Event.omnibar_layout. Wins over the event-level layout while
   *  this game is the active playthrough; empty falls back to event. */
  omnibar_layout: Record<string, unknown>;
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
  /** Omnibar lane composition JSON. Empty object → fall back to the
   *  defaults in `omnibar/hooks/useLayoutConfig.ts`. Shape:
   *  { lanes: [{ id, mode, intervalMs, panels: [...] }] }. */
  omnibar_layout: Record<string, unknown>;
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
  setpiece_kind: string;
  setpiece_name: string;
  /** '' | 'imminent' | 'active'. 'cleared' is signalled via a
   *  PlaythroughEvent, not stored here. */
  setpiece_stage: '' | 'imminent' | 'active';
  setpiece_started_at: string | null;
  notes: string;
  timer: TimerRun | null;
  collected_item_ids: number[];
}

/** Why a donation has been suppressed from /obs/tts + /obs/omnibar.
 *  Empty string = not muted; everything else is a reason tag the
 *  operator picked from the dropdown in /control/donations. Source
 *  of truth lives in `models.MuteReason`; the live list of labels
 *  comes from `/api/donation-mute-reasons/` so a new reason is a
 *  backend-only change. */
export type MuteReason =
  | ''
  | 'naughty_name'
  | 'naughty_message'
  | 'naughty_image'
  | 'already_announced'
  | 'other';

export interface MuteReasonChoice {
  value: MuteReason;
  label: string;
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
  /** Operator-set reason this donation is muted. Empty string = not
   *  muted. /obs/tts and /obs/omnibar still read the read-only
   *  `is_muted` boolean (derived server-side from `mute_reason !== ''`)
   *  so existing skip-logic doesn't have to know about the reason tag. */
  mute_reason: MuteReason;
  /** Read-only convenience flag — backend property derived from
   *  `mute_reason !== ''`. Don't PATCH this; PATCH `mute_reason`. */
  is_muted: boolean;
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

export interface ChestAnnouncerSettings {
  /** When true, /obs/chest-announcer plays its fanfare on each card reveal.
   *  Default false so the omnibar's TTS isn't competing with the fanfare. */
  audio_enabled: boolean;
  /** Pause in milliseconds between donation cards when multiple
   *  donations are queued. Hero stays idle at the chest for this long
   *  before reaching in for the next reveal. Default 1500. */
  between_cards_ms: number;
  /** Minimum time (ms) a donation card stays on screen, even if its
   *  audio finishes earlier. Keeps the visual rhythm consistent for
   *  short stings. Default 2800. */
  card_min_hold_ms: number;
  /** Hard ceiling (ms) on how long a card waits for its audio to
   *  finish. A runaway long sting gets cut off after this so the
   *  queue keeps moving. Default 20000. */
  card_max_hold_ms: number;
  updated_at: string;
}

export type ChestAnnouncerSoundTriggerKind = 'game' | 'amount' | 'keyword';

export interface ChestAnnouncerSoundTrigger {
  id: number;
  /** Operator-facing label. */
  name: string;
  kind: ChestAnnouncerSoundTriggerKind;
  /** amount: decimal string ("6.70"). keyword: comma-separated case-
   *  insensitive substrings. Unused for game — see `game` FK. */
  match: string;
  /** FK to Game (only meaningful when kind=game). */
  game: number | null;
  /** Denormalised Game.title for display in the control page. */
  game_title: string;
  /** Absolute URL or site-relative path to an audio file the browser
   *  can play (mp3, wav, ogg). Streamer supplies — nothing bundled. */
  sound_url: string;
  /** Playback gain (0.0–1.0). */
  volume: number;
  /** Lower = higher priority. */
  priority: number;
  is_active: boolean;
  created_at: string;
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

/** Singleton "play this donation in TTS" pointer. /obs/tts polls this
 *  and re-enqueues the donation when `requested_at` advances past the
 *  value it last saw. */
export interface TtsReplay {
  donation_id: number | null;
  requested_at: string;
}

/** Singleton mirror of what /obs/tts is currently announcing. The
 *  overlay POSTs `donation_id` when an utterance starts, posts null
 *  when it ends. /control/donations polls this so the operator can see
 *  which row is live (and which to mute if it goes sideways). */
export interface TtsNowReading {
  donation_id: number | null;
  started_at: string;
}

/** Singleton "re-fire this donation through /obs/chest-announcer".
 *  Same shape as TtsReplay — the chest overlay polls it and re-
 *  enqueues the donation when `requested_at` advances past the
 *  value it last saw. */
export interface ChestReplay {
  donation_id: number | null;
  requested_at: string;
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

export type CharitySlideKind = 'logo' | 'blurb';

export interface CharitySlide {
  id: number;
  kind: CharitySlideKind;
  /** Used when kind='blurb' — gold uppercase header line. */
  title: string;
  /** Used when kind='blurb' — body text. */
  body: string;
  /** Used when kind='logo' — image URL (absolute or site-relative). */
  image_url: string;
  /** Used when kind='logo' — alt text + identity label. */
  alt_text: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  // TTS replay — POST `{donation_id}` to ask /obs/tts to re-announce a
  // donation. The endpoint stores the donation pointer + a fresh
  // `requested_at` on a singleton row; the TTS overlay polls the
  // GET shape and treats `requested_at` as a high-water mark.
  ttsReplay: () => api<TtsReplay>('/api/tts/replay/'),
  requestTtsReplay: (donationId: number) =>
    api<TtsReplay>('/api/tts/replay/', {
      method: 'POST',
      body: { donation_id: donationId },
    }),
  // TTS now-reading mirror — /obs/tts POSTs `{donation_id}` when an
  // utterance starts and `{donation_id: null}` when it ends.
  // /control/donations polls the GET to highlight the live row.
  ttsNowReading: () => api<TtsNowReading>('/api/tts/now-reading/'),
  setTtsNowReading: (donationId: number | null) =>
    api<TtsNowReading>('/api/tts/now-reading/', {
      method: 'POST',
      body: { donation_id: donationId },
    }),
  // Chest-announcer replay — POST `{donation_id}` to ask
  // /obs/chest-announcer to re-fire the cardlaunch + fanfare for a
  // donation. Same high-water-mark contract as ttsReplay.
  chestReplay: () => api<ChestReplay>('/api/chest-announcer/replay/'),
  requestChestReplay: (donationId: number) =>
    api<ChestReplay>('/api/chest-announcer/replay/', {
      method: 'POST',
      body: { donation_id: donationId },
    }),
  // Mute-reason dropdown options — fetched from the server so adding /
  // renaming a reason in `models.MuteReason` doesn't need a frontend
  // edit. Cached infrequently (the enum rarely changes).
  donationMuteReasons: () =>
    api<MuteReasonChoice[]>('/api/donation-mute-reasons/'),
  // Bulk donation actions — both scoped to a single event by design
  // so an accidental click can never wipe / mute an entire history
  // across events. The /control/donations buttons double-confirm
  // before calling these.
  deleteAllDonations: (eventId: number) =>
    api<{ deleted: number }>('/api/donations/delete_all/', {
      method: 'POST',
      body: { event_id: eventId },
    }),
  muteAllDonations: (eventId: number, reason: MuteReason = 'already_announced') =>
    api<{ updated: number; mute_reason: MuteReason }>(
      '/api/donations/mute_all/',
      {
        method: 'POST',
        body: { event_id: eventId, mute_reason: reason },
      },
    ),
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
  chestAnnouncerSettings: () =>
    api<ChestAnnouncerSettings>('/api/chest-announcer/settings/'),
  updateChestAnnouncerSettings: (
    patch: Partial<ChestAnnouncerSettings>,
    token?: string | null,
  ) =>
    api<ChestAnnouncerSettings>('/api/chest-announcer/settings/', {
      method: 'PATCH',
      body: patch,
      token,
    }),
  chestAnnouncerSoundTriggers: () =>
    api<ChestAnnouncerSoundTrigger[]>('/api/chest-announcer/sound-triggers/'),
  createChestAnnouncerSoundTrigger: (
    body: Partial<ChestAnnouncerSoundTrigger>,
  ) =>
    api<ChestAnnouncerSoundTrigger>('/api/chest-announcer/sound-triggers/', {
      method: 'POST',
      body,
    }),
  updateChestAnnouncerSoundTrigger: (
    id: number,
    body: Partial<ChestAnnouncerSoundTrigger>,
  ) =>
    api<ChestAnnouncerSoundTrigger>(
      `/api/chest-announcer/sound-triggers/${id}/`,
      { method: 'PATCH', body },
    ),
  deleteChestAnnouncerSoundTrigger: (id: number) =>
    api<void>(`/api/chest-announcer/sound-triggers/${id}/`, {
      method: 'DELETE',
    }),
  duplicateChestAnnouncerSoundTrigger: (id: number) =>
    api<ChestAnnouncerSoundTrigger>(
      `/api/chest-announcer/sound-triggers/${id}/duplicate/`,
      { method: 'POST' },
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
  setSetpiece: (
    entryId: number,
    body:
      | { stage: 'imminent' | 'active'; kind: string; name?: string }
      | { stage: 'cleared'; result_kind?: string },
  ) =>
    api<ScheduleEntry>(`/api/schedule/${entryId}/setpiece/`, {
      method: 'POST',
      body,
    }),
  // Sandbox triggers — DEBUG-only on the backend (returns 404 in prod).
  sandboxTwitchEvent: (body: {
    kind: string;
    user_name?: string;
    extra?: Record<string, unknown>;
  }) =>
    api<{ id: number; kind: string; payload: Record<string, unknown> }>(
      '/api/sandbox/twitch-event/',
      { method: 'POST', body },
    ),
  sandboxDonation: (body: {
    donor_name?: string;
    amount?: string;
    message?: string;
    muted?: boolean;
  }) =>
    api<{ id: number; donor_name: string; amount: string; message: string }>(
      '/api/sandbox/donation/',
      { method: 'POST', body },
    ),
  updateEvent: (
    eventId: number,
    patch: Partial<Pick<EventModel,
      'name' | 'start_time' | 'currency_symbol' | 'logo_url' | 'banner_url'
      | 'gameblast_logo_url'
    >> & { omnibar_layout?: Record<string, unknown> },
  ) =>
    api<EventModel>(`/api/events/${eventId}/`, {
      method: 'PATCH',
      body: patch,
    }).then(withEventBroadcast),
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
    /** Reserved for bid wars (options array) and future extensions. */
    payload?: Record<string, unknown>;
  }) => api<Incentive>('/api/incentives/', { method: 'POST', body }),
  contributeToIncentive: (id: number, amount: string, optionId?: string) =>
    api<IncentiveContributeResult>(
      `/api/incentives/${id}/contribute/`,
      { method: 'POST', body: optionId ? { amount, option: optionId } : { amount } },
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

  // Charity-cluster slides — rotated in the right side of the omnibar.
  // Single global list (no event scope) since the charity story
  // doesn't change between events.
  charitySlides: (params?: { activeOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.activeOnly) qs.set('active', 'true');
    const tail = qs.toString();
    return api<CharitySlide[]>(tail ? `/api/charity-slides/?${tail}` : '/api/charity-slides/');
  },
  createCharitySlide: (body: {
    kind: CharitySlideKind;
    title?: string;
    body?: string;
    image_url?: string;
    alt_text?: string;
    order?: number;
    is_active?: boolean;
  }) =>
    api<CharitySlide>('/api/charity-slides/', { method: 'POST', body })
      .then(withCharityBroadcast),
  updateCharitySlide: (
    id: number,
    patch: Partial<Omit<CharitySlide, 'id' | 'created_at' | 'updated_at'>>,
  ) =>
    api<CharitySlide>(`/api/charity-slides/${id}/`, {
      method: 'PATCH',
      body: patch,
    }).then(withCharityBroadcast),
  deleteCharitySlide: (id: number) =>
    api<void>(`/api/charity-slides/${id}/`, { method: 'DELETE' })
      .then(withCharityBroadcast),
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
