import { TestBed } from '@angular/core/testing';

import { ZeldathonBackendService } from './zeldathon-backend-service.service';

describe('ZeldathonBackendService', () => {
  let service: ZeldathonBackendService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ZeldathonBackendService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
