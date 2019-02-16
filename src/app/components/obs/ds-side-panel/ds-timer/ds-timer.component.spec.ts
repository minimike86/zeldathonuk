import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsTimerComponent } from './ds-timer.component';

describe('DsTimerComponent', () => {
  let component: DsTimerComponent;
  let fixture: ComponentFixture<DsTimerComponent>;

  beforeEach(async(() => {
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
