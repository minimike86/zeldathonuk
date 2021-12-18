import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GameTrackingComponent } from './game-tracking.component';

describe('GameTrackingComponent', () => {
  let component: GameTrackingComponent;
  let fixture: ComponentFixture<GameTrackingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GameTrackingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
