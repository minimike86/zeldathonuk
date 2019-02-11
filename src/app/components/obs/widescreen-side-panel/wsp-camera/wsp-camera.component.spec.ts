import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WspCameraComponent } from './wsp-camera.component';

describe('WspCameraComponent', () => {
  let component: WspCameraComponent;
  let fixture: ComponentFixture<WspCameraComponent>;

  beforeEach(async(() => {
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
