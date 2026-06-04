/**
 * Thin wrapper around the Django REST API for the OBS browser sources and
 * the control panel. Both poll-based (sources) and write-based (control)
 * callers use this.
 */
import { api } from '@/lib/api';
import { notifyCharitySlidesChanged } from '@/lib/charityBus';
import { notifyEventChanged } from '@/lib/eventBus';
import { notifyRafflesChanged } from '@/lib/raffleBus';
import { notifyItemsChanged } from '@/lib/itemsBus';
import { notifyObjectivesChanged } from '@/lib/objectiveBus';
import { notifyThemeChanged } from '@/lib/themeBus';
import { notifyLayoutChanged } from '@/lib/layoutBus';

/** Pass-through `.then()` callback that fires a theme-changed broadcast
 *  and returns the response unchanged. Use on any mutation that can
 *  affect what /api/theme/ returns so other tabs re-fetch instantly. */
function withThemeBroadcast<T>(value: T): T {
  notifyThemeChanged();
  return value;
}

/** Same pattern but for LayoutPreset mutations. Activating/editing a preset
 *  bumps any open /obs/full so a live capture-position swap lands in roughly
 *  one render frame instead of waiting on the 2s poll. */
function withLayoutBroadcast<T>(value: T): T {
  notifyLayoutChanged();
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

/** Same pattern but for Raffle mutations. The public /incentives page
 *  bumps its raffle poll the moment this fires, so opening/closing a
 *  raffle in /control/raffles updates the card (Enter-now gating + LIVE
 *  badge) in one render frame instead of waiting on the poll. */
function withRaffleBroadcast<T>(value: T): T {
  notifyRafflesChanged();
  return value;
}

/** As above, for GameItem definition mutations on /control/items — bumps
 *  the omnibar's currently-playing poll so a newly-added item lands on the
 *  ITEMS card in roughly one render frame. */
function withItemsBroadcast<T>(value: T): T {
  notifyItemsChanged();
  return value;
}

/** As above, for GameObjective definition + per-run status mutations on
 *  /control/omnibar#objective — bumps the omnibar's currently-playing poll so
 *  the objective checklist + pickup celebration react in ~one render frame. */
function withObjectivesBroadcast<T>(value: T): T {
  notifyObjectivesChanged();
  return value;
}

export type LayoutKey = '16x9' | '4x3' | '3ds' | 'ds-top' | 'ds-both' | 'fsa-split';

/** A named arrangement for one OBS game-layout aspect ratio. The control panel
 *  manages a library of these per layout type, with exactly one `is_active`
 *  per type (scoped activation, Theme-style). /obs/full renders the active
 *  preset for the currently-playing game's layout_type. `config` is parsed +
 *  clamped by `useLayoutPresetConfig` — see that module for the shape. */
export interface LayoutPreset {
  id: number;
  name: string;
  layout_type: LayoutKey;
  /** Human-readable aspect-ratio label (e.g. "4:3 standard"). */
  layout_type_display: string;
  is_active: boolean;
  /** Opaque to the API layer; shaped + validated by useLayoutPresetConfig. */
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/** Global OBS-layout settings (singleton): the capture-alignment guide toggle
 *  and the manual /obs/full layout-type override. `forced_layout_type` is empty
 *  for "auto" (follow the playing game) or a LayoutKey to force that aspect
 *  ratio regardless of what's playing. */
export interface LayoutGuideSettings {
  show_guide: boolean;
  forced_layout_type: LayoutKey | '';
  updated_at: string;
}

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
  /** Ordered list of item GROUP labels (the /control/items section headers).
   *  Drives section order on the control grid + the /obs items overlay; labels
   *  not listed fall back to first-appearance order after the listed ones. */
  item_group_order: string[];
  items: GameItem[];
  objectives: GameObjective[];
  /** Per-game item-set library (families like "Medallions", "Magic Items"). */
  item_sets: GameItemSet[];
}

/** How a set's members relate. Ordered kinds sequence by `order`. */
export type ItemSetKind = 'upgrade' | 'trade' | 'set';

/** A named family/cluster of items within a game. Items belong to zero or
 *  more sets via `GameItem.set_ids`, so e.g. a medallion can sit in both
 *  "Medallions" and "Magic Items". Rendered as one cluster per set. */
export interface GameItemSet {
  id: number;
  game: number;
  name: string;
  kind: ItemSetKind;
  order: number;
  /** When false, the set (and items whose only sets are hidden) is omitted from
   *  the /obs/full items element — e.g. bottle contents. Defaults true. */
  show_in_overlay: boolean;
}

export interface GameItem {
  id: number;
  game: number;
  name: string;
  image_url: string;
  category: string;
  /** Optional section label used to cluster items on the control grid
   *  (e.g. "Equipment", "Dungeon Items"). Falls back to category when blank. */
  group: string;
  /** Sets this item belongs to (GameItemSet ids). An item can be in several
   *  — it renders in each set's cluster. */
  set_ids: number[];
  /** When true, tracked as an up/down tally (keys, maps...) rather than a
   *  single collected toggle. */
  countable: boolean;
  /** Items collected at the same time as this one (e.g. Bow + Quiver).
   *  Symmetric — collecting/clearing any member cascades to the rest. */
  unlocks_with_ids: number[];
  /** Player begins the game holding this item; re-applied by "Reset to start". */
  starts_collected: boolean;
  order: number;
}

/** One entry in a game's objective library (separate from collectible
 *  GameItems). Marked obtained/skipped per playthrough — see
 *  `ScheduleEntry.obtained_objective_ids` / `skipped_objective_ids`. */
export interface GameObjective {
  id: number;
  game: number;
  name: string;
  image_url: string;
  category: string;
  /** Optional run-section label used to cluster objectives in the library
   *  editor and the timer splits (e.g. "Prologue", "Endgame"). Falls back to
   *  category when blank. */
  group: string;
  /** For "item get" objectives: the GameItem id whose collection completes
   *  this objective (kept in lockstep with the item's per-run collected
   *  state). Null when the objective isn't tied to an item. */
  linked_item: number | null;
  order: number;
  /** How a linked dungeon item resolves when collected while a dungeon is
   *  active: 'single' = obtained once; 'tally' = a per-dungeon count (small
   *  keys). Only meaningful for items linked by more than one objective. */
  link_mode: 'single' | 'tally';
  /** Role this objective plays in driving an omnibar setpiece (see
   *  recompute_setpieces on the backend). */
  setpiece_role: SetpieceRole;
  /** Display name + linkage key of the setpiece this objective drives. */
  setpiece_name: string;
  /** Name of a setpiece this objective marks cleared when obtained. */
  clears_setpiece: string;
}

export type SetpieceRole = '' | 'dungeon-enter' | 'boss-enter' | 'boss-defeat';

/** A live setpiece on a ScheduleEntry. Many can be active at once; the omnibar
 *  surfaces only the highest-priority one (see topSetpiece). */
export interface Setpiece {
  id: number;
  kind: string;
  name: string;
  stage: 'imminent' | 'active';
  priority: number;
  is_auto: boolean;
  started_at: string | null;
}

/** Pick the single setpiece to surface on the omnibar: highest priority, then
 *  active over imminent, then most recently started. Returns null when none. */
export function topSetpiece(setpieces: Setpiece[] | null | undefined): Setpiece | null {
  if (!setpieces || setpieces.length === 0) return null;
  const score = (s: Setpiece): [number, number, number] => [
    s.priority,
    s.stage === 'active' ? 1 : 0,
    s.started_at ? new Date(s.started_at).getTime() : 0,
  ];
  return setpieces.reduce((best, cur) => {
    const b = score(best);
    const c = score(cur);
    for (let i = 0; i < b.length; i++) {
      if (c[i] !== b[i]) return c[i] > b[i] ? cur : best;
    }
    return best;
  });
}

/** Per-run status of a game objective. Absence from both id-lists on the
 *  ScheduleEntry = outstanding (the default). */
export type ObjectiveStatus = 'outstanding' | 'obtained' | 'skipped';

/** One bundled item sprite available for a game, surfaced by the
 *  /api/games/{id}/item_assets/ picker endpoint. */
export interface GameItemAsset {
  filename: string;
  url: string;
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
  /** Platform logo (site-relative path or absolute URL), denormalised from
   *  the DonationPlatformProfile. Empty → the picker falls back to the
   *  built-in per-platform icon in `platforms.tsx`. */
  logo_url: string;
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

export interface EventTwitchChannel {
  id: number;
  event: number;
  login: string;
  display_name: string;
  /** The main stream channel — leads the homepage embed. One per event. */
  is_primary: boolean;
  /** Poll / EventSub this channel for Twitch Charity donations. */
  track_charity: boolean;
  /** Optional Twitch Charity campaign slug (e.g. "msec-gameblast26"). */
  charity_slug: string;
  order: number;
  is_active: boolean;
  /** Whether an OAuth token has been connected for this channel. */
  is_connected: boolean;
  /** Granted OAuth scopes on the linked connection (read-only). */
  connection_scopes: string[];
}

export interface ChatAnnouncement {
  id: number;
  event: number;
  trigger: string;
  /** Human label for the trigger (e.g. "Donation received"). */
  trigger_display: string;
  enabled: boolean;
  template: string;
  /** Post as a highlighted Twitch /announce instead of a normal message. */
  as_announcement: boolean;
  /** Highlight colour when posted as an announcement. */
  announcement_color: string;
  /** Placeholder fields this trigger's template supports (editor hints). */
  placeholders: string[];
}

export interface TwitchPredictionOutcome {
  id: string;
  title: string;
  color?: string;
  users?: number;
  channel_points?: number;
}

export interface TwitchPrediction {
  id: number;
  event: number;
  prediction_id: string;
  title: string;
  /** ACTIVE | LOCKED | RESOLVED | CANCELED */
  status: string;
  outcomes: TwitchPredictionOutcome[];
  winning_outcome_id: string;
  window_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface ShoutoutConfig {
  id: number;
  event: number;
  enabled: boolean;
  shout_donations: boolean;
  shout_raids: boolean;
  min_donation_amount: string;
  only_when_live: boolean;
  global_cooldown_seconds: number;
  target_cooldown_seconds: number;
  max_age_minutes: number;
}

export interface ShoutoutRequest {
  id: number;
  event: number;
  target_login: string;
  target_display: string;
  reason: string;
  reason_display: string;
  note: string;
  status: string;
  status_display: string;
  requested_at: string;
  sent_at: string | null;
  detail: string;
}

export interface RewardAction {
  id: number;
  mapping: number;
  action_type: string;
  action_type_display: string;
  params: Record<string, unknown>;
  enabled: boolean;
  order: number;
}

export interface RewardMapping {
  id: number;
  event: number;
  reward_id: string;
  reward_title: string;
  enabled: boolean;
  order: number;
  actions: RewardAction[];
}

export interface CustomReward {
  id: string;
  title: string;
  cost: number;
}

export interface ScheduledJob {
  id: number;
  key: string;
  label: string;
  command: string;
  description: string;
  enabled: boolean;
  interval_seconds: number;
  last_run_at: string | null;
  last_status: string;
  last_output: string;
  is_due: boolean;
  updated_at: string;
}

export interface EventSubSubscription {
  id: string;
  type: string;
  version: string;
  status: string;
  condition: Record<string, unknown>;
  callback: string;
}

export interface RecurringChatMessage {
  id: number;
  event: number;
  label: string;
  template: string;
  interval_minutes: number;
  only_when_live: boolean;
  enabled: boolean;
  last_posted_at: string | null;
  order: number;
  is_due: boolean;
  placeholders: string[];
}

export interface EventModel {
  id: number;
  name: string;
  start_time: string;
  currency_symbol: string;
  is_active: boolean;
  /** Twitch channels for this event — each drives live status; those with
   *  track_charity + a connection are charity sources. Managed in
   *  /control/events; written via /api/event-twitch-channels/. */
  twitch_channels: EventTwitchChannel[];
  /** The primary channel's login (the bit after twitch.tv/) for the
   *  embedded stream, chat, and Follow buttons. '' when no channels. */
  primary_twitch_channel: string;
  /** On game change, set the primary channel's Twitch category to the game. */
  update_twitch_category: boolean;
  /** Optional title template applied on game change ({game}, {event}). */
  twitch_title_template: string;
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
  /** Per-panel rotation transition config (enter/exit direction +
   *  durations + delay-before-enter). Empty object → fall back to the
   *  defaults in `omnibar/hooks/useTransitionsConfig.ts`. Shape:
   *  { default: { enter, exit, enterMs, exitMs, delayMs },
   *    panels: { "<panel-id>": { ...overrides } } }. */
  omnibar_transitions: Record<string, unknown>;
  donation_pages: DonationPage[];
  /** Per-trigger Twitch chat announcement config (enable + template).
   *  Read-only here; written via /api/chat-announcements/. */
  chat_announcements: ChatAnnouncement[];
  /** Recurring chat messages (e.g. a periodic donation CTA). Read-only here;
   *  written via /api/recurring-chat-messages/. */
  recurring_chat_messages: RecurringChatMessage[];
  /** Charities this event is fundraising for, ordered + with the
   *  primary beneficiary flagged. Read-only on the EventModel —
   *  mutations go through `obsApi.createEventCharity` /
   *  `updateEventCharity` / `deleteEventCharity`. */
  event_charities: EventCharityLink[];
}

/** Donation options for an event's public donate UI: the stored donation_pages
 *  (JustGiving / Tiltify / …) plus a synthesized Twitch Charity link per
 *  charity-tracking channel — Twitch channels replaced the manual twitch
 *  donation pages, but viewers still need a donate link per channel. */
export function eventDonationOptions(
  event: EventModel | null | undefined,
): DonationPage[] {
  if (!event) return [];
  const twitchRows: DonationPage[] = (event.twitch_channels ?? [])
    .filter((c) => c.track_charity && c.is_active && c.login)
    .map((c) => ({
      id: -c.id, // negative so it never collides with a real page id (React key)
      event: event.id,
      platform: 'twitch' as DonationPlatformKey,
      display_label: 'Twitch Charity',
      logo_url: '',
      label: c.display_name || c.login,
      url: `https://www.twitch.tv/charity/${c.login}`,
      external_id: c.charity_slug,
      is_primary: false,
      order: 100 + c.order,
      fees_url: '',
      gift_aid_url: '',
      fee_warning: '',
      minimum_donation_amount: '0',
    }));
  return [...event.donation_pages, ...twitchRows];
}

export interface TimerRun {
  id: number;
  schedule_entry: number;
  started_at: string | null;
  paused_at: string | null;
  accumulated_seconds: number;
  /** Banked milliseconds excluding the live segment — source of truth for the
   *  centisecond display (accumulated_seconds is the whole-second derivative). */
  accumulated_ms: number;
  ended_at: string | null;
  is_running: boolean;
  /** Started at least once and currently paused (segment banked, clock held).
   *  Mutually exclusive with is_running. */
  is_paused: boolean;
  total_seconds: number;
  total_ms: number;
}

export type SlotType = 'game' | 'start' | 'meal' | 'sleep' | 'break' | 'end' | 'other';

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
  /** Player deaths this game, bumped from the Stream Deck (timer-hotkey
   *  death-inc/death-dec). The omnibar death-count panel sums it across the
   *  event's entries for a running total. */
  death_count: number;
  /** Live setpieces, highest priority first (server-ordered). Many can be
   *  active at once; the omnibar surfaces only topSetpiece(...). */
  setpieces: Setpiece[];
  notes: string;
  /** Ordered GameObjective ids forming this run's LiveSplit route (the timer
   *  splits). Empty = the timer falls back to all of the game's objectives in
   *  their library order. */
  timer_segment_ids: number[];
  timer: TimerRun | null;
  collected_item_ids: number[];
  /** {game_item_id: quantity} for collected items — the tally for countable
   *  items (keys, maps...). Keyed by stringified id (JSON object keys). */
  collected_item_counts: Record<string, number>;
  /** GameObjective ids marked obtained / skipped this run. Anything in the
   *  game's objective library but in neither list is outstanding. */
  obtained_objective_ids: number[];
  skipped_objective_ids: number[];
  /** {objective_id: cumulative run ms at split} for obtained objectives that
   *  have a stamped split time — the timer page renders these frozen splits. */
  objective_split_ms: Record<string, number>;
  /** {objective_id: count} for link_mode=tally objectives with a per-dungeon
   *  tally (e.g. small keys). Absent/zero means none collected. */
  objective_counts: Record<string, number>;
  /** Read-only nested. The omnibar feed doesn't act on these (the
   *  backend SSE evaluator fires triggers server-side); the control
   *  panel reads them to render the per-entry editor. */
  sound_triggers: ScheduleEntrySoundTrigger[];
}

/** Reusable audio asset row, from `/api/sound-assets/`. Many trigger
 *  rows can reference the same asset (e.g., a single bell sound wired
 *  to multiple -30/-20/-10s offsets). */
export interface SoundAsset {
  id: number;
  name: string;
  url: string;
  volume: number;
  created_at: string;
}

export type TriggerAnchor = 'start' | 'end';

/** One trigger row attached to a ScheduleEntry. `sound_detail` is
 *  the nested SoundAsset embedded by the backend so consumers don't
 *  need a second fetch. `last_fired_at` is server-managed; the SSE
 *  evaluator stamps it when the trigger fires. */
export interface ScheduleEntrySoundTrigger {
  id: number;
  schedule_entry: number;
  sound: number;
  sound_detail: SoundAsset;
  anchor: TriggerAnchor;
  /** Signed seconds — negative = before anchor, 0 = at, positive = after. */
  offset_seconds: number;
  /** Banner tag pill label. Blank → omnibar uses "NOW PLAYING". */
  tag: string;
  message: string;
  /** Optional smaller text shown under the headline on the celebration
   *  banner. Ignored when `show_banner` is false. */
  subhead: string;
  priority: number;
  duration_seconds: number;
  /** When false, the audio plays but no celebration banner is shown. */
  show_banner: boolean;
  is_active: boolean;
  last_fired_at: string | null;
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
  /** Direction of the page background gradient in degrees (--theme-bg-angle). */
  background_gradient_angle: number;
  /** Top stop of the navbar overlay gradient (--theme-navbar-tint). */
  navbar_tint_color: string;
  text_color: string;
  text_muted: string;
  line_color: string;
  logo_url: string;
  logo_small_url: string;
  /** Wordmark shown specifically inside the omnibar brand pill —
   *  lets the broadcast layer carry a different mark from the site
   *  hero. Blank falls back to logo_url. */
  omnibar_logo_url: string;
  favicon_url: string;
  background_video_url: string;
  background_image_url: string;
  button_gradient_from: string;
  button_gradient_to: string;
  /** Direction of the primary button gradient in degrees (--theme-button-angle). */
  button_gradient_angle: number;
  button_text_color: string;
  button_border_color: string;
  divider_thickness: number;
  image_hue_rotate: number;
  link_color: string;
  link_hover_color: string;
  /** Multi-colour accents — empty strings fall back at apply-time:
   *  accent_1 → primary_bright, accent_2 → primary, accent_3 → secondary. */
  accent_1: string;
  accent_2: string;
  accent_3: string;
  /** Card/panel surface — solid fill for cards on bright themes. Empty
   *  surface_text_color / surface_border_color fall back to text_color
   *  / line_color at apply-time. */
  surface_color: string;
  surface_text_color: string;
  surface_border_color: string;
  /** Omnibar-specific overrides. Empty values let the existing
   *  --obs-accent (per-game) / steel-gradient defaults keep driving. */
  omnibar_lane_bg: string;
  /** [Deprecated] Single tag colour — kept as the fallback default
   *  for the per-section gradient fields below when those are blank. */
  omnibar_tag_color: string;
  omnibar_ticker_accent: string;
  /** Per-section gradient stops (from = top stop, to = bottom stop,
   *  rendered with a 180° angle). Each section falls back to
   *  omnibar_tag_color → --obs-accent when its pair is blank, so a
   *  theme can opt in incrementally. */
  omnibar_brand_from: string;
  omnibar_brand_to: string;
  omnibar_brand_text: string;
  omnibar_top_tag_from: string;
  omnibar_top_tag_to: string;
  omnibar_top_tag_text: string;
  /** Text colour for the top-lane body content (panel text rendered
   *  to the right of the tag pill). Distinct from the tag pill text
   *  because the body sits on the lane background, not the gradient. */
  omnibar_top_lane_text: string;
  omnibar_bottom_tag_from: string;
  omnibar_bottom_tag_to: string;
  omnibar_bottom_tag_text: string;
  omnibar_bottom_lane_text: string;
  omnibar_total_from: string;
  omnibar_total_to: string;
  omnibar_total_text: string;
  /** Default colours for the full-bar celebration takeover banner.
   *  Individual triggers can override per-fire via the payload
   *  (payload.tag_color / heading_color / sub_color). Blanks fall
   *  back to the baked-in gold-flash mood. */
  /** Deprecated single-colour fallback for the celebration tag pill.
   *  Used only when both gradient stops below are blank. */
  omnibar_celebration_tag: string;
  /** Celebration tag pill gradient stops (top → bottom, 180°). Blank
   *  falls back through omnibar_celebration_tag → brand mesh. */
  omnibar_celebration_tag_from: string;
  omnibar_celebration_tag_to: string;
  omnibar_celebration_heading: string;
  omnibar_celebration_sub: string;
  omnibar_celebration_flash: string;
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
  /** Overall scene size as a multiplier of the container-derived
   *  default. 1.0 is the legacy size; drop it for tall OBS sources
   *  (e.g. a full 1920x1080 browser source) where the default hero is
   *  huge. Clamped to 0.25–2.0 by the overlay + control page. */
  scale: number;
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

/** Canvas visualiser styles for /obs/audio-countdown. 'auto' rotates per track. */
export type VisualiserStyle =
  | 'bars'
  | 'mirror'
  | 'waveform'
  | 'radial'
  | 'wave'
  | 'auto';

export interface NowPlayingAudio {
  track_id: number | null;
  track: AudioTrack | null;
  is_pinned: boolean;
  is_paused: boolean;
  visualiser_style: VisualiserStyle;
  updated_at: string;
}

export interface NowPlayingAudioPatch {
  track_id?: number | null;
  is_pinned?: boolean;
  is_paused?: boolean;
  visualiser_style?: VisualiserStyle;
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

// ── Logs & Queue ──────────────────────────────────────────────────────────
export type ActivityCategory =
  | 'operator-action'
  | 'event-trigger'
  | 'sound-trigger'
  | 'webhook'
  | 'external-event'
  | 'system';
export type ActivityLevel = 'info' | 'warning' | 'error';

export interface ActivityLogEntry {
  id: number;
  created_at: string;
  category: ActivityCategory;
  action: string;
  level: ActivityLevel;
  summary: string;
  source: string;
  target_type: string;
  target_id: string;
  detail: Record<string, unknown>;
  request_method: string;
  request_path: string;
  status_code: number | null;
}

export interface ActivityLogFilters {
  category?: ActivityCategory | '';
  level?: ActivityLevel | '';
  source?: string;
  search?: string;
  limit?: number;
}

/** A management action the operator can take on a queued item — rendered as a
 *  button that POSTs to `endpoint`. */
export interface QueueAction {
  label: string;
  method: string;
  endpoint: string;
}

export type QueueLane = 'awaiting' | 'processing' | 'failed';

export interface QueueItem {
  id: string;
  lane: QueueLane;
  kind: string;
  source: string;
  label: string;
  occurred_at: string | null;
  eta: string | null;
  actions: QueueAction[];
  /** Plain-English "what now?" guidance — currently set on failed items. */
  hint?: string;
}

export interface QueueSnapshot {
  generated_at: string;
  awaiting: QueueItem[];
  processing: QueueItem[];
  failed: QueueItem[];
  counts: { awaiting: number; processing: number; failed: number };
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
  /** Optional celebration colour overrides — passed through to the
   *  omnibar CelebrationBanner when the milestone is reached. Empty
   *  strings fall back to the active theme's omnibar_celebration_*
   *  defaults, and then to the baked-in gold-flash mood. */
  tag_color_from: string;
  tag_color_to: string;
  heading_color: string;
  sub_color: string;
  flash_color: string;
  order: number;
  is_reached: boolean;
  created_at: string;
}

// ── Raffles ──────────────────────────────────────────────────────────────
//
// A raffle is a winnable prize plus the window during which donors are
// entered. Entrants aren't stored — they're derived from donations in the
// window, and draw odds are weighted by amount. Winner contact details
// (PII) live on RaffleWinner and are served only via /api/raffle-winners/.

export type RaffleDeliveryMethodKey =
  | 'physical' | 'email' | 'twitch' | 'discord' | 'code' | 'other';
export type RaffleConditionTypeKey =
  | 'manual' | 'whole_event' | 'schedule_entry' | 'date_range';
export type RaffleStatusKey = 'draft' | 'open' | 'closed' | 'drawn';
export type RaffleFulfillmentKey =
  | 'pending' | 'contacted' | 'sent' | 'delivered' | 'forfeited';

export interface Raffle {
  id: number;
  event: number;
  name: string;
  description: string;
  image_url: string;
  delivery_method: RaffleDeliveryMethodKey;
  quantity: number;
  min_amount: string;
  condition_type: RaffleConditionTypeKey;
  schedule_entry: number | null;
  window_start: string | null;
  window_end: string | null;
  status: RaffleStatusKey;
  opened_at: string | null;
  closed_at: string | null;
  is_active: boolean;
  order: number;
  payload: Record<string, unknown>;
  /** Derived read-only stats from the backend. */
  entrant_count: number;
  total_weight: string;
  is_open: boolean;
  winner_names: string[];
  created_at: string;
  updated_at: string;
}

/** Winner + fulfillment record. Carries PII (contact_info) — only fetched
 *  in the control panel, never on the public page. */
export interface RaffleWinner {
  id: number;
  raffle: number;
  donation: number | null;
  donor_name: string;
  drawn_at: string;
  contact_info: string;
  delivery_code: string;
  fulfillment_status: RaffleFulfillmentKey;
  notes: string;
}

/** `draw` returns the raffle plus the winners drawn in this call. */
export interface RaffleDrawResult extends Raffle {
  drawn: RaffleWinner[];
}

// ── Charities ────────────────────────────────────────────────────────────
//
// A charity is the beneficiary of one or more events. The main row
// (`Charity`) carries identity + branding + CTA copy; four child
// types — websites, videos, images, impact tiers — are returned
// nested on reads but mutated through their own endpoints so the
// control panel can save a single row at a time.

export interface CharityWebsite {
  id: number;
  charity: number;
  label: string;
  url: string;
  order: number;
}

/** Closed enum mirroring backend `SocialPlatform.choices`. Keep in
 *  sync with `SOCIAL_PLATFORM_LABELS` in CharitiesControl when adding
 *  a new platform on the backend. */
export type SocialPlatformKey =
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'linkedin'
  | 'bluesky'
  | 'threads'
  | 'mastodon'
  | 'twitch'
  | 'discord'
  | 'reddit'
  | 'patreon'
  | 'other';

export interface CharitySocialLink {
  id: number;
  charity: number;
  platform: SocialPlatformKey;
  /** Server-side display label for the platform (e.g. "X / Twitter"). */
  platform_label: string;
  url: string;
  /** Optional human handle (e.g. "@specialeffect"). */
  handle: string;
  order: number;
}

export interface CharityVideo {
  id: number;
  charity: number;
  title: string;
  url: string;
  thumbnail_url: string;
  description: string;
  order: number;
}

export interface CharityImage {
  id: number;
  charity: number;
  image_url: string;
  alt_text: string;
  caption: string;
  order: number;
}

export interface CharityImpactTier {
  id: number;
  charity: number;
  amount: string;
  currency: string;
  image_url: string;
  alt_text: string;
  /** Plain-text fallback — always populated. */
  description: string;
  /** Optional HTML override; rendered via dangerouslySetInnerHTML
   *  when non-empty so a tier can embed inline links. */
  description_html: string;
  order: number;
}

export interface Charity {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  charity_number: string;
  mission_statement: string;
  /** One-line condensed mission for tight spaces (the omnibar charity
   *  ticker). Falls back to mission_statement when blank. */
  mission_tagline: string;
  logo_url: string;
  /** Tight-crop variant of the square logo for compact UI. Consumers
   *  should fall back to `logo_url` when this is empty. */
  logo_thumbnail_url: string;
  banner_url: string;
  primary_website_url: string;
  help_cta_headline: string;
  help_cta_body: string;
  help_cta_url: string;
  donate_cta_headline: string;
  donate_cta_body: string;
  donate_cta_url: string;
  /** Subset of DonationPlatformKey the charity can accept funds via. */
  supported_platforms: DonationPlatformKey[];
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
  websites: CharityWebsite[];
  social_links: CharitySocialLink[];
  videos: CharityVideo[];
  images: CharityImage[];
  impact_tiers: CharityImpactTier[];
}

export interface EventCharityLink {
  id: number;
  event: number;
  charity: number;
  /** Full charity payload embedded so consumers can render branding
   *  without a second fetch. */
  charity_detail: Charity;
  is_primary: boolean;
  order: number;
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
  /** The authenticated user's local profile (identity + role). 401 when not
   *  signed in. Drives control-panel access — see useMe / ControlLayout.
   *  Pass the Clerk token explicitly to avoid a race with the ambient getter. */
  me: (token?: string | null) =>
    api<{ clerk_user_id: string; email: string; role: 'viewer' | 'operator' }>(
      '/api/me/',
      token === undefined ? undefined : { token },
    ),
  // Reads
  games: () => api<Game[]>('/api/games/'),
  game: (id: number) => api<Game>(`/api/games/${id}/`),
  events: () => api<EventModel[]>('/api/events/'),
  activeEvent: () => api<EventModel | null>('/api/events/active/'),
  /** Schedule entries for an event. `compact` returns the light list shape
   *  (no nested game items/objectives, no per-run collectible data) — much
   *  smaller/faster, for list views like the public /schedule and up-next. */
  schedule: (eventId?: number, opts?: { compact?: boolean }) => {
    const qs = new URLSearchParams();
    if (eventId) qs.set('event', String(eventId));
    if (opts?.compact) qs.set('compact', '1');
    const tail = qs.toString();
    return api<ScheduleEntry[]>(`/api/schedule/${tail ? `?${tail}` : ''}`);
  },
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
  /** Twitch live-status probe. Returns is_live=true when the named
   *  channel is currently streaming, with optional metadata (game,
   *  title, viewer count, started_at). Omit `login` to fall back to
   *  the active event's configured channel server-side. */
  twitchStreamStatus: (login?: string) => {
    const qs = login ? `?login=${encodeURIComponent(login)}` : '';
    return api<{
      login: string;
      is_live: boolean;
      /** Twitch display name with the broadcaster's preferred casing
       *  (e.g. "MSec"). Empty when offline. */
      user_name?: string;
      started_at?: string;
      game_name?: string;
      title?: string;
      viewer_count?: number;
      error?: string;
    }>(`/api/twitch/stream-status/${qs}`);
  },
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

  // OBS layout presets — library managed in /control/layouts, consumed live by
  // /obs/full. Mutations broadcast via layoutBus so an open browser source
  // re-fetches the moment a preset is activated/edited. Pass `?layout_type` to
  // narrow the list to one aspect ratio for the editor.
  layoutPresets: (layoutType?: LayoutKey) =>
    api<LayoutPreset[]>(
      layoutType ? `/api/layout-presets/?layout_type=${layoutType}` : '/api/layout-presets/',
    ),
  // Capture alignment guide (global singleton). The OBS layout pages poll the
  // GET; /control/layouts flips it via PATCH. Broadcast on the layoutBus so a
  // /control + /obs pair in the SAME browser updates instantly; the OBS browser
  // source (separate context) catches it on its next poll.
  layoutGuide: () => api<LayoutGuideSettings>('/api/layout-guide/'),
  setLayoutGuide: (show: boolean) =>
    api<LayoutGuideSettings>('/api/layout-guide/', {
      method: 'PATCH',
      body: { show_guide: show },
    }).then(withLayoutBroadcast),
  // Manual /obs/full layout-type override. Pass a LayoutKey to force that aspect
  // ratio, or '' to return to auto (follow the playing game). Shares the
  // layout-guide singleton + layoutBus so an open OBS source reflects it fast.
  setForcedLayoutType: (layoutType: LayoutKey | '') =>
    api<LayoutGuideSettings>('/api/layout-guide/', {
      method: 'PATCH',
      body: { forced_layout_type: layoutType },
    }).then(withLayoutBroadcast),
  createLayoutPreset: (body: {
    name: string;
    layout_type: LayoutKey;
    config?: Record<string, unknown>;
    is_active?: boolean;
  }) =>
    api<LayoutPreset>('/api/layout-presets/', { method: 'POST', body }).then(
      withLayoutBroadcast,
    ),
  updateLayoutPreset: (
    id: number,
    patch: Partial<Pick<LayoutPreset, 'name' | 'config' | 'is_active'>>,
  ) =>
    api<LayoutPreset>(`/api/layout-presets/${id}/`, { method: 'PATCH', body: patch }).then(
      withLayoutBroadcast,
    ),
  deleteLayoutPreset: (id: number) =>
    api<void>(`/api/layout-presets/${id}/`, { method: 'DELETE' }).then(withLayoutBroadcast),
  activateLayoutPreset: (id: number) =>
    api<LayoutPreset>(`/api/layout-presets/${id}/activate/`, { method: 'POST' }).then(
      withLayoutBroadcast,
    ),
  duplicateLayoutPreset: (id: number) =>
    api<LayoutPreset>(`/api/layout-presets/${id}/duplicate/`, { method: 'POST' }).then(
      withLayoutBroadcast,
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
  // Dev-only: rewrites the zelda franchise module to drop the import + scenes[]
  // entry and deletes the scene's .tsx file. Backend returns 403 outside DEBUG.
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
  reopenTimer: (entryId: number) =>
    api<TimerRun>(`/api/schedule/${entryId}/reopen_timer/`, { method: 'POST' }),
  toggleCollected: (entryId: number, itemId: number) =>
    api<{ collected: boolean }>(
      `/api/schedule/${entryId}/toggle_collected/`,
      { method: 'POST', body: { item_id: itemId } },
    ),
  adjustCollected: (entryId: number, itemId: number, delta: number) =>
    api<{ collected: boolean; quantity: number }>(
      `/api/schedule/${entryId}/adjust_collected/`,
      { method: 'POST', body: { item_id: itemId, delta } },
    ),
  resetCollected: (entryId: number) =>
    api<{ collected_item_ids: number[] }>(
      `/api/schedule/${entryId}/reset_collected/`,
      { method: 'POST' },
    ),

  // Item definitions (the per-game checklist). Mutations broadcast via
  // itemsBus so the omnibar's ITEMS card refreshes without a manual reload.
  itemAssets: (gameId: number) =>
    api<{ slug: string; images: GameItemAsset[] }>(`/api/games/${gameId}/item_assets/`),
  createGameItem: (body: {
    game: number;
    name: string;
    image_url?: string;
    category?: string;
    group?: string;
    set_ids?: number[];
    unlocks_with_ids?: number[];
    countable?: boolean;
    starts_collected?: boolean;
    order?: number;
  }) =>
    api<GameItem>('/api/game-items/', { method: 'POST', body }).then(withItemsBroadcast),
  updateGameItem: (
    id: number,
    patch: Partial<
      Pick<
        GameItem,
        'name' | 'image_url' | 'category' | 'group' | 'set_ids' | 'unlocks_with_ids' | 'countable' | 'starts_collected' | 'order'
      >
    >,
  ) =>
    api<GameItem>(`/api/game-items/${id}/`, { method: 'PATCH', body: patch }).then(
      withItemsBroadcast,
    ),
  /** Patch a game-level field — currently used for `item_group_order` (the
   *  /control/items section order). Broadcasts via itemsBus so the overlay
   *  re-fetches. */
  updateGame: (id: number, patch: Partial<Pick<Game, 'item_group_order'>>) =>
    api<Game>(`/api/games/${id}/`, { method: 'PATCH', body: patch }).then(
      withItemsBroadcast,
    ),
  deleteGameItem: (id: number) =>
    api<void>(`/api/game-items/${id}/`, { method: 'DELETE' }).then(withItemsBroadcast),
  duplicateGameItem: (id: number) =>
    api<GameItem>(`/api/game-items/${id}/duplicate/`, { method: 'POST' }).then(
      withItemsBroadcast,
    ),

  // Item sets (per-game families like "Medallions"). Broadcast via itemsBus
  // so the control grid + omnibar react without a manual reload.
  createItemSet: (body: { game: number; name: string; kind?: ItemSetKind; order?: number }) =>
    api<GameItemSet>('/api/game-item-sets/', { method: 'POST', body }).then(withItemsBroadcast),
  updateItemSet: (
    id: number,
    patch: Partial<Pick<GameItemSet, 'name' | 'kind' | 'order' | 'show_in_overlay'>>,
  ) =>
    api<GameItemSet>(`/api/game-item-sets/${id}/`, { method: 'PATCH', body: patch }).then(
      withItemsBroadcast,
    ),
  deleteItemSet: (id: number) =>
    api<void>(`/api/game-item-sets/${id}/`, { method: 'DELETE' }).then(withItemsBroadcast),

  // Objectives: per-game library (definitions) + per-run status. Mutations
  // broadcast via objectiveBus so the omnibar's objective checklist + pickup
  // celebration react without waiting on the poll.
  objectiveAssets: (gameId: number) =>
    api<{ slug: string; images: GameItemAsset[] }>(
      `/api/games/${gameId}/objective_assets/`,
    ),
  createObjective: (body: {
    game: number;
    name: string;
    image_url?: string;
    category?: string;
    group?: string;
    linked_item?: number | null;
    order?: number;
    link_mode?: 'single' | 'tally';
    setpiece_role?: SetpieceRole;
    setpiece_name?: string;
    clears_setpiece?: string;
  }) =>
    api<GameObjective>('/api/game-objectives/', { method: 'POST', body }).then(
      withObjectivesBroadcast,
    ),
  updateObjective: (
    id: number,
    patch: Partial<
      Pick<GameObjective,
        'name' | 'image_url' | 'category' | 'group' | 'linked_item' | 'order'
        | 'link_mode' | 'setpiece_role' | 'setpiece_name' | 'clears_setpiece'
      >
    >,
  ) =>
    api<GameObjective>(`/api/game-objectives/${id}/`, { method: 'PATCH', body: patch }).then(
      withObjectivesBroadcast,
    ),
  deleteObjective: (id: number) =>
    api<void>(`/api/game-objectives/${id}/`, { method: 'DELETE' }).then(
      withObjectivesBroadcast,
    ),
  duplicateObjective: (id: number) =>
    api<GameObjective>(`/api/game-objectives/${id}/duplicate/`, { method: 'POST' }).then(
      withObjectivesBroadcast,
    ),
  setObjectiveStatus: (
    entryId: number,
    objectiveId: number,
    status: ObjectiveStatus,
    splitMs?: number,
  ) =>
    api<{ objective_id: number; status: ObjectiveStatus }>(
      `/api/schedule/${entryId}/set_objective_status/`,
      {
        method: 'POST',
        body: {
          objective_id: objectiveId,
          status,
          ...(splitMs != null ? { split_ms: Math.round(splitMs) } : {}),
        },
      },
    ).then(withObjectivesBroadcast),
  /** Adjust a link_mode=tally objective's per-dungeon count (e.g. small keys).
   *  delta is usually +1/-1; the row is removed when it hits 0. Optionally
   *  stamps the latest split. */
  adjustObjectiveCount: (
    entryId: number,
    objectiveId: number,
    delta: number,
    splitMs?: number,
  ) =>
    api<{ objective_id: number; count: number }>(
      `/api/schedule/${entryId}/set_objective_status/`,
      {
        method: 'POST',
        body: {
          objective_id: objectiveId,
          count_delta: delta,
          ...(splitMs != null ? { split_ms: Math.round(splitMs) } : {}),
        },
      },
    ).then(withObjectivesBroadcast),
  updateScheduleEntry: (
    entryId: number,
    patch: Partial<
      Pick<
        ScheduleEntry,
        'current_objective' | 'was_skipped' | 'notes' | 'is_completed' | 'timer_segment_ids'
      >
    >,
  ) =>
    api<ScheduleEntry>(`/api/schedule/${entryId}/`, {
      method: 'PATCH',
      body: patch,
    }),
  /** Create a bespoke operator setpiece. `name` is required server-side. */
  addSetpiece: (
    entryId: number,
    body: { kind: string; name: string; stage: 'imminent' | 'active'; priority?: number },
  ) =>
    api<ScheduleEntry>(`/api/schedule/${entryId}/add_setpiece/`, {
      method: 'POST',
      body,
    }),

  /** Flip a setpiece's stage and/or re-prioritise it (priority 1000 = pin to top). */
  updateSetpiece: (
    entryId: number,
    body: { setpiece_id: number; stage?: 'imminent' | 'active'; priority?: number },
  ) =>
    api<ScheduleEntry>(`/api/schedule/${entryId}/update_setpiece/`, {
      method: 'POST',
      body,
    }),

  /** Delete a setpiece; pass result_kind to fire a celebration event. */
  clearSetpiece: (
    entryId: number,
    body: { setpiece_id: number; result_kind?: string },
  ) =>
    api<ScheduleEntry>(`/api/schedule/${entryId}/clear_setpiece/`, {
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
      'name' | 'start_time' | 'currency_symbol'
      | 'logo_url' | 'banner_url' | 'gameblast_logo_url'
    >> & {
      omnibar_layout?: Record<string, unknown>;
      omnibar_transitions?: Record<string, unknown>;
    },
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
  updateOverride: (
    id: number,
    patch: Partial<{
      kind: string;
      payload: Record<string, unknown>;
      target_lane: OmnibarLane;
      starts_at: string;
      expires_at: string;
      priority: number;
      is_active: boolean;
    }>,
  ) => api<OmnibarOverride>(`/api/overrides/${id}/`, { method: 'PATCH', body: patch }),
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
  updateIncentive: (
    id: number,
    patch: Partial<{
      name: string;
      goal_amount: string;
      description: string;
      image_url: string;
      is_active: boolean;
      order: number;
    }>,
  ) => api<Incentive>(`/api/incentives/${id}/`, { method: 'PATCH', body: patch }),
  contributeToIncentive: (id: number, amount: string, optionId?: string) =>
    api<IncentiveContributeResult>(
      `/api/incentives/${id}/contribute/`,
      { method: 'POST', body: optionId ? { amount, option: optionId } : { amount } },
    ),
  // Reset an incentive back to £0 (also clears `reached_at` so the
  // celebration fires again next time, and zeros every bid-war
  // option's vote count). `is_active` is preserved.
  resetIncentive: (id: number) =>
    api<Incentive>(`/api/incentives/${id}/reset/`, { method: 'POST' }),
  deleteIncentive: (id: number) =>
    api<void>(`/api/incentives/${id}/`, { method: 'DELETE' }),

  // Raffles
  raffles: (params?: { eventId?: number; activeOnly?: boolean }) => {
    const qs = new URLSearchParams();
    if (params?.eventId != null) qs.set('event', String(params.eventId));
    if (params?.activeOnly) qs.set('active', 'true');
    const tail = qs.toString();
    return api<Raffle[]>(tail ? `/api/raffles/?${tail}` : '/api/raffles/');
  },
  createRaffle: (body: {
    event: number;
    name: string;
    delivery_method?: RaffleDeliveryMethodKey;
    description?: string;
    image_url?: string;
    quantity?: number;
    min_amount?: string;
    condition_type?: RaffleConditionTypeKey;
    schedule_entry?: number | null;
    window_start?: string | null;
    window_end?: string | null;
    is_active?: boolean;
    order?: number;
    payload?: Record<string, unknown>;
  }) => api<Raffle>('/api/raffles/', { method: 'POST', body }).then(withRaffleBroadcast),
  updateRaffle: (
    id: number,
    patch: Partial<{
      name: string;
      description: string;
      image_url: string;
      delivery_method: RaffleDeliveryMethodKey;
      quantity: number;
      min_amount: string;
      condition_type: RaffleConditionTypeKey;
      schedule_entry: number | null;
      window_start: string | null;
      window_end: string | null;
      is_active: boolean;
      order: number;
    }>,
  ) => api<Raffle>(`/api/raffles/${id}/`, { method: 'PATCH', body: patch }).then(withRaffleBroadcast),
  openRaffle: (id: number) =>
    api<Raffle>(`/api/raffles/${id}/open/`, { method: 'POST' }).then(withRaffleBroadcast),
  closeRaffle: (id: number) =>
    api<Raffle>(`/api/raffles/${id}/close/`, { method: 'POST' }).then(withRaffleBroadcast),
  drawRaffle: (id: number) =>
    api<RaffleDrawResult>(`/api/raffles/${id}/draw/`, { method: 'POST' }).then(withRaffleBroadcast),
  resetRaffle: (id: number) =>
    api<Raffle>(`/api/raffles/${id}/reset/`, { method: 'POST' }).then(withRaffleBroadcast),
  deleteRaffle: (id: number) =>
    api<void>(`/api/raffles/${id}/`, { method: 'DELETE' }).then(withRaffleBroadcast),

  // Raffle winners (PII — control panel only)
  raffleWinners: (params?: { raffleId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.raffleId != null) qs.set('raffle', String(params.raffleId));
    const tail = qs.toString();
    return api<RaffleWinner[]>(
      tail ? `/api/raffle-winners/?${tail}` : '/api/raffle-winners/',
    );
  },
  createRaffleWinner: (body: {
    raffle: number;
    donor_name: string;
    donation?: number | null;
    contact_info?: string;
    delivery_code?: string;
    fulfillment_status?: RaffleFulfillmentKey;
    notes?: string;
  }) => api<RaffleWinner>('/api/raffle-winners/', { method: 'POST', body }),
  updateRaffleWinner: (
    id: number,
    patch: Partial<{
      donor_name: string;
      contact_info: string;
      delivery_code: string;
      fulfillment_status: RaffleFulfillmentKey;
      notes: string;
    }>,
  ) => api<RaffleWinner>(`/api/raffle-winners/${id}/`, { method: 'PATCH', body: patch }),
  deleteRaffleWinner: (id: number) =>
    api<void>(`/api/raffle-winners/${id}/`, { method: 'DELETE' }),

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
    // Per-milestone celebration colour overrides. All optional —
    // blanks fall back to the active theme's omnibar_celebration_*
    // defaults, then to the baked-in gold-flash mood. See
    // CelebrationBanner.readColourOverrides for the resolution chain.
    tag_color_from?: string;
    tag_color_to?: string;
    heading_color?: string;
    sub_color?: string;
    flash_color?: string;
  }) => api<Milestone>('/api/milestones/', { method: 'POST', body }),
  updateMilestone: (
    id: number,
    patch: Partial<{
      name: string;
      threshold_amount: string;
      celebration_message: string;
      audio_url: string;
      order: number;
      tag_color_from: string;
      tag_color_to: string;
      heading_color: string;
      sub_color: string;
      flash_color: string;
    }>,
  ) =>
    api<Milestone>(`/api/milestones/${id}/`, { method: 'PATCH', body: patch }),
  markMilestoneReached: (id: number) =>
    api<Milestone>(`/api/milestones/${id}/mark_reached/`, { method: 'POST' }),
  // Reset a milestone back to pending (clears reached_at). Combined
  // with the omnibar's self-cleaning reachedIdsRef, this means the
  // celebration banner fires again next time the total crosses the
  // threshold.
  resetMilestone: (id: number) =>
    api<Milestone>(`/api/milestones/${id}/reset/`, { method: 'POST' }),
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

  // ── Charities ─────────────────────────────────────────────────────
  // Catalogue + four child tables (websites / videos / images / impact
  // tiers) + EventCharity through-table. Reads return the full nested
  // payload (`charities()` / `charity()`); writes go through the
  // dedicated child endpoints so a single row can be PATCHed without
  // round-tripping the entire tree.
  charities: (params?: { activeOnly?: boolean; eventId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.activeOnly) qs.set('active', 'true');
    if (params?.eventId != null) qs.set('event', String(params.eventId));
    const tail = qs.toString();
    return api<Charity[]>(tail ? `/api/charities/?${tail}` : '/api/charities/');
  },
  charity: (idOrSlug: number | string) =>
    api<Charity>(`/api/charities/${idOrSlug}/`),
  createCharity: (
    body: Partial<Omit<Charity, 'id' | 'created_at' | 'updated_at' |
      'websites' | 'social_links' | 'videos' | 'images' | 'impact_tiers'>> & {
      slug: string;
      name: string;
    },
  ) => api<Charity>('/api/charities/', { method: 'POST', body }),
  updateCharity: (
    id: number,
    patch: Partial<Omit<Charity, 'id' | 'created_at' | 'updated_at' |
      'websites' | 'social_links' | 'videos' | 'images' | 'impact_tiers'>>,
  ) => api<Charity>(`/api/charities/${id}/`, { method: 'PATCH', body: patch }),
  deleteCharity: (id: number) =>
    api<void>(`/api/charities/${id}/`, { method: 'DELETE' }),

  createCharityWebsite: (body: Omit<CharityWebsite, 'id'>) =>
    api<CharityWebsite>('/api/charity-websites/', { method: 'POST', body }),
  updateCharityWebsite: (id: number, patch: Partial<Omit<CharityWebsite, 'id'>>) =>
    api<CharityWebsite>(`/api/charity-websites/${id}/`, { method: 'PATCH', body: patch }),
  deleteCharityWebsite: (id: number) =>
    api<void>(`/api/charity-websites/${id}/`, { method: 'DELETE' }),

  createCharitySocialLink: (
    body: Omit<CharitySocialLink, 'id' | 'platform_label'>,
  ) =>
    api<CharitySocialLink>('/api/charity-social-links/', {
      method: 'POST',
      body,
    }),
  updateCharitySocialLink: (
    id: number,
    patch: Partial<Omit<CharitySocialLink, 'id' | 'platform_label'>>,
  ) =>
    api<CharitySocialLink>(`/api/charity-social-links/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),
  deleteCharitySocialLink: (id: number) =>
    api<void>(`/api/charity-social-links/${id}/`, { method: 'DELETE' }),

  createCharityVideo: (body: Omit<CharityVideo, 'id'>) =>
    api<CharityVideo>('/api/charity-videos/', { method: 'POST', body }),
  updateCharityVideo: (id: number, patch: Partial<Omit<CharityVideo, 'id'>>) =>
    api<CharityVideo>(`/api/charity-videos/${id}/`, { method: 'PATCH', body: patch }),
  deleteCharityVideo: (id: number) =>
    api<void>(`/api/charity-videos/${id}/`, { method: 'DELETE' }),

  createCharityImage: (body: Omit<CharityImage, 'id'>) =>
    api<CharityImage>('/api/charity-images/', { method: 'POST', body }),
  updateCharityImage: (id: number, patch: Partial<Omit<CharityImage, 'id'>>) =>
    api<CharityImage>(`/api/charity-images/${id}/`, { method: 'PATCH', body: patch }),
  deleteCharityImage: (id: number) =>
    api<void>(`/api/charity-images/${id}/`, { method: 'DELETE' }),

  createCharityImpactTier: (body: Omit<CharityImpactTier, 'id'>) =>
    api<CharityImpactTier>('/api/charity-impact-tiers/', { method: 'POST', body }),
  updateCharityImpactTier: (
    id: number,
    patch: Partial<Omit<CharityImpactTier, 'id'>>,
  ) =>
    api<CharityImpactTier>(`/api/charity-impact-tiers/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),
  deleteCharityImpactTier: (id: number) =>
    api<void>(`/api/charity-impact-tiers/${id}/`, { method: 'DELETE' }),

  // EventCharity through-table — link charities to an event with
  // is_primary + order. Setting is_primary=true demotes any other
  // primary row for the same event (handled server-side).
  eventCharities: (params?: { eventId?: number; charityId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.eventId != null) qs.set('event', String(params.eventId));
    if (params?.charityId != null) qs.set('charity', String(params.charityId));
    const tail = qs.toString();
    return api<EventCharityLink[]>(
      tail ? `/api/event-charities/?${tail}` : '/api/event-charities/',
    );
  },
  createEventCharity: (body: {
    event: number;
    charity: number;
    is_primary?: boolean;
    order?: number;
  }) => api<EventCharityLink>('/api/event-charities/', { method: 'POST', body }),
  updateEventCharity: (
    id: number,
    patch: Partial<{ is_primary: boolean; order: number }>,
  ) =>
    api<EventCharityLink>(`/api/event-charities/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),
  deleteEventCharity: (id: number) =>
    api<void>(`/api/event-charities/${id}/`, { method: 'DELETE' }),

  // ── Per-event Twitch channels + device-code connect ───────────────
  createEventTwitchChannel: (body: {
    event: number;
    login: string;
    is_primary?: boolean;
    track_charity?: boolean;
    charity_slug?: string;
    order?: number;
  }) =>
    api<EventTwitchChannel>('/api/event-twitch-channels/', { method: 'POST', body }),
  updateEventTwitchChannel: (
    id: number,
    patch: Partial<{
      login: string;
      is_primary: boolean;
      track_charity: boolean;
      charity_slug: string;
      order: number;
      is_active: boolean;
    }>,
  ) =>
    api<EventTwitchChannel>(`/api/event-twitch-channels/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),
  deleteEventTwitchChannel: (id: number) =>
    api<void>(`/api/event-twitch-channels/${id}/`, { method: 'DELETE' }),
  /** Begin the device-code OAuth flow to connect a channel. Returns a short
   *  user_code + verification_uri the broadcaster opens on their own device,
   *  plus the device_code to pass to twitchConnectPoll. */
  twitchConnectStart: (login: string, role: 'charity' | 'primary' = 'charity') =>
    api<{
      login: string;
      device_code: string;
      user_code: string;
      verification_uri: string;
      interval: number;
      expires_in: number;
      scopes: string;
    }>('/api/twitch/connect/start/', { method: 'POST', body: { login, role } }),
  /** Poll a pending device authorization. status 'authorized' once the
   *  broadcaster approves (connection saved server-side). */
  twitchConnectPoll: (deviceCode: string, login: string) =>
    api<{
      status: 'authorized' | 'pending' | 'slow_down' | 'expired' | 'error';
      message?: string;
      connection?: {
        login: string;
        broadcaster_id: string;
        display_name: string;
        scopes: string;
      };
    }>('/api/twitch/connect/poll/', {
      method: 'POST',
      body: { device_code: deviceCode, login },
    }),

  // ── Twitch chat announcements (per-event, per-trigger) ────────────
  updateChatAnnouncement: (
    id: number,
    patch: Partial<{
      enabled: boolean;
      template: string;
      as_announcement: boolean;
      announcement_color: string;
    }>,
  ) =>
    api<ChatAnnouncement>(`/api/chat-announcements/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),

  // ── Recurring chat messages (e.g. periodic donation CTA) ──────────
  createRecurringChatMessage: (body: {
    event: number;
    label?: string;
    template: string;
    interval_minutes?: number;
    only_when_live?: boolean;
    enabled?: boolean;
  }) =>
    api<RecurringChatMessage>('/api/recurring-chat-messages/', {
      method: 'POST',
      body,
    }),
  updateRecurringChatMessage: (
    id: number,
    patch: Partial<{
      label: string;
      template: string;
      interval_minutes: number;
      only_when_live: boolean;
      enabled: boolean;
    }>,
  ) =>
    api<RecurringChatMessage>(`/api/recurring-chat-messages/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),
  deleteRecurringChatMessage: (id: number) =>
    api<void>(`/api/recurring-chat-messages/${id}/`, { method: 'DELETE' }),

  // ── Twitch shoutouts (cooldown-managed queue) ─────────────────────
  shoutoutConfig: () => api<ShoutoutConfig>('/api/shoutout-config/'),
  updateShoutoutConfig: (
    patch: Partial<Omit<ShoutoutConfig, 'id' | 'event'>>,
  ) =>
    api<ShoutoutConfig>('/api/shoutout-config/', { method: 'PATCH', body: patch }),
  shoutoutRequests: (eventId?: number) =>
    api<ShoutoutRequest[]>(
      `/api/shoutout-requests/${eventId ? `?event=${eventId}` : ''}`,
    ),
  createShoutout: (body: { target_login: string; note?: string }) =>
    api<ShoutoutRequest>('/api/shoutout-requests/', { method: 'POST', body }),
  cancelShoutout: (id: number) =>
    api<ShoutoutRequest>(`/api/shoutout-requests/${id}/cancel/`, {
      method: 'POST',
    }),

  // ── Automation: scheduled jobs + EventSub dashboard ───────────────
  schedulerStatus: () =>
    api<{ last_tick_at: string | null; seconds_ago: number | null; alive: boolean }>(
      '/api/scheduler-status/',
    ),
  scheduledJobs: () => api<ScheduledJob[]>('/api/scheduled-jobs/'),
  updateScheduledJob: (
    id: number,
    patch: Partial<{ enabled: boolean; interval_seconds: number; label: string }>,
  ) =>
    api<ScheduledJob>(`/api/scheduled-jobs/${id}/`, { method: 'PATCH', body: patch }),
  runScheduledJob: (id: number) =>
    api<ScheduledJob>(`/api/scheduled-jobs/${id}/run/`, { method: 'POST' }),
  eventsubSubscriptions: () =>
    api<{
      subscriptions: EventSubSubscription[];
      counts: Record<string, number>;
    }>('/api/twitch/eventsub/subscriptions/'),
  eventsubSync: (prune = false) =>
    api<{ output: string }>('/api/twitch/eventsub/sync/', {
      method: 'POST',
      body: { prune },
    }),

  // ── Channel-point reward → action mappings ────────────────────────
  rewardMappings: (eventId?: number) =>
    api<RewardMapping[]>(
      `/api/reward-mappings/${eventId ? `?event=${eventId}` : ''}`,
    ),
  createRewardMapping: (body: {
    event: number;
    reward_id?: string;
    reward_title: string;
  }) => api<RewardMapping>('/api/reward-mappings/', { method: 'POST', body }),
  updateRewardMapping: (
    id: number,
    patch: Partial<{ reward_id: string; reward_title: string; enabled: boolean }>,
  ) => api<RewardMapping>(`/api/reward-mappings/${id}/`, { method: 'PATCH', body: patch }),
  deleteRewardMapping: (id: number) =>
    api<void>(`/api/reward-mappings/${id}/`, { method: 'DELETE' }),
  createRewardAction: (body: {
    mapping: number;
    action_type: string;
    params?: Record<string, unknown>;
    enabled?: boolean;
  }) => api<RewardAction>('/api/reward-actions/', { method: 'POST', body }),
  updateRewardAction: (
    id: number,
    patch: Partial<{
      action_type: string;
      params: Record<string, unknown>;
      enabled: boolean;
    }>,
  ) => api<RewardAction>(`/api/reward-actions/${id}/`, { method: 'PATCH', body: patch }),
  deleteRewardAction: (id: number) =>
    api<void>(`/api/reward-actions/${id}/`, { method: 'DELETE' }),
  twitchCustomRewards: () => api<CustomReward[]>('/api/twitch/rewards/'),

  // ── Twitch predictions ────────────────────────────────────────────
  twitchPredictions: (eventId?: number) =>
    api<TwitchPrediction[]>(
      `/api/twitch-predictions/${eventId ? `?event=${eventId}` : ''}`,
    ),
  createTwitchPrediction: (body: {
    title: string;
    outcomes: string[];
    window_seconds: number;
  }) =>
    api<TwitchPrediction>('/api/twitch-predictions/', { method: 'POST', body }),
  resolveTwitchPrediction: (id: number, winningOutcomeId: string) =>
    api<TwitchPrediction>(`/api/twitch-predictions/${id}/resolve/`, {
      method: 'POST',
      body: { winning_outcome_id: winningOutcomeId },
    }),
  cancelTwitchPrediction: (id: number) =>
    api<TwitchPrediction>(`/api/twitch-predictions/${id}/cancel/`, {
      method: 'POST',
    }),
  lockTwitchPrediction: (id: number) =>
    api<TwitchPrediction>(`/api/twitch-predictions/${id}/lock/`, {
      method: 'POST',
    }),

  // ── Sound assets + schedule-entry sound triggers ──────────────────
  // Reusable audio library + per-entry trigger rows. The backend SSE
  // evaluator fires due triggers automatically; the omnibar consumes
  // the resulting `schedule-entry-sound` overrides via the existing
  // override stream. The control panel uses these CRUD wrappers.
  soundAssets: () => api<SoundAsset[]>('/api/sound-assets/'),
  createSoundAsset: (body: {
    name: string;
    url: string;
    volume?: number;
  }) => api<SoundAsset>('/api/sound-assets/', { method: 'POST', body }),
  updateSoundAsset: (
    id: number,
    patch: Partial<Omit<SoundAsset, 'id' | 'created_at'>>,
  ) =>
    api<SoundAsset>(`/api/sound-assets/${id}/`, { method: 'PATCH', body: patch }),
  deleteSoundAsset: (id: number) =>
    api<void>(`/api/sound-assets/${id}/`, { method: 'DELETE' }),

  scheduleEntrySoundTriggers: (params?: { scheduleEntryId?: number }) => {
    const qs = new URLSearchParams();
    if (params?.scheduleEntryId != null) {
      qs.set('schedule_entry', String(params.scheduleEntryId));
    }
    const tail = qs.toString();
    return api<ScheduleEntrySoundTrigger[]>(
      tail
        ? `/api/schedule-entry-sound-triggers/?${tail}`
        : '/api/schedule-entry-sound-triggers/',
    );
  },
  createScheduleEntrySoundTrigger: (body: {
    schedule_entry: number;
    sound: number;
    anchor?: TriggerAnchor;
    offset_seconds?: number;
    tag?: string;
    message?: string;
    subhead?: string;
    priority?: number;
    duration_seconds?: number;
    show_banner?: boolean;
    is_active?: boolean;
  }) =>
    api<ScheduleEntrySoundTrigger>('/api/schedule-entry-sound-triggers/', {
      method: 'POST',
      body,
    }),
  updateScheduleEntrySoundTrigger: (
    id: number,
    patch: Partial<Omit<
      ScheduleEntrySoundTrigger,
      'id' | 'sound_detail' | 'last_fired_at'
    >>,
  ) =>
    api<ScheduleEntrySoundTrigger>(`/api/schedule-entry-sound-triggers/${id}/`, {
      method: 'PATCH',
      body: patch,
    }),
  deleteScheduleEntrySoundTrigger: (id: number) =>
    api<void>(`/api/schedule-entry-sound-triggers/${id}/`, { method: 'DELETE' }),
  /** Clears `last_fired_at` on every trigger of the active event so
   *  the show can be re-run without manual per-row resets. */
  resetScheduleEntrySoundTriggers: () =>
    api<{ reset: number }>('/api/schedule-entry-sound-triggers/reset/', {
      method: 'POST',
    }),
  /** Clears `last_fired_at` on a single trigger row. */
  resetScheduleEntrySoundTriggerFire: (id: number) =>
    api<ScheduleEntrySoundTrigger>(
      `/api/schedule-entry-sound-triggers/${id}/reset_fire/`,
      { method: 'POST' },
    ),

  // ── Logs & Queue ────────────────────────────────────────────────────────
  /** Read the audit trail, newest first. Server caps at `limit` (default 200). */
  activityLog: (filters: ActivityLogFilters = {}) => {
    const q = new URLSearchParams();
    if (filters.category) q.set('category', filters.category);
    if (filters.level) q.set('level', filters.level);
    if (filters.source) q.set('source', filters.source);
    if (filters.search) q.set('search', filters.search);
    if (filters.limit) q.set('limit', String(filters.limit));
    const qs = q.toString();
    return api<ActivityLogEntry[]>(`/api/activity-log/${qs ? `?${qs}` : ''}`);
  },
  /** Live snapshot of the event queue (awaiting / processing / failed). */
  queue: () => api<QueueSnapshot>('/api/queue/'),
  /** Run a management action declared on a QueueItem (e.g. cancel / consume /
   *  re-arm). The endpoint + method come straight from the snapshot. */
  runQueueAction: (action: QueueAction) =>
    api<unknown>(action.endpoint, { method: action.method }),
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
  // Opt-in localStorage cache. When set, the LAST result is persisted and used
  // as the INITIAL data on the next mount — so near-static data (theme, logo)
  // is present on first render instead of flashing a default until the first
  // fetch lands. Only use for small, safe-to-show-stale payloads.
  options?: { cacheKey?: string },
): { data: T | null; error: Error | null } {
  const cacheKey = options?.cacheKey;
  const [data, setData] = useState<T | null>(() => {
    if (!cacheKey) return null;
    try {
      const raw = window.localStorage.getItem(cacheKey);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  });
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
        if (!cancelled) {
          setData(result);
          if (cacheKey) {
            try {
              window.localStorage.setItem(cacheKey, JSON.stringify(result));
            } catch {
              /* private mode / quota — seeding just won't be available */
            }
          }
        }
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
  }, [intervalMs, cacheKey, ...deps]);

  return { data, error };
}
