import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WspTimerComponent } from './wsp-timer.component';

describe('WspTimerComponent', () => {
  let component: WspTimerComponent;
  let fixture: ComponentFixture<WspTimerComponent>;

  beforeEach(async(() => {
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
