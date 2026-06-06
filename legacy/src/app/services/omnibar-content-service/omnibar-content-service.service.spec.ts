import { TestBed } from '@angular/core/testing';

import { OmnibarContentServiceService } from './omnibar-content-service.service';

describe('OmnibarContentServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OmnibarContentServiceService = TestBed.get(OmnibarContentServiceService);
    expect(service).toBeTruthy();
  });
});
