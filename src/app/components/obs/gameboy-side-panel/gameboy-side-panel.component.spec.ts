import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameboySidePanelComponent } from './gameboy-side-panel.component';

describe('GameboySidePanelComponent', () => {
  let component: GameboySidePanelComponent;
  let fixture: ComponentFixture<GameboySidePanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameboySidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameboySidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
