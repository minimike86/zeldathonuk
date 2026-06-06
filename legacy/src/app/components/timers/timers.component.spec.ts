import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TimersComponent } from './timers.component';

describe('TimersComponent', () => {
  let component: TimersComponent;
  let fixture: ComponentFixture<TimersComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TimersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
