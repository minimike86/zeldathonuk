import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Ds3BottomPanelComponent } from './ds3-bottom-panel.component';

describe('Ds3BottomPanelComponent', () => {
  let component: Ds3BottomPanelComponent;
  let fixture: ComponentFixture<Ds3BottomPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Ds3BottomPanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ds3BottomPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
