import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ObsComponent } from './obs.component';

describe('ObsComponent', () => {
  let component: ObsComponent;
  let fixture: ComponentFixture<ObsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ObsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
