import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DsCameraComponent } from './ds-camera.component';

describe('DsCameraComponent', () => {
  let component: DsCameraComponent;
  let fixture: ComponentFixture<DsCameraComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DsCameraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
