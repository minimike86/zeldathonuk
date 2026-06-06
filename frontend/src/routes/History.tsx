import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExternalLinkAlt, faStar, faCheck } from '@fortawesome/free-solid-svg-icons';
import { useAccentDeck } from '@/lib/accentDeck';
import './history.css';

type TimelineEvent = {
  status: string;
  date: string;
  icon: string;
  color: string;
  src: string;
  image: string;
  description: string;
  justGivingUrl: string;
  facebookUrl: string;
  tiltifyUrl: string;
};

// Pass every plausible parent so Twitch's iframe security check passes
// whether you're on localhost, the docker network, or the real domain.
// Mirrors the list used by the Home page's stream embed.
const TWITCH_PARENTS = [
  'localhost',
  '127.0.0.1',
  'host.docker.internal',
  'zeldathon.co.uk',
  'www.zeldathon.co.uk',
];
const TWITCH_PARENT_QS = TWITCH_PARENTS.map((p) => `parent=${p}`).join('&');

// Ported verbatim from legacy/src/app/components/history/history.component.ts
const events: TimelineEvent[] = [
  {
    status: '2026 #GameBlast26',
    date: '20/02/2026 09:00',
    icon: 'pi pi-calendar',
    color: '#E71347',
    // Live Twitch player rather than a YouTube VOD — this is the
    // current event, so embed the stream itself. Shows "offline" when
    // the channel isn't live.
    src: `https://player.twitch.tv/?channel=zeldathonuk&${TWITCH_PARENT_QS}&autoplay=false`,
    image: '',
    description:
      "We're back for SpecialEffect's GameBlast charity marathon #GameBlast26! Catch the action live on Twitch and help us raise more than ever before for this awesome charity.",
    justGivingUrl: '',
    facebookUrl: '',
    tiltifyUrl: '',
  },
  {
    status: '2023 #GameBlast23',
    date: '24/02/2023 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/3QhCZ19f9nE?list=PLgZcQdq1SEvgebyv4oknvJl6c1LBVE9Ib',
    image: '',
    description:
      "Our return to SpecialEffect's GameBlast charity marathon event #GameBlast23 — another weekend of Zelda for an amazing cause. Thank you to everyone who watched and donated!",
    justGivingUrl: '',
    facebookUrl: '',
    tiltifyUrl: '',
  },
  {
    status: '2022 #GameBlast22',
    date: '25/02/2022 09:00',
    icon: 'pi pi-calendar',
    color: '#E71347',
    src: 'https://www.youtube-nocookie.com/embed/videoseries?list=PLgZcQdq1SEviPsD32ZCSyKz9fUk5AQovO',
    image: '',
    description:
      "We're once again joining SpecialEffect's GameBlast charity marathon event #GameBlast22! This February please help us to raise more than ever before for this awesome charity!",
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022',
    facebookUrl: 'https://www.facebook.com/donate/5194665980557244/',
    tiltifyUrl: 'https://donate.tiltify.com/@msec/zeldathonuk-gameblast22',
  },
  {
    status: '2021 #GameBlast21',
    date: '20/02/2021 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/HArshV_Ii74?list=PLgZcQdq1SEvjpMiqiFTbLJ8qHTOAuuxDH',
    image: '',
    description:
      "Last year's entry into SpecialEffect's GameBlast charity marathon event #GameBlast21. Mike and Lottie were on their own this year due to the ongoing COVID-19 pandemic. We still raised over £1000! Thank you!",
    justGivingUrl:
      'https://www.justgiving.com/fundraising/276hr-zelda-marathon-benefitting-specialeffec',
    facebookUrl: 'https://www.facebook.com/donate/855003971855785/',
    tiltifyUrl: '',
  },
  {
    status: '2020 #GameBlast20',
    date: '20/02/2020 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/xv1rKCjY6VQ?list=PLgZcQdq1SEvjsz9RsmbNMFncjR0RabuoG',
    image: '',
    description:
      "The last Zelda Marathon before the COVID-19 pandemic set in. We played all the classic titles like A Link to the Past, Skyward Sword, Ocarina of Time, as well as our first play-through of The Legend of Zelda: Link's Awakening remake! We finished the marathon with a frantic Hyrule Castle boss rush in Breath of the Wild.",
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2020',
    facebookUrl: 'https://www.facebook.com/donate/655011391974449/',
    tiltifyUrl: '',
  },
  {
    status: '2019 #GameBlast19',
    date: '22/02/2019 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/OKsTUKmf2Ao?list=PLgZcQdq1SEvgFuWp74efeCZFFp-FJQh8F',
    image: '',
    description:
      "Our entry to GameBlast19 we started with Matt attempting his first ever play of Minish Cap, before taking on Majora's Mask, and Spirit Tracks.",
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2019',
    facebookUrl: 'https://www.facebook.com/donate/235288154058664/',
    tiltifyUrl: '',
  },
  {
    status: '2018 #GameBlast18',
    date: '20/02/2018 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/3MoUXQHuDAk?list=PLgZcQdq1SEvgwmIQeLM8SV2f3awi5xf46',
    image: '',
    description:
      'What a great year! For GameBlast18 we speed-ran Ocarina of Time on the 3DS completing it in under 2 hours, killing Ganon as child link! We completed Wind Waker HD, replayed Breath of the Wild, beat the original Legend of Zelda in under 3 hours, Sir Eggington was created, and Mike did a backflip on stream for a £20 donation!',
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast2018',
    facebookUrl: 'https://www.facebook.com/donate/154880338545073/',
    tiltifyUrl: '',
  },
  {
    status: '2017 #GameBlast17',
    date: '20/02/2017 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/AuSaRPl5XLk?list=PLgZcQdq1SEvjHw5iwiNbRKJ21QNxbbE-k',
    image: '',
    description:
      'We started GameBlast17 a week later than everyone else so we could do a play-through of the newly released Nintendo Switch and Breath of the Wild. We opened the stream with an unboxing and just played BotW exclusively all weekend with all the blood moon bugs that came with it at launch!',
    justGivingUrl: 'https://www.justgiving.com/fundraising/gameblast17-michael-warner',
    facebookUrl: '',
    tiltifyUrl: '',
  },
  {
    status: '2015 #GameBlast15',
    date: '20/02/2015 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: '',
    image:
      'https://images.jg-cdn.com/image/d8833274-8d08-42f4-8b3a-6a24ae3a8339.jpg?template=fundraisingpageupdatephotom',
    description:
      "Lacking a venue in addition to other academic commitments for GameBlast15; Mike simply ran this year's Zeldathon as a 24 hour stream in his dormitory.",
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2015',
    facebookUrl: '',
    tiltifyUrl: '',
  },
  {
    status: '2014 #GameBlast14',
    date: '20/02/2014 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: '',
    image: 'https://images.jg-cdn.com/image/12006ccb-151c-46c4-8e2a-fc0949638a3d.png',
    description:
      'The first ever GameBlast event, and the year we switched from supporting GamesAid to SpecialEffect exclusively!',
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldathonuk-gameblast-2014',
    facebookUrl: '',
    tiltifyUrl: '',
  },
  {
    status: '2012 ZeldaGamesAid2',
    date: '08/04/2013 13:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: '',
    image: 'https://pbs.twimg.com/media/FKRi0EVXEAgCudD?format=jpg&name=large',
    description:
      "ZeldaGamesAid #2 took place in Bournemouth University's main entrance. We played through several titles from The Legend of Zelda video game franchise — most memorably The Legend of Zelda: Four Swords Adventures on five massive screens all connected to five GameBoy Advance Players, connected to five GameCube consoles, it was nuts!",
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldagamesaid2',
    facebookUrl: '',
    tiltifyUrl: '',
  },
  {
    status: '2011 ZeldaGamesAid',
    date: '11/11/2011 09:00',
    icon: 'pi pi-check',
    color: '#62182F',
    src: 'https://www.youtube-nocookie.com/embed/fzaR4XW-068?list=PLgZcQdq1SEvihZA4Y8uVU2VJxBuGI3DBI',
    image: '',
    description:
      "The one that started it all! When Mike was in his first year at university he wanted to emulate the success of mariomarathon.com by running his own charity live stream and roped in a bunch of friends and fellow students to join. Keeping with Nintendo games we picked the Legend of Zelda franchise and instead of Child's Play we picked a UK based gaming charity GamesAid (gamesaid.org). Skyward Sword was releasing on the 18th so we began an 11-day long Zelda Marathon raising £1312 for the charity!",
    justGivingUrl: 'https://www.justgiving.com/fundraising/zeldamarathon',
    facebookUrl: '',
    tiltifyUrl: '',
  },
];

