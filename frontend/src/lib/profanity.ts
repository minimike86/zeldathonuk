/**
 * Profanity scrubber for live donation messages. Two sanitisation modes:
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
 * The list is deliberately small and conservative. False positives are
 * worse than letting the odd edge-case word slip — viewers tend to
 * notice "n**k" on a benign word more than a missed minor swear. Add
 * words here as real moderation needs come up; don't pre-emptively
 * bloat the list with every conceivable variant.
 */

const BAD_WORDS = [
  'fuck',
  'fucking',
  'fucker',
  'shit',
  'shitting',
  'bullshit',
  'cunt',
  'twat',
  'wank',
  'wanker',
  'bitch',
  'bastard',
  'arsehole',
  'asshole',
  'dickhead',
  'cock',
  'piss',
  'bollocks',
  'prick',
  'slut',
  'whore',
  'nigger',
  'nigga',
  'faggot',
  'retard',
  'retarded',
];

// Single combined regex with word boundaries. Case-insensitive so we
// match "Fuck" and "FUCK" equally; the replacement preserves casing.
const RE = new RegExp(`\\b(${BAD_WORDS.join('|')})\\b`, 'gi');

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
