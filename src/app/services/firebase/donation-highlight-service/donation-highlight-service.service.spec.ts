import { TestBed } from '@angular/core/testing';

import { DonationHighlightService } from './donation-highlight-service.service';

describe('DonationHighlightServiceService', () => {
  let service: DonationHighlightService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DonationHighlightService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
