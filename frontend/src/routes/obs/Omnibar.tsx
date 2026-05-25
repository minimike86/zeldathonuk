import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import './omnibar.css';

type Card = { kind: 'cta' | 'up-next' | 'donation' | 'plea'; node: React.ReactNode };

/**
 * Bottom-of-screen ticker. Rotates between: call-to-action, up-next game,
 * a recent donation, and a donation plea.
 */
export function Omnibar() {
  const { data: cp } = usePolledQuery(obsApi.currentlyPlaying, 3000);
  const { data: schedule } = usePolledQuery(
    () =>
      obsApi.activeEvent().then((e) => (e ? obsApi.schedule(e.id) : Promise.resolve([]))),
    5000,
  );
  const { data: donations } = usePolledQuery(obsApi.donations, 5000);
  const { data: totals } = usePolledQuery(obsApi.donationTotals, 5000);

  const currentEntry = cp?.schedule_entry_detail ?? null;
  const upNext =
    schedule && currentEntry
      ? schedule.find((s) => s.order === currentEntry.order + 1)
      : schedule?.find((s) => !s.is_completed) ?? null;
  const lastDonation = donations?.[0];

  const cards: Card[] = [
    {
      kind: 'cta',
      node: (
        <>
          <span className="ob-label">DONATE</span>
          <span className="ob-text">
            Support{' '}
            <strong>SpecialEffect</strong> — every penny goes straight to the charity
          </span>
        </>
      ),
    },
    {
      kind: 'up-next',
      node: upNext ? (
        <>
          <span className="ob-label">UP NEXT</span>
          <span className="ob-text">
            <strong>{upNext.game.title}</strong>{' '}
            {upNext.runners.length > 0 && (
              <> with {upNext.runners.map((r) => r.name).join(', ')}</>
            )}
          </span>
        </>
      ) : (
        <span className="ob-text">Check the schedule for what's coming up</span>
      ),
    },
    {
      kind: 'donation',
      node: lastDonation ? (
        <>
          <span className="ob-label">LATEST</span>
          <span className="ob-text">
            <strong>{lastDonation.donor_name}</strong> donated{' '}
            <strong>
              {lastDonation.currency} {lastDonation.amount}
            </strong>
            {lastDonation.message && ` — "${lastDonation.message}"`}
          </span>
        </>
      ) : (
        <span className="ob-text">Be the first to donate!</span>
      ),
    },
    {
      kind: 'plea',
      node: (
        <>
          <span className="ob-label">TOTAL RAISED</span>
          <span className="ob-text">
            <strong>£{totals?.grand_total ?? '0.00'}</strong> across{' '}
            {totals?.donation_count ?? 0} donations
          </span>
        </>
      ),
    },
  ];

  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % cards.length);
    }, 8000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="omnibar">
      <div className="ob-inner" key={index}>
        {cards[index].node}
      </div>
    </div>
  );
}
