import { useEffect } from 'react';
import { useLocation } from 'react-router';

const BASE = 'Zeldathon';

const TITLES: Record<string, string> = {
  '/': 'Home',
  '/login': 'Login',
  '/about': 'About',
  '/history': 'History',
  '/charity': 'Charity',
  '/schedule': 'Schedule',
  '/incentives': 'Incentives',
  '/donations': 'Donations',
  '/privacy': 'Privacy Policy',
  '/terms': 'Terms of Use',
  '/control': 'Control',
  '/control/events': 'Control · Events',
  '/control/games': 'Control · Games',
  '/control/runners': 'Control · Runners',
  '/control/schedule': 'Control · Schedule',
  '/control/timer': 'Control · Timer',
  '/control/items': 'Control · Items',
  '/control/donations': 'Control · Donations',
  '/control/audio': 'Control · Music',
  '/control/brb': 'Control · BRB',
  '/control/omnibar': 'Control · Omnibar',
  '/control/chest-announcer': 'Control · Chest announcer',
  '/control/theme': 'Control · Theme',
  '/obs': 'OBS',
  '/obs/full': 'OBS · Unified',
  '/obs/brb': 'OBS · BRB',
  '/obs/tts': 'OBS · TTS',
  '/obs/omnibar': 'OBS · Omnibar',
  '/obs/audio-countdown': 'OBS · Countdown',
};

const PREFIX_TITLES: Array<[string, string]> = [
  ['/obs/layout/', 'OBS · Layout'],
  ['/tracking/', 'Tracking'],
  ['/api/', 'API'],
];

function titleFor(pathname: string): string | null {
  const trimmed = pathname.length > 1 && pathname.endsWith('/')
    ? pathname.slice(0, -1)
    : pathname;
  if (trimmed in TITLES) return TITLES[trimmed];
  for (const [prefix, label] of PREFIX_TITLES) {
    if (trimmed.startsWith(prefix)) return label;
  }
  return null;
}

/**
 * Sets `document.title` to "Zeldathon | <page>" based on the current
 * pathname. Routes that aren't mapped fall back to just "Zeldathon".
 */
export function useRouteTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page = titleFor(pathname);
    document.title = page ? `${BASE} | ${page}` : BASE;
  }, [pathname]);
}

/**
 * Override hook for routes that want a more specific title than the
 * pathname map provides (e.g. control sub-pages or dynamic content).
 */
export function usePageTitle(page: string | null | undefined) {
  useEffect(() => {
    document.title = page ? `${BASE} | ${page}` : BASE;
  }, [page]);
}
