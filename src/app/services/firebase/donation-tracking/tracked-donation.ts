
export interface TrackedDonationId extends TrackedDonation {
  id: string;
}

export interface TrackedDonation {
  name: string;
  imgUrl: string | null;
  message: string | null;
  currency: string;
  donationAmount: number;
  giftAidAmount: number | null;
  donationSource: string;
  donationDate: Date;
}
