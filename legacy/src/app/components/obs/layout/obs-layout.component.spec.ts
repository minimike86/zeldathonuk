import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ObsLayoutComponent } from './obs-layout.component';


describe('LayoutComponent', () => {
  let component: ObsLayoutComponent;
  let fixture: ComponentFixture<ObsLayoutComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ObsLayoutComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ObsLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
