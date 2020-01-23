import { TestBed } from '@angular/core/testing';

import { GameLineupService } from './game-lineup.service';

describe('GameLineupService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GameLineupService = TestBed.get(GameLineupService);
    expect(service).toBeTruthy();
  });
});
