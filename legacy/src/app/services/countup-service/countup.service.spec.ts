import { TestBed } from '@angular/core/testing';

import { CountUpService } from './countup.service';

describe('CountUpService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CountUpService = TestBed.get(CountUpService);
    expect(service).toBeTruthy();
  });
});
