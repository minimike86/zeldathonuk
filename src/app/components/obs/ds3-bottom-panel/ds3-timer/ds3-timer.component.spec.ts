import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Ds3TimerComponent } from './ds3-timer.component';

describe('Ds3TimerComponent', () => {
  let component: Ds3TimerComponent;
  let fixture: ComponentFixture<Ds3TimerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Ds3TimerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ds3TimerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
