import { TestBed } from '@angular/core/testing';

import { RunnerNameService } from './runner-name.service';

describe('RunnerNameService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: RunnerNameService = TestBed.get(RunnerNameService);
    expect(service).toBeTruthy();
  });
});
