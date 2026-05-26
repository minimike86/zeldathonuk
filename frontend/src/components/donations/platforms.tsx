import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faCircleDollarToSlot, faTv } from '@fortawesome/free-solid-svg-icons';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';
import type { DonationPlatformKey } from '@/lib/obsApi';

/**
 * Per-platform visual metadata. Per-event URLs (donate URL, fees URL, gift-aid
 * URL, fee warning text) live on the `DonationPage` model — this file only
 * supplies the icon and any colour we want next to the platform badge.
 */
export interface PlatformMeta {
  label: string;
  icon: ReactNode;
}

function brandImage(src: string, alt: string): ReactNode {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: '1.1em', height: '1.1em', objectFit: 'contain', filter: 'brightness(10)' }}
    />
  );
}

export const PLATFORM_META: Record<DonationPlatformKey, PlatformMeta> = {
  facebook: { label: 'Facebook', icon: <FontAwesomeIcon icon={faFacebook} /> },
  tiltify: { label: 'Tiltify', icon: brandImage('/assets/img/Tiltify_Logo.png', 'Tiltify') },
  justgiving: {
    label: 'JustGiving',
    icon: brandImage('/assets/img/justgiving-g.svg', 'JustGiving'),
  },
  twitch: { label: 'Twitch Charity', icon: <FontAwesomeIcon icon={faTv} /> },
  paypal: { label: 'PayPal', icon: <FontAwesomeIcon icon={faPaypal} /> },
  direct: { label: 'Direct', icon: <FontAwesomeIcon icon={faCircleDollarToSlot} /> },
  other: { label: 'Other', icon: <FontAwesomeIcon icon={faCircleDollarToSlot} /> },
};
