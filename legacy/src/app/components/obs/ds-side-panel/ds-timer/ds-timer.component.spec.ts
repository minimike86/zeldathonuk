import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DsTimerComponent } from './ds-timer.component';

describe('DsTimerComponent', () => {
  let component: DsTimerComponent;
  let fixture: ComponentFixture<DsTimerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DsTimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
