import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FsaFourPlayerSplitComponent } from './fsa-four-player-split.component';

describe('FsaFourPlayerSplitComponent', () => {
  let component: FsaFourPlayerSplitComponent;
  let fixture: ComponentFixture<FsaFourPlayerSplitComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FsaFourPlayerSplitComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FsaFourPlayerSplitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
