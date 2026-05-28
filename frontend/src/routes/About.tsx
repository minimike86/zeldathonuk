import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import type { EventModel } from '@/lib/obsApi';
import './about.css';

const images = [
  'https://images.justgiving.com/image/292f8261-199e-439a-847a-a5f4ad270b07.jpg',
  'https://images.justgiving.com/image/9d54ff22-3185-4a7b-812a-66df7c774ce6.jpg',
  'https://news.bournemouth.ac.uk/wp-content/uploads/2013/05/Zelda.jpg',
  'https://www.bournemouthecho.co.uk/resources/images/9466146.jpg',
];
const alts = ['2011', '2011', '2012', '2019'];
const urls = [
  'https://www.bournemouthecho.co.uk/news/9390449.gamers-raise-funds-for-charity-with-zelda-marathon/',
  'https://www.bournemouthecho.co.uk/news/9390449.gamers-raise-funds-for-charity-with-zelda-marathon/',
  'https://assets.bournemouth.ac.uk/news-archive/newsandevents/News/2013/apr/contentonly_1_8925_8925.html',
  'https://www.bournemouthecho.co.uk/news/17444417.zeldathonuk-play-legend-zelda-specialeffect/',
];

/** Sister Zelda marathons around the world, surfaced in the FAQ. */
const WORLDWIDE_MARATHONS = [
  { name: 'Zeldathon', country: 'USA', label: 'zeldathon.com', href: 'https://zeldathon.com/' },
  {
    name: 'Zelda Dungeon',
    country: 'USA',
    label: 'zeldadungeon.net',
    href: 'https://www.zeldadungeon.net/category/zelda-dungeon-marathon/',
  },
  {
    name: 'Zelda Speed Runs',
    country: 'USA',
    label: 'zeldaspeedruns.com',
    href: 'https://www.zeldaspeedruns.com/',
  },
  { name: 'Rupeethon', country: 'USA', label: 'rupeethon.org', href: 'http://rupeethon.org/' },
  {
    name: 'Hyrule Hustlers',
    country: 'USA',
    label: 'twitter.com/hyrulehustlers',
    href: 'https://twitter.com/hyrulehustlers',
  },
  { name: 'Zeldathon', country: 'France', label: 'zeldathon.fr', href: 'https://zeldathon.fr/' },
];

