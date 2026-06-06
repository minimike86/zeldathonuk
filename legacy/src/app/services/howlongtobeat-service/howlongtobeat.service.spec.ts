import { TestBed } from '@angular/core/testing';

import { HowLongToBeatService } from './howlongtobeat.service';

describe('HowlongtobeatService', () => {
  let service: HowLongToBeatService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HowLongToBeatService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
