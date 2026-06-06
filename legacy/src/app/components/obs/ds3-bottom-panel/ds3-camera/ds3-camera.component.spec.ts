import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Ds3CameraComponent } from './ds3-camera.component';

describe('Ds3CameraComponent', () => {
  let component: Ds3CameraComponent;
  let fixture: ComponentFixture<Ds3CameraComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Ds3CameraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ds3CameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
