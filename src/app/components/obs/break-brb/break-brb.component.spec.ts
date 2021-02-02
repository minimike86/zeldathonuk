import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BreakBrbComponent } from './break-brb.component';

describe('BreakBrbComponent', () => {
  let component: BreakBrbComponent;
  let fixture: ComponentFixture<BreakBrbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BreakBrbComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BreakBrbComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
