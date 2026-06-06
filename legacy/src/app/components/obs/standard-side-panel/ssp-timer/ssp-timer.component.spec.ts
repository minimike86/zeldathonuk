import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SspTimerComponent } from './ssp-timer.component';

describe('SspTimerComponent', () => {
  let component: SspTimerComponent;
  let fixture: ComponentFixture<SspTimerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SspTimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SspTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
