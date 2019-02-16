import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ObsLayoutComponent } from './layout.component';

describe('LayoutComponent', () => {
  let component: ObsLayoutComponent;
  let fixture: ComponentFixture<ObsLayoutComponent>;

  beforeEach(async(() => {
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
