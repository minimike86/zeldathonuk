import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsCameraComponent } from './ds-camera.component';

describe('DsCameraComponent', () => {
  let component: DsCameraComponent;
  let fixture: ComponentFixture<DsCameraComponent>;

  beforeEach(async(() => {
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
