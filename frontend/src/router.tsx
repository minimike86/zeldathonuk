import { createBrowserRouter, Navigate } from 'react-router';
import { RootLayout } from '@/components/layout/RootLayout';
import { ObsLayout } from '@/components/layout/ObsLayout';

import { Home } from '@/routes/Home';
import { About } from '@/routes/About';
import { History } from '@/routes/History';
import { Charity } from '@/routes/Charity';
import { Schedule } from '@/routes/Schedule';
import { Donations } from '@/routes/Donations';
import { Incentives } from '@/routes/Incentives';
import { Login } from '@/routes/Login';
import { PrivacyPolicy } from '@/routes/PrivacyPolicy';
import { TermsOfUse } from '@/routes/TermsOfUse';
import { NotFound } from '@/routes/NotFound';
import { GameTracking } from '@/routes/GameTracking';

import { Obs } from '@/routes/obs/Obs';
import { ObsLayoutRoute } from '@/routes/obs/Layout';
import { AudioCountdown } from '@/routes/obs/AudioCountdown';
import { Brb } from '@/routes/obs/Brb';
import { Tts } from '@/routes/obs/Tts';
import { Omnibar } from '@/routes/obs/Omnibar';

import { ControlLayout } from '@/routes/control/Dashboard';
import { ScheduleControl } from '@/routes/control/Schedule';
import { TimerControl } from '@/routes/control/Timer';
import { ItemsControl } from '@/routes/control/Items';
import { DonationsControl } from '@/routes/control/Donations';
import { BrbControl } from '@/routes/control/Brb';
import { GamesControl } from '@/routes/control/Games';
import { RunnersControl } from '@/routes/control/Runners';
import { EventsControl } from '@/routes/control/Events';
import { AudioControl } from '@/routes/control/Audio';

import { Timers } from '@/routes/api/Timers';
import { CountUp } from '@/routes/api/CountUp';

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/login', element: <Login /> },
      { path: '/about', element: <About /> },
      { path: '/history', element: <History /> },
      { path: '/charity', element: <Charity /> },
      { path: '/schedule', element: <Schedule /> },
      { path: '/incentives', element: <Incentives /> },
      { path: '/donations', element: <Donations /> },
      { path: '/donors', element: <Navigate to="/donations" replace /> },
      { path: '/donate', element: <Navigate to="/donations" replace /> },
      { path: '/privacy', element: <PrivacyPolicy /> },
      { path: '/privacy-policy', element: <Navigate to="/privacy" replace /> },
      { path: '/terms', element: <TermsOfUse /> },
      { path: '/terms-of-service', element: <Navigate to="/terms" replace /> },
    ],
  },
  {
    element: <ObsLayout />,
    children: [
      { path: '/obs', element: <Obs /> },
      { path: '/obs/layout/:layout', element: <ObsLayoutRoute /> },
      { path: '/obs/audio-countdown', element: <AudioCountdown /> },
      { path: '/obs/brb', element: <Brb /> },
      { path: '/obs/tts', element: <Tts /> },
      { path: '/obs/omnibar', element: <Omnibar /> },
      { path: '/tracking/:game', element: <GameTracking /> },
      { path: '/api/timers', element: <Timers /> },
      { path: '/api/count-up', element: <CountUp /> },
    ],
  },
  {
    path: '/control',
    element: <ControlLayout />,
    children: [
      { path: 'schedule', element: <ScheduleControl /> },
      { path: 'timer', element: <TimerControl /> },
      { path: 'items', element: <ItemsControl /> },
      { path: 'donations', element: <DonationsControl /> },
      { path: 'brb', element: <BrbControl /> },
      { path: 'audio', element: <AudioControl /> },
      { path: 'games', element: <GamesControl /> },
      { path: 'runners', element: <RunnersControl /> },
      { path: 'events', element: <EventsControl /> },
    ],
  },
  { path: '*', element: <NotFound /> },
]);
