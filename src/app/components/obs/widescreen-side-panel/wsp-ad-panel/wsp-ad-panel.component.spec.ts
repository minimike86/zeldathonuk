import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WspAdPanelComponent } from './wsp-ad-panel.component';

describe('WspAdPanelComponent', () => {
  let component: WspAdPanelComponent;
  let fixture: ComponentFixture<WspAdPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WspAdPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WspAdPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
