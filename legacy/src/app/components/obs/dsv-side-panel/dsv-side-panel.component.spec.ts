import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DsvSidePanelComponent } from './dsv-side-panel.component';

describe('DsvSidePanelComponent', () => {
  let component: DsvSidePanelComponent;
  let fixture: ComponentFixture<DsvSidePanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DsvSidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsvSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
