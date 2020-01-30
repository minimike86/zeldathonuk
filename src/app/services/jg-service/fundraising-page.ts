interface FundraisingPageDetails {
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
  fundraisingTarget: number;
  totalRaisedPercentageOfFundraisingTarget: number;
  totalRaisedOffline: number;
  totalRaisedOnline: number;
  totalRaisedSms: number;
  totalEstimatedGiftAid: number;
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

interface FundraisingPageDonations {
  donations: Donation[];
  pageShortName: string;
  pagination: Pagination;
}

interface Donation {
  amount: string;
  currencyCode: string;
  donationDate: string;
  donationRef: string;
  donorDisplayName: string;
  donorLocalAmount: string;
  donorLocalCurrencyCode: string;
  donorRealName: string;
  estimatedTaxReclaim: number;
  id: number;
  image: string;
  message: string;
  source: string;
  status: string;
  thirdPartyReference: string;
  charityId: number;
}

interface Pagination {
  pageNumber: number;
  pageSizeRequested: number;
  pageSizeReturned: number;
  totalPages: number;
  totalResults: number;
}

interface JgImage {
  caption: string;
  url: string;
  absoluteUrl: string;
}

interface JgVideo {
  caption: string;
  url: string;
}

interface JgTeam {
  teamShortName: string;
  teamGuid: null;
}
