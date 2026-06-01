import { obsApi } from '@/lib/obsApi';
import { playSound } from '../../chestSoundTriggers';
import type { PlaybackHandle } from '../../fanfare';

/**
 * Play a random player-death sting from the Sound library. The pool is
 * every SoundAsset whose name contains "death" (case-insensitive) — so an
 * operator just uploads stings named e.g. "Death — Link Scream" on
 * /control/omnibar → Sound library and they join the rotation, no code or
 * config change. Each asset's own volume is honoured.
 *
 * Avoids repeating the previous pick when more than one is configured.
 * Fire-and-forget: resolves null when nothing matches or the browser
 * blocks playback (autoplay policy) — the visual death flash still runs.
 */

const DEATH_NAME_RE = /death/i;

let lastUrl: string | null = null;

export async function playRandomDeathSound(): Promise<PlaybackHandle | null> {
  let assets;
  try {
    assets = await obsApi.soundAssets();
  } catch {
    return null;
  }
  let pool = assets.filter((a) => a.url && DEATH_NAME_RE.test(a.name));
  if (pool.length === 0) return null;
  // Don't play the same sting twice in a row when there's a choice.
  if (pool.length > 1 && lastUrl) {
    const without = pool.filter((a) => a.url !== lastUrl);
    if (without.length) pool = without;
  }
  const pick = pool[Math.floor(Math.random() * pool.length)];
  lastUrl = pick.url;
  return playSound(pick.url, pick.volume);
}
