import { describe, it, expect } from 'vitest';
import { containsProfanity, cleanForDisplay, cleanForTTS } from './profanity';

describe('profanity', () => {
  it('detects bad words case-insensitively', () => {
    expect(containsProfanity('what the Fuck')).toBe(true);
    expect(containsProfanity('a wanker move')).toBe(true);
    expect(containsProfanity('have a lovely day')).toBe(false);
  });

  it('leaves clean text unchanged', () => {
    expect(cleanForDisplay('good luck runners')).toBe('good luck runners');
    expect(cleanForTTS('good luck runners')).toBe('good luck runners');
  });

  it('masks the middle of a bad word for display, preserving casing', () => {
    expect(cleanForDisplay('fuck')).toBe('f**k');
    expect(cleanForDisplay('Shitting bricks')).toBe('S******g bricks');
  });

  it('masks short words entirely', () => {
    // "ass" is 3 chars → first/last kept; a ≤2 char hit is fully masked.
    expect(cleanForDisplay('piss')).toBe('p**s');
  });

  it('drops bad words for TTS and collapses the gap', () => {
    expect(cleanForTTS('what the fuck man')).toBe('what the man');
    expect(cleanForTTS('fuck')).toBe('');
  });
});
