
export interface DonationIncentive {
  name: string;
  type: string;
  typeColour: string;
  constraint: string;
  constraintColour: string;
  imageUrl: string;
  description: string;
  donationAmount: number;
}

export interface Prize {
  name: string;
  imageUrl: string;
  description: string;
  quantity: number;
  won: boolean;
}