export function About() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const { data: event } = usePolledQuery(obsApi.activeEvent, 30_000);
  const twitchChannel = event?.twitch_channel || 'zeldathonuk';

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  const prevSlide = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const nextSlide = () => setIndex((i) => (i + 1) % images.length);

  return (
    <div className="container p-3 min-vh-100 text-center text-white">
      <div className="my-3">
        <div className="mb-5 about-heading">
          <h1 className="text-uppercase about-heading-text">
            About
          </h1>
          <img
            src="/assets/img/brand/logo/Zeldathon-Logo-2026-Gold-Flash.svg"
            alt="ZeldathonUK"
            className="about-heading-logo"
          />
        </div>

        <div
          className="my-3 position-relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="about-carousel-stage position-relative">
            <div className="position-absolute top-0 start-50 translate-middle-x mt-3 z-1">
              <span className="about-carousel-year">{alts[index]}</span>
            </div>
            <a href={urls[index]} target="_blank" rel="nofollow noopener noreferrer">
              <div className="picsum-img-wrapper">
                <img
                  src={images[index]}
                  alt={alts[index]}
                  className="about-carousel-img"
                  style={{ maxHeight: 200 }}
                />
              </div>
            </a>
            <button
              type="button"
              className="about-carousel-arrow about-carousel-arrow--prev"
              onClick={prevSlide}
              aria-label="Previous slide"
            >
              ❮
            </button>
            <button
              type="button"
              className="about-carousel-arrow about-carousel-arrow--next"
              onClick={nextSlide}
              aria-label="Next slide"
            >
              ❯
            </button>
          </div>
          <div className="d-flex justify-content-center gap-2 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                className={`about-carousel-dot${i === index ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="my-3">
          <div className="d-flex justify-content-center">
            <div className="w-75">
              <Faq question="What is Zeldathon?">
                Zeldathon is a group of Zelda fans, artists, musicians, streamers, and
                all-around good people coming together to have fun and raise money for
                charity!
                <div className="card bg-bloodmoon mt-4">
                  <div className="card-body" style={{ fontSize: '0.7em' }}>
                    <p className="mb-0 text-white-50">
                      We're based in the United Kingdom. There are other Zelda Marathons
                      run world-wide! Please check out these wonderful people as well:
                    </p>
                    <ul className="faq-marathon-list mt-3">
                      {WORLDWIDE_MARATHONS.map((m) => (
                        <li key={m.href}>
                          <span>
                            {m.name}{' '}
                            <span className="text-white-50">({m.country})</span>
                          </span>
                          <a
                            className="charity-link"
                            href={m.href}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {m.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Faq>

              <Faq question="When is the next marathon?">
                <NextMarathon event={event} twitchChannel={twitchChannel} />
              </Faq>

              <Faq question="How can I help support the cause?">
                Thank you in advance for supporting our mission. You can do any of the
                following to support what we do:
                <ul>
                  <li>Watch the stream</li>
                  <li>Spread the word on social media</li>
                  <li>Donate during an event</li>
                  <li>Donate art or prizes</li>
                  <li>Sponsor one of our events</li>
                </ul>
              </Faq>

              <Faq question="Where do my donations go?">
                Your donations are processed through either Facebook Fundraising,
                Tiltify, or JustGiving and go straight to the charity. Zeldathon does
                not touch a single penny, we just record the total donated.
              </Faq>

              <Faq question="When can I donate?">
                We usually open the donation pages a month or two before the stream and
                close donations one month after we stop streaming.
              </Faq>

              <Faq question="Can I ask more questions?">
                <a
                  className="charity-link"
                  href="https://t.co/hFFRHgJE0l"
                  target="_blank"
                  rel="noreferrer"
                >
                  Join us on Discord
                </a>{' '}
                to ask more questions and hang out with the team!
              </Faq>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Faq({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <div className="d-flex justify-content-around mb-5 faq-row">
      <div className="faq-question text-start w-25">{question}</div>
      <div className="faq-answer text-start w-75 ms-5">{children}</div>
    </div>
  );
}

// Marathons run over a weekend and the Event model has no end time, so we
// treat one as "live" for ~3 days after its start before calling it past.
const EVENT_LIVE_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

const eventDateFmt = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Answers "When is the next marathon?" from the active event rather than a
 *  hardcoded date — upcoming events show the date + primary charity, a
 *  currently-running event says so, and a past/absent event falls back to a
 *  "follow us" prompt. */
function NextMarathon({
  event,
  twitchChannel,
}: {
  event: EventModel | null | undefined;
  twitchChannel: string;
}) {
  const startsAt = event ? new Date(event.start_time) : null;
  const now = Date.now();
  const upcoming = !!startsAt && startsAt.getTime() > now;
  const live =
    !!startsAt && !upcoming && now - startsAt.getTime() < EVENT_LIVE_WINDOW_MS;

  if (!event || !startsAt || (!upcoming && !live)) {
    return (
      <>
        We don't have a date locked in for the next marathon just yet. Follow us on{' '}
        <a
          className="charity-link"
          href={`https://www.twitch.tv/${twitchChannel}`}
          target="_blank"
          rel="noreferrer"
        >
          Twitch
        </a>{' '}
        or{' '}
        <a
          className="charity-link"
          href="https://t.co/hFFRHgJE0l"
          target="_blank"
          rel="noreferrer"
        >
          Discord
        </a>{' '}
        to be the first to know when the next one is announced!
      </>
    );
  }

  const primary =
    event.event_charities.find((c) => c.is_primary) ?? event.event_charities[0];
  const charityName =
    primary?.charity_detail.short_name || primary?.charity_detail.name;
  const charityLink = charityName && (
    <>
      {' '}
      in aid of{' '}
      <Link className="charity-link" to="/charity">
        {charityName}
      </Link>
    </>
  );
  const dateStr = eventDateFmt.format(startsAt);

  if (live) {
    return (
      <>
        <strong>{event.name}</strong> is happening right now — we kicked off on{' '}
        {dateStr}
        {charityLink}.{' '}
        <a
          className="charity-link"
          href={`https://www.twitch.tv/${twitchChannel}`}
          target="_blank"
          rel="noreferrer"
        >
          Come and watch!
        </a>
      </>
    );
  }

  return (
    <>
      Our next marathon, <strong>{event.name}</strong>, kicks off on {dateStr}
      {charityLink}.
      <p className="mt-2 mb-0">
        <strong>Pro-tip:</strong> Add the event to your calendar:
      </p>
      <ul className="faq-link-list">
        <li>
          <a
            className="charity-link"
            href={`https://www.twitch.tv/${twitchChannel}/schedule`}
            target="_blank"
            rel="noreferrer"
          >
            Twitch Schedule
          </a>
        </li>
      </ul>
    </>
  );
}
