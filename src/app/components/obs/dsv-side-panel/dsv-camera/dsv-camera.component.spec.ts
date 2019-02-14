import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsvCameraComponent } from './dsv-camera.component';

describe('DsvCameraComponent', () => {
  let component: DsvCameraComponent;
  let fixture: ComponentFixture<DsvCameraComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsvCameraComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsvCameraComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
