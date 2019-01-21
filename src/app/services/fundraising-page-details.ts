export interface FundraisingPageDetails {
  
  pageId: number,
  activityCharityCreated: boolean,
  activityType: string,
  activityId: string,
  attribution: string,
  eventName: string,
  eventId: number,
  currencySymbol: string,
  currencyCode: string,
  pageShortName: string,
  image: {
    caption: string,
      url: string,
      absoluteUrl: string
  },
  imageCount: string,
  status: string,
  owner: string,
  ownerProfileImageUrls: {
    OriginalSize: string,
      Size150x150Face: string
  },
  consumerId: number,
  title: string,
  showEventDate: string,
  eventDate: string,
  showExpiryDate: string,
  expiryDate: string,
  fundraisingTarget: string,
  totalRaisedPercentageOfFundraisingTarget: string,
  totalRaisedOffline: string,
  totalRaisedOnline: string,
  totalRaisedSms: string,
  grandTotalRaisedExcludingGiftAid: string,
  totalEstimatedGiftAid: string,
  branding: {
    buttonColour: string,
      buttonTextColour: string,
      headerTextColour: string,
      thermometerBackgroundColour: string,
      thermometerFillColour: string,
      thermometerTextColour: string
  },
  charity: {
    id: number,
      name: string,
      description: string,
      logoUrl: string,
      logoAbsoluteUrl: string,
      profilePageUrl: string,
      registrationNumber: string
  },
  media: {
    images: any[],
      videos: [
      {
        caption: string,
        url: string
      }
    ]
  },
  story: string,
  domain: string,
  smsCode: string,
  companyAppealId: number,
  rememberedPersonSummary: null,
  pageSummaryWhat: null,
  pageSummaryWhy: null,
  teams: any[],
  pageSummary: string
  
}
