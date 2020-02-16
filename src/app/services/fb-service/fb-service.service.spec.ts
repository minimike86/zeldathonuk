import { TestBed } from '@angular/core/testing';

import { FbService } from './fb-service.service';

describe('FbService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FbService = TestBed.get(FbService);
    expect(service).toBeTruthy();
  });
});
