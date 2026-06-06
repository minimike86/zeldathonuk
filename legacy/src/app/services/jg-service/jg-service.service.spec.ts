import { TestBed } from '@angular/core/testing';

import { JgService } from './jg-service.service';

describe('JgService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: JgService = TestBed.get(JgService);
    expect(service).toBeTruthy();
  });
});
