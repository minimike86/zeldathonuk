import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBullhorn,
  faChartColumn,
  faComments,
  faGift,
} from '@fortawesome/free-solid-svg-icons';
import { obsApi, usePolledQuery } from '@/lib/obsApi';
import {
  ChatAnnouncementsEditor,
  RecurringMessagesEditor,
  TwitchBroadcastForm,
} from './twitchEditors';
import { PredictionsPanel } from './Predictions';
import { ShoutoutsPanel } from './Shoutouts';
import { RewardsPanel } from './Rewards';

const TABS = [
  { key: 'chat', label: 'Chat', icon: faComments },
  { key: 'predictions', label: 'Predictions', icon: faChartColumn },
  { key: 'shoutouts', label: 'Shoutouts', icon: faBullhorn },
  { key: 'rewards', label: 'Rewards', icon: faGift },
];

export function TwitchControl() {
  const [tab, setTab] = useState('chat');
  // The config tabs (Chat) operate on the active event; the others poll it
  // themselves.
  const { data: event } = usePolledQuery(obsApi.activeEvent, 10_000);

  return (
    <div className="control-card">
      <h2 className="m-0">Twitch</h2>
      <div className="btn-group mt-3 flex-wrap" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-sm ${tab === t.key ? 'btn-bloodmoon' : 'btn-outline-light'}`}
            onClick={() => setTab(t.key)}
          >
            <FontAwesomeIcon icon={t.icon} fixedWidth /> {t.label}
          </button>
        ))}
      </div>

      <div className="pt-3">
        {tab === 'chat' &&
          (event ? (
            <>
              <TwitchBroadcastForm event={event} />
              <ChatAnnouncementsEditor event={event} />
              <RecurringMessagesEditor event={event} />
            </>
          ) : (
            <p className="text-warning">No active event — activate one first.</p>
          ))}
        {tab === 'predictions' && <PredictionsPanel />}
        {tab === 'shoutouts' && <ShoutoutsPanel />}
        {tab === 'rewards' && <RewardsPanel />}
      </div>
    </div>
  );
}
