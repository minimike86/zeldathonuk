import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WspTimerComponent } from './wsp-timer.component';

describe('WspTimerComponent', () => {
  let component: WspTimerComponent;
  let fixture: ComponentFixture<WspTimerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WspTimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WspTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
