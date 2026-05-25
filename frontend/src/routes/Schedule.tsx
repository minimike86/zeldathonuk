import moment from 'moment';
import { useMemo } from 'react';
import './schedule.css';

type Runner = { name: string; channelUrl: string };
type Badge = { name: string; type: string; tooltip: string; url?: string };
type ScheduledGame = {
  gameProgressKey: string;
  title: string;
  releaseYear: string;
  boxArt: string;
  platform: string;
  runners: Runner[];
  badges: Badge[];
  durationHours: number;
  durationMinutes: number;
  howLongToBeatId: string;
  isCompleted?: boolean;
};

/**
 * Placeholder GameBlast22 schedule. Mirrors the shape the legacy Firebase
 * `gameLineupService` returned. Will be replaced with a live read from the
 * Django backend once the schema is in place.
 */
const startDate = new Date('2022-02-25T17:00:00+00:00');
const currentGameKey = '';
const isLive = false;

const games: ScheduledGame[] = [
  {
    gameProgressKey: 'wind-waker',
    title: 'The Legend of Zelda: The Wind Waker HD',
    releaseYear: '2013',
    boxArt:
      'https://howlongtobeat.com/games/Wind_Waker_HD.jpg',
    platform: 'Wii U',
    runners: [{ name: 'msec', channelUrl: 'https://www.twitch.tv/msec' }],
    badges: [],
    durationHours: 12,
    durationMinutes: 0,
    howLongToBeatId: '4138',
  },
  {
    gameProgressKey: 'ocarina-of-time',
    title: 'The Legend of Zelda: Ocarina of Time',
    releaseYear: '1998',
    boxArt: 'https://howlongtobeat.com/games/Ocarina_of_Time.jpg',
    platform: 'N64',
    runners: [
      { name: 'msec', channelUrl: 'https://www.twitch.tv/msec' },
      { name: 'lottie', channelUrl: '' },
    ],
    badges: [
      { name: '100%', type: 'bg-warning text-dark', tooltip: 'Going for 100% completion' },
    ],
    durationHours: 14,
    durationMinutes: 30,
    howLongToBeatId: '4456',
  },
  {
    gameProgressKey: 'majoras-mask',
    title: "The Legend of Zelda: Majora's Mask",
    releaseYear: '2000',
    boxArt: 'https://howlongtobeat.com/games/Majoras_Mask.jpg',
    platform: 'N64',
    runners: [{ name: 'msec', channelUrl: 'https://www.twitch.tv/msec' }],
    badges: [],
    durationHours: 10,
    durationMinutes: 0,
    howLongToBeatId: '4459',
  },
  {
    gameProgressKey: 'breath-of-the-wild',
    title: 'The Legend of Zelda: Breath of the Wild',
    releaseYear: '2017',
    boxArt: 'https://howlongtobeat.com/games/Breath_of_the_Wild.jpg',
    platform: 'Switch',
    runners: [
      { name: 'msec', channelUrl: 'https://www.twitch.tv/msec' },
      { name: 'henry', channelUrl: '' },
    ],
    badges: [
      { name: 'Boss Rush', type: 'bg-danger', tooltip: 'All-bosses run' },
    ],
    durationHours: 8,
    durationMinutes: 0,
    howLongToBeatId: '38050',
  },
  {
    gameProgressKey: 'skyward-sword',
    title: 'The Legend of Zelda: Skyward Sword HD',
    releaseYear: '2021',
    boxArt: 'https://howlongtobeat.com/games/Skyward_Sword_HD.jpg',
    platform: 'Switch',
    runners: [{ name: 'lottie', channelUrl: '' }],
    badges: [],
    durationHours: 12,
    durationMinutes: 30,
    howLongToBeatId: '88306',
  },
  {
    gameProgressKey: 'links-awakening',
    title: "The Legend of Zelda: Link's Awakening",
    releaseYear: '2019',
    boxArt: 'https://howlongtobeat.com/games/Links_Awakening_Remake.jpg',
    platform: 'Switch',
    runners: [{ name: 'henry', channelUrl: '' }],
    badges: [],
    durationHours: 9,
    durationMinutes: 0,
    howLongToBeatId: '78782',
  },
];

