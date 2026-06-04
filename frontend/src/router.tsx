import type { ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { ObsLayout } from '@/components/layout/ObsLayout';
import { ClerkProviderLayout } from '@/components/auth/ClerkProviderLayout';

/**
 * Code-split route helper. Each page becomes its own lazily-loaded chunk via
 * React Router's `lazy`, so the initial bundle is just the shell + the landed
 * route — public visitors never download the (heavy) control-panel or OBS
 * code, and the build stops shipping one ~1.3 MB monolith. The shell layouts
 * (RootLayout / ObsLayout) stay eager so the nav/background paint instantly.
 */
const lazy = (loader: () => Promise<Record<string, unknown>>, name: string) => ({
  lazy: async () => {
    const mod = await loader();
    return { Component: mod[name] as ComponentType };
  },
});

export const router = createBrowserRouter([
  // Clerk wraps the public site + control panel (anything that may need auth).
  // The /obs overlays are a sibling group below, intentionally outside Clerk so
  // OBS browser sources load no auth code.
  {
    element: <ClerkProviderLayout />,
    children: [
  {
    element: <RootLayout />,
    children: [
      { path: '/', ...lazy(() => import('@/routes/Home'), 'Home') },
      { path: '/login', ...lazy(() => import('@/routes/Login'), 'Login') },
      { path: '/about', ...lazy(() => import('@/routes/About'), 'About') },
      { path: '/history', ...lazy(() => import('@/routes/History'), 'History') },
      { path: '/charity', ...lazy(() => import('@/routes/Charity'), 'Charity') },
      { path: '/schedule', ...lazy(() => import('@/routes/Schedule'), 'Schedule') },
      { path: '/incentives', ...lazy(() => import('@/routes/Incentives'), 'Incentives') },
      { path: '/donations', ...lazy(() => import('@/routes/Donations'), 'Donations') },
      { path: '/donors', element: <Navigate to="/donations" replace /> },
      { path: '/donate', element: <Navigate to="/donations" replace /> },
      { path: '/privacy', ...lazy(() => import('@/routes/PrivacyPolicy'), 'PrivacyPolicy') },
      { path: '/privacy-policy', element: <Navigate to="/privacy" replace /> },
      { path: '/terms', ...lazy(() => import('@/routes/TermsOfUse'), 'TermsOfUse') },
      { path: '/terms-of-service', element: <Navigate to="/terms" replace /> },
    ],
  },
  {
    path: '/control',
    ...lazy(() => import('@/routes/control/Dashboard'), 'ControlLayout'),
    children: [
      { path: 'schedule', ...lazy(() => import('@/routes/control/Schedule'), 'ScheduleControl') },
      { path: 'timer', ...lazy(() => import('@/routes/control/Timer'), 'TimerControl') },
      { path: 'items', ...lazy(() => import('@/routes/control/Items'), 'ItemsControl') },
      { path: 'objectives', ...lazy(() => import('@/routes/control/Objectives'), 'ObjectivesControl') },
      { path: 'objective', element: <Navigate to="/control/objectives" replace /> },
      { path: 'donations', ...lazy(() => import('@/routes/control/Donations'), 'DonationsControl') },
      { path: 'brb', ...lazy(() => import('@/routes/control/Brb'), 'BrbControl') },
      { path: 'audio', ...lazy(() => import('@/routes/control/Audio'), 'AudioControl') },
      { path: 'games', ...lazy(() => import('@/routes/control/Games'), 'GamesControl') },
      { path: 'runners', ...lazy(() => import('@/routes/control/Runners'), 'RunnersControl') },
      { path: 'events', ...lazy(() => import('@/routes/control/Events'), 'EventsControl') },
      { path: 'charities', ...lazy(() => import('@/routes/control/Charities'), 'CharitiesControl') },
      { path: 'raffles', ...lazy(() => import('@/routes/control/Raffles'), 'RafflesControl') },
      { path: 'predictions', ...lazy(() => import('@/routes/control/Predictions'), 'PredictionsControl') },
      { path: 'theme', ...lazy(() => import('@/routes/control/Theme'), 'ThemeControl') },
      { path: 'layouts', ...lazy(() => import('@/routes/control/Layouts'), 'LayoutsControl') },
      { path: 'omnibar', ...lazy(() => import('@/routes/control/Omnibar'), 'OmnibarControl') },
      { path: 'chest-announcer', ...lazy(() => import('@/routes/control/ChestAnnouncer'), 'ChestAnnouncerControl') },
      { path: 'logs', ...lazy(() => import('@/routes/control/LogsQueue'), 'LogsQueueControl') },
    ],
  },
      { path: '*', ...lazy(() => import('@/routes/NotFound'), 'NotFound') },
    ],
  },
  // OBS browser-source overlays — sibling of the Clerk group above so they load
  // no auth code. Public (read-only data); see the /obs access decision.
  {
    element: <ObsLayout />,
    children: [
      { path: '/obs', ...lazy(() => import('@/routes/obs/Obs'), 'Obs') },
      { path: '/obs/layout/:layout', ...lazy(() => import('@/routes/obs/Layout'), 'ObsLayoutRoute') },
      { path: '/obs/full', ...lazy(() => import('@/routes/obs/Unified'), 'UnifiedLayout') },
      { path: '/obs/audio-countdown', ...lazy(() => import('@/routes/obs/AudioCountdown'), 'AudioCountdown') },
      { path: '/obs/brb', ...lazy(() => import('@/routes/obs/Brb'), 'Brb') },
      { path: '/obs/tts', ...lazy(() => import('@/routes/obs/Tts'), 'Tts') },
      { path: '/obs/omnibar', ...lazy(() => import('@/routes/obs/omnibar/Omnibar'), 'Omnibar') },
      { path: '/obs/chest-announcer', ...lazy(() => import('@/routes/obs/ChestAnnouncer'), 'ChestAnnouncer') },
      { path: '/tracking/:game', ...lazy(() => import('@/routes/GameTracking'), 'GameTracking') },
      { path: '/api/timers', ...lazy(() => import('@/routes/api/Timers'), 'Timers') },
      { path: '/api/count-up', ...lazy(() => import('@/routes/api/CountUp'), 'CountUp') },
    ],
  },
]);
