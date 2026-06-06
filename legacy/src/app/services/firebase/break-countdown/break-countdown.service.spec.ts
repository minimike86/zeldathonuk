import { TestBed } from '@angular/core/testing';

import { BreakCountdownService } from './break-countdown.service';

describe('BreakCountdownService', () => {
  let service: BreakCountdownService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BreakCountdownService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
