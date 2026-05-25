import { useEffect, useState } from 'react';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import './tts.css';

/**
 * TTS overlay — reads incoming donation messages aloud via the browser's
 * Web Speech API. Polls the donations endpoint every 3s and speaks any new
 * donation messages not yet seen by this browser source.
 */
export function Tts() {
  const { data: donations } = usePolledQuery(obsApi.donations, 3000);
  const [seenIds, setSeenIds] = useState<Set<number>>(() => new Set());
  const [now, setNow] = useState<{ donor: string; amount: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (!donations) return;
    const fresh = donations.filter(
      (d) =>
        !seenIds.has(d.id) && d.message && d.message.trim().length > 0,
    );
    if (fresh.length === 0) return;

    const next = fresh[fresh.length - 1];
    setNow({ donor: next.donor_name, amount: next.amount, message: next.message });
    setSeenIds((prev) => {
      const merged = new Set(prev);
      donations.forEach((d) => merged.add(d.id));
      return merged;
    });

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(
        `${next.donor_name} donated ${next.amount}. ${next.message}`,
      );
      window.speechSynthesis.speak(u);
    }
  }, [donations, seenIds]);

  return (
    <div className="tts-stage">
      {now && (
        <div className="tts-card">
          <div className="tts-donor">{now.donor}</div>
          <div className="tts-amount">£{now.amount}</div>
          <div className="tts-message">"{now.message}"</div>
        </div>
      )}
    </div>
  );
}
