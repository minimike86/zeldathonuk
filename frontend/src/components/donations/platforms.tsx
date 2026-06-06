import type { ReactNode } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook } from '@fortawesome/free-brands-svg-icons';
import { faCircleDollarToSlot, faTv } from '@fortawesome/free-solid-svg-icons';
import { faPaypal } from '@fortawesome/free-brands-svg-icons';
import type { DonationPlatformKey } from '@/lib/obsApi';

/**
 * Per-platform fallback metadata. Logos are configured per platform on the
 * `DonationPlatformProfile` (denormalised onto each `DonationPage.logo_url`)
 * and the picker prefers those; the icons here are only used when a platform
 * has no logo set.
 */
export interface PlatformMeta {
  label: string;
  icon: ReactNode;
}

export const PLATFORM_META: Record<DonationPlatformKey, PlatformMeta> = {
  facebook: { label: 'Facebook', icon: <FontAwesomeIcon icon={faFacebook} /> },
  tiltify: { label: 'Tiltify', icon: <FontAwesomeIcon icon={faCircleDollarToSlot} /> },
  justgiving: { label: 'JustGiving', icon: <FontAwesomeIcon icon={faCircleDollarToSlot} /> },
  twitch: { label: 'Twitch Charity', icon: <FontAwesomeIcon icon={faTv} /> },
  paypal: { label: 'PayPal', icon: <FontAwesomeIcon icon={faPaypal} /> },
  direct: { label: 'Direct', icon: <FontAwesomeIcon icon={faCircleDollarToSlot} /> },
  other: { label: 'Other', icon: <FontAwesomeIcon icon={faCircleDollarToSlot} /> },
};
