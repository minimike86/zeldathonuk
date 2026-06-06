/**
 * Profanity scrubber for donor-facing text (donation messages + donor
 * names). Two sanitisation modes:
 *
 *   cleanForDisplay  — visual: keeps the first/last character of each bad
 *                      word and replaces the middle with asterisks
 *                      ("fuck" → "f**k"). Word casing is preserved.
 *
 *   cleanForTTS      — audio: drops the bad word entirely from the
 *                      spoken string. Speaking "bleep" would sound
 *                      cartoonish and dropping is the cleanest fix —
 *                      surrounding whitespace is collapsed.
 *
 * The word list is the LDNOOBW ("List of Dirty, Naughty, Obscene, and
 * Otherwise Bad Words") English list — the de-facto community blocklist —
 * vendored locally in `ldnoobw-en.ts`, unioned with a handful of British
 * swears the LDNOOBW list omits (e.g. "wanker", "prick"). It's vendored
 * rather than imported from a package so the bundle resolves identically
 * across host and container builds.
 */

import { LDNOOBW_EN } from './ldnoobw-en';

// British / extra terms the LDNOOBW English list doesn't carry. Note "fuck"
// is in LDNOOBW but with word-boundary matching "fucker" needs its own
// entry, etc.
const EXTRA_WORDS = [
  'fucker',
  'shitting',
  'wanker',
  'dickhead',
  'piss',
  'prick',
  'retard',
  'retarded',
];

// Escape regex metacharacters so any future list entry that contains one
// (the current LDNOOBW en list has none) can't break the matcher.
function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// De-duped, sorted longest-first so multi-word phrases and longer terms
// win over shorter overlapping ones in the alternation.
const WORDS = Array.from(new Set([...LDNOOBW_EN, ...EXTRA_WORDS].map((w) => w.toLowerCase())))
  .sort((a, b) => b.length - a.length)
  .map(escapeRegExp);

// Single combined regex with word boundaries. Case-insensitive so we
// match "Fuck" and "FUCK" equally; the replacement preserves casing.
const RE = new RegExp(`\\b(${WORDS.join('|')})\\b`, 'gi');

export function containsProfanity(text: string): boolean {
  // .test consumes lastIndex on a /g regex; reset before use.
  RE.lastIndex = 0;
  return RE.test(text);
}

export function cleanForDisplay(text: string): string {
  return text.replace(RE, (word) => {
    if (word.length <= 2) return '*'.repeat(word.length);
    return word[0] + '*'.repeat(word.length - 2) + word[word.length - 1];
  });
}

export function cleanForTTS(text: string): string {
  // Drop the word entirely, then squash any double-space gap left behind.
  return text.replace(RE, '').replace(/\s{2,}/g, ' ').trim();
}
