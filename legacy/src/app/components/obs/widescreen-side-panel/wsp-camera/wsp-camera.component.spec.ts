import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WspCameraComponent } from './wsp-camera.component';

describe('WspCameraComponent', () => {
  let component: WspCameraComponent;
  let fixture: ComponentFixture<WspCameraComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WspCameraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WspCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
