import { TestBed } from '@angular/core/testing';

import { JgServiceService } from './jg-service.service';

describe('JgServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: JgServiceService = TestBed.get(JgServiceService);
    expect(service).toBeTruthy();
  });
});