function yearsSince2011() {
  const start = moment(new Date(Date.parse('11 Nov 2011 09:00:00 GMT')));
  return Math.floor(moment.duration(moment().diff(start)).asYears());
}

export function History() {
  // Per-event shuffled accents — each historical event card paints
  // one of the four theme colours so the timeline reads as a
  // multi-colour ribbon down the page rather than every card sharing
  // the brand primary.
  const eventAccents = useAccentDeck(events.length);
  return (
    <div className="container p-3 min-vh-100 text-white text-center">
      <div className="my-3">
        <div className="mb-5 history-heading">
          <h1 className="text-uppercase history-heading-text">
            {yearsSince2011()} Years of
          </h1>
          <img
            src="/assets/img/brand/logo/Zeldathon-Logo-2026-Gold-Flash.svg"
            alt="ZeldathonUK"
            className="history-heading-logo"
          />
        </div>

        <p className="history-intro">
          Every Zelda marathon we've run for charity, all the way back to where it
          started in 2011.
        </p>

        <ul className="zth-timeline">
          {events.map((ev, i) => {
            // The first row is the upcoming / most-recent event; subsequent
            // rows are historical. Tint via the theme palette rather than
            // the per-event hardcoded colour so the marker dots follow the
            // active theme.
            const isCurrent = i === 0;
            return (
            <li
              key={ev.status}
              className={`zth-timeline-item ${i % 2 ? 'right' : 'left'}`}
              data-accent={eventAccents[i]}
            >
              <span
                className={`zth-timeline-marker ${isCurrent ? 'is-current' : 'is-past'}`}
              >
                <FontAwesomeIcon icon={isCurrent ? faStar : faCheck} />
              </span>
              <div className="zth-timeline-card text-start">
                <div className="zth-card-header">
                  <h5 className="zth-card-title mb-0">{ev.status}</h5>
                  <span className="zth-card-date">
                    {moment(ev.date, 'DD/MM/YYYY HH:mm').format('D MMM YYYY')}
                  </span>
                </div>
                <div className="zth-card-media">
                  {ev.image ? (
                    <img src={ev.image} alt={ev.status} className="w-100" />
                  ) : ev.src ? (
                    <iframe
                      title={ev.status}
                      src={ev.src}
                      width="100%"
                      height="285"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : null}
                </div>
                <div className="p-3">
                  <p>{ev.description}</p>
                  <div className="history-fundraiser-links">
                    {ev.facebookUrl && (
                      <a
                        className="history-fundraiser-link"
                        href={ev.facebookUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                        <span>Facebook Fundraiser</span>
                      </a>
                    )}
                    {ev.tiltifyUrl && (
                      <a
                        className="history-fundraiser-link"
                        href={ev.tiltifyUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                        <span>Tiltify Page</span>
                      </a>
                    )}
                    {ev.justGivingUrl && (
                      <a
                        className="history-fundraiser-link"
                        href={ev.justGivingUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} />
                        <span>JustGiving Page</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
