import { useRef } from 'react';
import type { DonationIncentive, Prize } from '@/types/game';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import './incentives.css';

function buildDonationIncentives(twitchChannel: string): DonationIncentive[] {
  const channelHref = `https://www.twitch.tv/${twitchChannel}/`;
  const link = (label: string) =>
    `<a href="${channelHref}" class="bg-dark text-success font-weight-bold px-1">${label}</a>`;
  return [
    {
      name: 'Twitch Viewership',
      type: 'Audience',
      typeColour: 'bg-success',
      constraint: '',
      constraintColour: '',
      imageSrcUrl: '/assets/img/challenges/twitch-views.jpg',
      imageHrefUrl: '/assets/img/challenges/twitch-views.jpg',
      description:
        `${link('Raid')}, ${link('Host')}, ${link('Share')}, and ${link('Watch')} ` +
        'the stream is the best thing you can do to support us! More views = more donations for ' +
        '<a href="https://www.specialeffect.org.uk/what-we-do" target="_blank" class="bg-dark text-light font-weight-bold px-1">SpecialEffect</a>',
      donationAmount: 0,
    },
  {
    name: 'EXERCISE',
    type: 'ZeldathonUK Team',
    typeColour: 'bg-success',
    constraint: '',
    constraintColour: '',
    imageSrcUrl: '/assets/img/challenges/exercise.jpg',
    imageHrefUrl: '/assets/img/challenges/exercise.jpg',
    description:
      '<span class="bg-dark text-success font-weight-bold px-1">Donate £20</span> and you can request that one of us has to exercise. Push-ups, sit-ups, we have even done ' +
      '<a class="bg-dark text-white font-weight-bold px-1" href="https://clips.twitch.tv/SolidFamousLaptopOSsloth" target="_blank">backflips</a> in the past!',
    donationAmount: 20,
  },
  {
    name: 'Commission Henry',
    type: 'Henry',
    typeColour: 'bg-success',
    constraint: "When Henry's On-stream",
    constraintColour: 'bg-warning',
    imageSrcUrl: '/assets/img/challenges/majoras-mask-pen.jpg',
    imageHrefUrl: '/assets/img/challenges/majoras-mask-pen.jpg',
    description:
      '<span class="bg-dark text-success font-weight-bold px-1">Donate £50</span> and you can commission some beautiful artwork from Heennnrrrryyyyyyyyy!',
    donationAmount: 50,
  },
  ];
}

const prizes: Prize[] = [
  {
    name: 'Wind Waker Master Sword',
    description:
      '<a href="https://www.twitch.tv/msec" target="_blank" class="bg-dark text-warning font-weight-bold px-1">msec</a> ' +
      'has 3D printed this full size Master Sword (Wind Waker version) that could be yours!',
    imageUrl: '/assets/img/prizes/84801418_2741328955947748_8136095740112928768_o.jpg',
    quantity: 1,
    won: false,
  },
  {
    name: 'Breath of the Wild Hylian Shield',
    description:
      '<a href="https://www.twitch.tv/msec" target="_blank" class="bg-dark text-warning font-weight-bold px-1">msec</a> ' +
      'has 3D printed this full size Hylian Shield (Breath of the Wild) that could be yours!',
    imageUrl:
      'https://cdn.thingiverse.com/renders/a7/1d/83/b6/c0/eb00f376e15185996e15bf09787d211b_preview_featured.jpg',
    quantity: 1,
    won: false,
  },
  {
    name: 'Wind Waker Baton',
    description:
      '<a href="https://www.twitch.tv/msec" target="_blank" class="bg-dark text-warning font-weight-bold px-1">msec</a> ' +
      'has 3D printed this full size Wind Waker baton that could be yours!',
    imageUrl: '/assets/img/prizes/84537730_2742128679201109_6921051424809811968_o.jpg',
    quantity: 5,
    won: false,
  },
  {
    name: 'Ocarina of Time 3DS Flute',
    description:
      '<a href="https://www.nintendo.co.uk/" target="_blank" class="bg-dark text-danger font-weight-bold px-1">Nintendo UK</a> ' +
      'have given us thirty Legend of Zelda promotional items for our prize winners to win!',
    imageUrl: '/assets/img/prizes/s-l300.jpg',
    quantity: 30,
    won: false,
  },
];

const currency = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
  minimumFractionDigits: 2,
});

