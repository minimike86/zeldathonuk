import { TestBed } from '@angular/core/testing';

import { FbServiceService } from './fb-service.service';

describe('FbServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FbServiceService = TestBed.get(FbServiceService);
    expect(service).toBeTruthy();
  });
});
