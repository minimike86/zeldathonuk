import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdPanelComponent } from './ad-panel.component';

describe('AdPanelComponent', () => {
  let component: AdPanelComponent;
  let fixture: ComponentFixture<AdPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