export function Incentives() {
  const activitiesRef = useRef<HTMLSpanElement | null>(null);
  const raffleRef = useRef<HTMLSpanElement | null>(null);
  const { data: event } = usePolledQuery(obsApi.activeEvent, 30_000);
  const twitchChannel = event?.twitch_channel || 'zeldathonuk';
  const donationIncentives = buildDonationIncentives(twitchChannel);

  const scrollTo = (ref: React.RefObject<HTMLSpanElement | null>) => {
    setTimeout(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'start' });
    }, 100);
  };

  return (
    <div className="container p-3 min-vh-100 text-white text-center">
      <div className="my-3">
        <div className="mb-5">
          <h1 className="text-bloodmoon">Incentives For Donors</h1>
          <p className="text-light mt-2">
            We have a number of donor incentives to help inspire and motivate more
            people to start donating, give larger donations than they normally would,
            and engage long-term with our chosen charity.
          </p>
          <div className="d-flex justify-content-around">
            <a
              className="btn btn-bloodmoon p-3 px-5"
              onClick={() => scrollTo(activitiesRef)}
            >
              Activities / Challenges
            </a>
            <a
              className="btn btn-bloodmoon p-3 px-5"
              onClick={() => scrollTo(raffleRef)}
            >
              Raffle Prizes
            </a>
          </div>
        </div>

        <div className="border-bottom border-light">&nbsp;</div>

        <h2 className="text-bloodmoon mt-4">Activities / Challenges</h2>
        <h6 className="text-white mb-3">
          Activities and challenges are designed to help you get us to DO something
        </h6>
        <div className="d-flex my-2 flex-wrap">
          <div className="d-inline-flex flex-fill flex-wrap">
            {donationIncentives.map((incentive) => (
              <div
                key={incentive.name}
                className="card text-white bg-bloodmoon w-25 me-2 mb-3"
              >
                <div className="card-header">
                  <h5>{incentive.name}</h5>
                  <span className={`badge me-1 ${incentive.typeColour}`}>
                    {incentive.type}
                  </span>
                  {incentive.constraint && (
                    <span className={`badge ${incentive.constraintColour}`}>
                      {incentive.constraint}
                    </span>
                  )}
                </div>
                <a href={incentive.imageHrefUrl} target="_blank" rel="noreferrer">
                  <img
                    className="card-img"
                    style={{ height: 120, objectFit: 'cover' }}
                    alt={incentive.name}
                    src={incentive.imageSrcUrl}
                  />
                </a>
                <div
                  className="card-body"
                  dangerouslySetInnerHTML={{ __html: incentive.description }}
                />
                <div className="card-footer small">
                  Donate:{' '}
                  <b>{currency.format(incentive.donationAmount)}</b>
                </div>
              </div>
            ))}
          </div>
        </div>

        <span ref={activitiesRef} />

        <div className="border-bottom border-light">&nbsp;</div>

        <h2 className="text-bloodmoon mt-4">Raffle Prizes</h2>
        <h6 className="text-white mb-3">
          We will be raffling off all these prizes in exchange for your participation.
          E.g.: donating, raiding or hosting the stream, sharing the stream and
          otherwise just getting involved in the chat. These will be announced on
          stream when the raffles are active throughout the Zelda marathon so stay
          tuned in to win!
        </h6>
        <div className="d-flex my-2 flex-wrap">
          <div className="d-inline-flex flex-fill flex-wrap">
            {prizes.map((prize) => (
              <div
                key={prize.name}
                className="card text-white bg-bloodmoon w-25 me-2 mb-3"
              >
                <div className="card-header">{prize.name}</div>
                <div className="d-flex justify-content-center" style={{ height: 250 }}>
                  <img
                    className="card-img align-self-center"
                    style={{ maxHeight: 250 }}
                    alt={prize.name}
                    src={prize.imageUrl}
                  />
                </div>
                <div
                  className="card-body"
                  dangerouslySetInnerHTML={{ __html: prize.description }}
                />
                <div className="card-footer small">
                  <div className="d-flex justify-content-between">
                    <div>
                      Quantity: <b>{prize.quantity}</b>
                    </div>
                    {prize.won && (
                      <div>
                        <span className="badge bg-success p-1">WON</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <span ref={raffleRef} />
      </div>
    </div>
  );
}
