import { TestBed } from '@angular/core/testing';

import { TiltifyService } from './tiltify.service';

describe('TiltifyServiceService', () => {
  let service: TiltifyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TiltifyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
