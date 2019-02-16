import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsSidePanelComponent } from './ds-side-panel.component';

describe('DsSidePanelComponent', () => {
  let component: DsSidePanelComponent;
  let fixture: ComponentFixture<DsSidePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsSidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
