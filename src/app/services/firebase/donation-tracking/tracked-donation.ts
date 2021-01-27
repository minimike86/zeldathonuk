export interface TrackedDonationId extends TrackedDonationArray {
  id: string;
}

export interface TrackedDonationArray {
  donations: TrackedDonation[];
}

export interface TrackedDonation {
  name: string;
  imgUrl?: string;
  message?: string;
  currency: string;
  donationAmount: number;
  giftAidAmount?: number;
  donationSource: string;
  donationDate: Date;
}
