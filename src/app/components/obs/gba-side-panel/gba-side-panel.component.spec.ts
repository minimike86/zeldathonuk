import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GbaSidePanelComponent } from './gba-side-panel.component';

describe('GbaSidePanelComponent', () => {
  let component: GbaSidePanelComponent;
  let fixture: ComponentFixture<GbaSidePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GbaSidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GbaSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
