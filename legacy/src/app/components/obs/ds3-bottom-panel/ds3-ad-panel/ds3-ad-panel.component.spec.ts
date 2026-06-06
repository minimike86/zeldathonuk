import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { Ds3AdPanelComponent } from './ds3-ad-panel.component';

describe('Ds3AdPanelComponent', () => {
  let component: Ds3AdPanelComponent;
  let fixture: ComponentFixture<Ds3AdPanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ Ds3AdPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ds3AdPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
