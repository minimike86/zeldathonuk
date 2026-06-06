import { TestBed } from '@angular/core/testing';

import { DonationTrackingService } from './donation-tracking.service';

describe('DonationTrackingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: DonationTrackingService = TestBed.get(DonationTrackingService);
    expect(service).toBeTruthy();
  });
});
