import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidescreenSidePanelComponent } from './widescreen-side-panel.component';

describe('WidescreenSidePanelComponent', () => {
  let component: WidescreenSidePanelComponent;
  let fixture: ComponentFixture<WidescreenSidePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidescreenSidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidescreenSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
