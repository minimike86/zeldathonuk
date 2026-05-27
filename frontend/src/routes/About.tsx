import { useEffect, useState } from 'react';
import { Link } from 'react-router';
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

export function About() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div className="container p-3 min-vh-100 text-center text-white">
      <div className="my-3">
        <div className="mb-5 about-heading">
          <h1 className="text-bloodmoon text-uppercase about-heading-text">
            About
          </h1>
          <img
            src="/assets/img/Zeldathon-Logo-2026-Gold-Flash.svg"
            alt="ZeldathonUK"
            className="about-heading-logo"
          />
        </div>

        <div
          className="my-3 position-relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="carousel-caption position-absolute top-0 start-50 translate-middle-x mt-3">
            <h3>{alts[index]}</h3>
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
          <div className="d-flex justify-content-center gap-2 mt-3">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Slide ${i + 1}`}
                style={{
                  width: 24,
                  height: 4,
                  border: 0,
                  background: i === index ? '#fff' : 'rgba(255,255,255,0.35)',
                  cursor: 'pointer',
                }}
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
                    <ul className="mb-0">
                      <li>
                        Zeldathon (USA){' '}
                        <a
                          className="link-danger"
                          href="https://zeldathon.com/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          zeldathon.com
                        </a>
                      </li>
                      <li>
                        Zelda Dungeon (USA){' '}
                        <a
                          className="link-danger"
                          href="https://www.zeldadungeon.net/category/zelda-dungeon-marathon/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          zeldadungeon.net
                        </a>
                      </li>
                      <li>
                        Zelda Speed Runs (USA){' '}
                        <a
                          className="link-danger"
                          href="https://www.zeldaspeedruns.com/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          zeldaspeedruns.com
                        </a>
                      </li>
                      <li>
                        Rupeethon (USA){' '}
                        <a
                          className="link-danger"
                          href="http://rupeethon.org/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          rupeethon.org
                        </a>
                      </li>
                      <li>
                        Hyrule Hustlers (USA){' '}
                        <a
                          className="link-danger"
                          href="https://twitter.com/hyrulehustlers"
                          target="_blank"
                          rel="noreferrer"
                        >
                          twitter.com/hyrulehustlers
                        </a>
                      </li>
                      <li>
                        Zeldathon (France){' '}
                        <a
                          className="link-danger"
                          href="https://zeldathon.fr/"
                          target="_blank"
                          rel="noreferrer"
                        >
                          zeldathon.fr
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </Faq>

              <Faq question="When is the next marathon?">
                25<sup>th</sup>-27<sup>th</sup> February 2022 for{' '}
                <Link className="link-warning" to="/charity">
                  SpecialEffect's #GameBlast22
                </Link>
                .
                <p className="mt-2 mb-0">
                  <strong>Pro-tip:</strong> Add the event to your calendar:
                </p>
                <ul>
                  <li>
                    <a
                      className="link-danger"
                      href="https://discord.com/invite/9eW9USX3KY?event=919648764032065546"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Discord Event
                    </a>
                  </li>
                  <li>
                    <a
                      className="link-danger"
                      href="https://www.facebook.com/events/1840159519515239/?ref=newsfeed"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Facebook Event
                    </a>
                  </li>
                  <li>
                    <a
                      className="link-danger"
                      href="https://www.twitch.tv/zeldathonuk/schedule"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Twitch Schedule
                    </a>
                  </li>
                </ul>
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
                  className="link-danger"
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
      <div className="text-start w-25">{question}</div>
      <div className="text-start w-75 ms-5">{children}</div>
    </div>
  );
}
