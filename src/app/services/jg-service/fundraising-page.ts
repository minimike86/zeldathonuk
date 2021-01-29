export interface FundraisingPageDetails {
  pageId: number;
  activityCharityCreated: false;
  activityType: string;
  activityId: number;
  eventName: string;
  eventId: number;
  currencySymbol: string;
  image: JgImage;
  status: string;
  owner: string;
  ownerProfileImageUrls: {
    OriginalSize: string;
    Size150x150Face: string;
  };
  title: string;
  showEventDate: boolean;
  eventDate: Date;
  showExpiryDate: boolean;
  fundraisingTarget: string;
  totalRaisedPercentageOfFundraisingTarget: string;
  totalRaisedOffline: string;
  totalRaisedOnline: string;
  totalRaisedSms: string;
  totalEstimatedGiftAid: string;
  grandTotalRaisedExcludingGiftAid: string;
  branding: {
    buttonColour: number;
    buttonTextColour: string;
    headerTextColour: string;
    thermometerBackgroundColour: string;
    thermometerFillColour: string;
    thermometerTextColour: string;
  };
  charity: {
    id: number;
    name: string;
    description: string;
    logoUrl: string;
    logoAbsoluteUrl: string;
    profilePageUrl: string;
    registrationNumber: number;
  };
  media: {
    images: JgImage[];
    videos: JgVideo[];
  };
  story: string;
  domain: string;
  smsCode: string;
  companyAppealId: number;
  rememberedPersonSummary: string;
  pageSummaryWhat: string;
  pageSummaryWhy: string;
  teams: JgTeam[];
  pageSummary: string;
  pageGuid: string;
}

export interface FundraisingPageDonations {
  id?: string;
  donations: JustGivingDonation[];
  pageShortName: string;
  pagination: Pagination;
}

export interface JustGivingDonation {
  amount: string | number;
  currencyCode: string;
  donationDate: string;
  donationRef: string;
  donorDisplayName: string;
  donorLocalAmount: string | number;
  donorLocalCurrencyCode: string;
  donorRealName?: string;
  estimatedTaxReclaim: string | number;
  id: string | number;
  image: string;
  message: string;
  source: string;
  status?: string;
  thirdPartyReference: string;
  charityId: string | number;
}

export interface Pagination {
  pageNumber: number;
  pageSizeRequested: number;
  pageSizeReturned: number;
  totalPages: number;
  totalResults: number;
}

export interface JgImage {
  caption: string;
  url: string;
  absoluteUrl: string;
}

export interface JgVideo {
  caption: string;
  url: string;
}

export interface JgTeam {
  teamShortName: string;
  teamGuid: null;
}
