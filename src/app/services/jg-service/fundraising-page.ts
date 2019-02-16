interface FundraisingPageDetails {
  pageId: number,
  pageTitle: string,
  pageStatus: string,
  pageShortName: string,
  raisedAmount: number,
  designId: number,
  companyAppealId: number,
  targetAmount: number,
  offlineDonations: number,
  totalRaisedOnline: number,
  giftAidPlusSupplement: number,
  pageImages: string[],
  images: JgImage[],
  eventName: string,
  eventId: number,
  domain: string,
  inMemoryPerson: InMemoryPerson[],
  currencyCode: string,
  currencySymbol: string,
  createdDate: string,
  smsCode: string,
  charityId: number
}

interface FundraisingPageDonations {
  donations: Donation[],
  pageShortName: string,
  pagination: Pagination
}

interface Donation {
  "amount": string,
  "currencyCode": string,
  "donationDate": string,
  "donationRef": string,
  "donorDisplayName": string,
  "donorLocalAmount": string,
  "donorLocalCurrencyCode": string,
  "donorRealName": string,
  "estimatedTaxReclaim": number,
  "id": number,
  "image": string,
  "message": string,
  "source": string,
  "status": string,
  "thirdPartyReference": string,
  "charityId": number
}

interface Pagination {
  pageNumber: number,
  pageSizeRequested: number,
  pageSizeReturned: number,
  totalPages: number,
  totalResults: number
}

interface JgImage {
  caption: string,
  url: string,
  absoluteUrl: string
}

interface InMemoryPerson {
  FirstName: string,
  LastName: string,
  dateOfBirth: string,
  dateOfDeath: string
}
