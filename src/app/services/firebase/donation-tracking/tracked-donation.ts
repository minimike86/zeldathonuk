
export interface TrackedDonationId extends TrackedDonation {
  id: string;
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
