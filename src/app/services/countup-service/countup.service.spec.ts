import { TestBed } from '@angular/core/testing';

import { CountupService } from './countup.service';

describe('CountupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CountupService = TestBed.get(CountupService);
    expect(service).toBeTruthy();
  });
});
