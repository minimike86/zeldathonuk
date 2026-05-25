import { TestBed } from '@angular/core/testing';

import { GameItemService } from './game.service';

describe('GameService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GameItemService = TestBed.get(GameItemService);
    expect(service).toBeTruthy();
  });
});
