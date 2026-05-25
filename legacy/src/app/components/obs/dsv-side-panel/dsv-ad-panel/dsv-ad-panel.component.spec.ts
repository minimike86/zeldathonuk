import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DsvAdPanelComponent } from './dsv-ad-panel.component';

describe('DsvAdPanelComponent', () => {
  let component: DsvAdPanelComponent;
  let fixture: ComponentFixture<DsvAdPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DsvAdPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsvAdPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
