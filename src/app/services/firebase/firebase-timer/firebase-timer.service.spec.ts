import { TestBed } from '@angular/core/testing';

import { FirebaseTimerService } from './firebase-timer.service';

describe('FirebaseTimerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FirebaseTimerService = TestBed.get(FirebaseTimerService);
    expect(service).toBeTruthy();
  });
});