export function Schedule() {
  const rows = useMemo(() => {
    let cursor = startDate.getTime();
    return games.map((game) => {
      const start = new Date(cursor);
      cursor +=
        game.durationHours * 60 * 60 * 1000 + game.durationMinutes * 60 * 1000;
      return { ...game, startDate: start };
    });
  }, []);

  const currentIndex = rows.findIndex((g) => g.gameProgressKey === currentGameKey);

  return (
    <div className="container p-3 min-vh-100 text-white text-center">
      <div className="my-3">
        <div className="mb-5">
          <h1 className="text-bloodmoon">Stream Schedule</h1>
          <p className="text-light mt-2">
            Check the dates and times below to see when (roughly) we will be playing
            your favourite titles so that you won't miss out!
          </p>
        </div>

        <div className="table-responsive">
          <table className="table bg-bloodmoon text-white" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th scope="col">Day</th>
                <th scope="col">Time</th>
                <th scope="col">
                  <div className="d-none d-md-block">Console</div>
                </th>
                <th scope="col">Game</th>
                <th scope="col">
                  <div className="d-none d-md-block">Runner(s)</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((game, i) => {
                const played =
                  game.isCompleted || (currentIndex >= 0 && i < currentIndex);
                const playing = currentIndex === i;
                const rowClass = played
                  ? 'table-played'
                  : playing
                  ? 'table-currently-playing'
                  : '';
                return (
                  <tr key={game.gameProgressKey} className={rowClass}>
                    <td className="align-middle">
                      <div>{moment(game.startDate).format('ddd DD')}</div>
                      <div className="text-white-50">
                        {moment(game.startDate).format('MMM YYYY')}
                      </div>
                    </td>
                    <td className="align-middle">
                      <div>{moment(game.startDate).format('hh:mm')}</div>
                      <div className="text-white-50">
                        {moment(game.startDate).format('a')}
                      </div>
                    </td>
                    <td className="align-middle text-center">
                      <div className="d-none d-md-block">
                        <div className="badge rounded-pill bg-secondary p-2">
                          {game.platform}
                        </div>
                      </div>
                    </td>
                    <td className="align-middle">
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex flex-column me-2">
                          <img
                            src={game.boxArt}
                            alt={`${game.title} Cover Art`}
                            title={`${game.title} Cover Art`}
                            style={{ maxWidth: 50 }}
                          />
                        </div>
                        <div className="text-center w-100">
                          <div>
                            {game.title} ({game.releaseYear})
                            {played && (
                              <div className="d-flex justify-content-center">
                                <div className="rounded-pill bg-dark mt-1 w-50">
                                  COMPLETED
                                </div>
                              </div>
                            )}
                            {playing && isLive && (
                              <div className="d-inline-block m-2">
                                <div
                                  className="badge bg-light text-dark fw-bold p-2 px-4"
                                  style={{ cursor: 'pointer' }}
                                  title="Watch Livestream"
                                >
                                  LIVE NOW!{' '}
                                  <span style={{ color: 'red' }}>
                                    <div className="d-inline-block live-circle ms-1" />
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                          {game.badges.map((badge, b) =>
                            badge.url ? (
                              <span
                                key={b}
                                className={`badge m-1 ${badge.type}`}
                                title={badge.tooltip}
                              >
                                <a
                                  className="text-white"
                                  href={badge.url}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {badge.name}
                                </a>
                              </span>
                            ) : (
                              <span
                                key={b}
                                className={`badge m-1 ${badge.type}`}
                                title={badge.tooltip}
                              >
                                {badge.name}
                              </span>
                            ),
                          )}
                          <span className="badge m-2 bg-light">
                            <a
                              target="_blank"
                              rel="noreferrer"
                              className="text-dark"
                              title="How long to beat"
                              href={`https://howlongtobeat.com/game?id=${game.howLongToBeatId}`}
                            >
                              {game.durationHours}h {game.durationMinutes}m
                            </a>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="align-middle text-center">
                      <div className="d-none d-md-block">
                        {game.runners.map((runner, r) =>
                          runner.channelUrl ? (
                            <a
                              key={r}
                              href={runner.channelUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <span className="badge rounded-pill bg-secondary p-2 m-1">
                                {runner.name}
                              </span>
                            </a>
                          ) : (
                            <span
                              key={r}
                              className="badge rounded-pill bg-secondary p-2 m-1"
                            >
                              {runner.name}
                            </span>
                          ),
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
