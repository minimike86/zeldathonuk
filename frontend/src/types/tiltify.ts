// Ported from legacy/src/app/services/tiltify-service/tiltify.service.ts

export interface TiltifyAvatar {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface TiltifyCampaign {
  meta: { status: number };
  data: {
    id: number;
    name: string;
    slug: string;
    url: string;
    startsAt: number;
    endsAt: number;
    description: string;
    avatar: TiltifyAvatar;
    causeId: number;
    fundraisingEventId: number;
    fundraiserGoalAmount: number;
    originalGoalAmount: number;
    amountRaised: number;
    supportingAmountRaised: number;
    totalAmountRaised: number;
    supportable: boolean;
    status: string;
    user: {
      id: number;
      username: string;
      slug: string;
      url: string;
      avatar: TiltifyAvatar;
    };
    team: {
      id: number;
      username: string;
      slug: string;
      url: string;
      avatar: TiltifyAvatar;
    };
    livestream: {
      type: string;
      channel: string;
    };
  };
}

export interface TiltifyCampaignDonation {
  id: number;
  amount: number;
  name: string;
  comment: string;
  completedAt: number;
  rewardId?: number;
}

export interface TiltifyCampaignDonations {
  meta: { status: number };
  data: TiltifyCampaignDonation[];
  links: { prev: string; next: string; self: string };
}
