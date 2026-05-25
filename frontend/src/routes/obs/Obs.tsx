import { Link } from 'react-router';
import './obs.css';

type Source = {
  path: string;
  title: string;
  description: string;
  category: 'layout' | 'event';
};

/**
 * /obs — index of every OBS browser source. Each link is a URL that can be
 * dropped into an OBS browser source as-is. The control panel at /control
 * decides what each source actually shows.
 */
const sources: Source[] = [
  // Game layouts — pick whichever matches the aspect ratio of the game being played.
  {
    path: '/obs/layout/16x9',
    title: '16:9 widescreen',
    description: 'Modern widescreen games — BotW, TotK, Skyward Sword HD',
    category: 'layout',
  },
  {
    path: '/obs/layout/4x3',
    title: '4:3 standard',
    description: 'Classic CRT-era games — OoT, Majora\'s Mask, A Link to the Past',
    category: 'layout',
  },
  {
    path: '/obs/layout/3ds',
    title: '3DS dual-screen',
    description: 'OoT3D, MM3D, A Link Between Worlds',
    category: 'layout',
  },
  {
    path: '/obs/layout/ds-top',
    title: 'DS — top screen only',
    description: 'DS games where only the top screen is gameplay (Phantom Hourglass cutscenes etc.)',
    category: 'layout',
  },
  {
    path: '/obs/layout/ds-both',
    title: 'DS — both screens',
    description: 'DS games using both screens — Phantom Hourglass, Spirit Tracks',
    category: 'layout',
  },
  {
    path: '/obs/layout/fsa-split',
    title: 'FSA four-player split',
    description: 'Four Swords Adventures with four GBA viewports',
    category: 'layout',
  },
  // Event overlays.
  {
    path: '/obs/audio-countdown',
    title: 'Audio visualiser countdown',
    description: 'Pre-stream waiting screen with audio visualiser and countdown to start',
    category: 'event',
  },
  {
    path: '/obs/brb',
    title: 'BRB break screen',
    description: 'Be-right-back overlay with countdown to stream resume',
    category: 'event',
  },
  {
    path: '/obs/tts',
    title: 'Text-to-speech overlay',
    description: 'Reads incoming donation messages aloud',
    category: 'event',
  },
  {
    path: '/obs/omnibar',
    title: 'Omnibar (bottom ticker)',
    description: 'Rotating bottom strip — donations, up next, calls to action',
    category: 'event',
  },
];

export function Obs() {
  const layouts = sources.filter((s) => s.category === 'layout');
  const events = sources.filter((s) => s.category === 'event');

  return (
    <div className="obs-index">
      <header>
        <h1 className="text-bloodmoon">OBS Browser Sources</h1>
        <p className="text-light">
          Drop any of these URLs into an OBS "Browser" source. The control panel at{' '}
          <Link to="/control" className="text-warning">
            /control
          </Link>{' '}
          decides what data they show.
        </p>
      </header>

      <section>
        <h2 className="text-bloodmoon">Game layouts</h2>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {layouts.map((s) => (
            <SourceCard key={s.path} source={s} />
          ))}
        </div>
      </section>

      <section className="mt-5">
        <h2 className="text-bloodmoon">Event overlays</h2>
        <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-3">
          {events.map((s) => (
            <SourceCard key={s.path} source={s} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SourceCard({ source }: { source: Source }) {
  const url = `${window.location.origin}${source.path}`;
  return (
    <div className="col">
      <div className="card h-100 obs-source-card">
        <div className="card-body">
          <h5 className="card-title">{source.title}</h5>
          <p className="card-text small text-white-50">{source.description}</p>
          <code className="d-block small text-warning mb-2 text-break">{url}</code>
          <div className="d-flex gap-2">
            <Link to={source.path} className="btn btn-sm btn-bloodmoon">
              Open
            </Link>
            <button
              type="button"
              className="btn btn-sm btn-outline-light"
              onClick={() => navigator.clipboard.writeText(url)}
            >
              Copy URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
