import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsvAdPanelComponent } from './dsv-ad-panel.component';

describe('DsvAdPanelComponent', () => {
  let component: DsvAdPanelComponent;
  let fixture: ComponentFixture<DsvAdPanelComponent>;

  beforeEach(async(() => {
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
