import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;

export interface TrackedDonationId extends TrackedDonationArray {
  id: string;
}

export interface TrackedDonationArray {
  donations: TrackedDonation[];
}

export interface HighlightedDonationId extends HighlightedDonation {
  id: string;
}
export interface HighlightedDonation {
  donation: TrackedDonation;
  show: boolean;
}

export interface TrackedDonation {
  id: string|number;
  name: string;
  imgUrl?: string;
  message?: string;
  currency: string;
  donationAmount: number;
  giftAidAmount?: number;
  donationSource: string;
  donationDate: Timestamp;
}
