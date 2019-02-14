import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsvTimerComponent } from './dsv-timer.component';

describe('DsvTimerComponent', () => {
  let component: DsvTimerComponent;
  let fixture: ComponentFixture<DsvTimerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsvTimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsvTimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
