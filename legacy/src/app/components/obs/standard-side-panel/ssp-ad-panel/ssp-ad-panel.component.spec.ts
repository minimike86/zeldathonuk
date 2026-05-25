import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AdPanelComponent } from './ad-panel.component';

describe('AdPanelComponent', () => {
  let component: AdPanelComponent;
  let fixture: ComponentFixture<AdPanelComponent>;

  beforeEach(waitForAsync(() => {
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
