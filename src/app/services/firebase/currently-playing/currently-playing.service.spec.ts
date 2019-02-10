import { TestBed } from '@angular/core/testing';

import { CurrentlyPlayingService } from './currently-playing.service';

describe('CurrentlyPlayingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CurrentlyPlayingService = TestBed.get(CurrentlyPlayingService);
    expect(service).toBeTruthy();
  });
});
