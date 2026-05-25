import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StandardSidePanelComponent } from './standard-side-panel.component';

describe('StandardSidePanelComponent', () => {
  let component: StandardSidePanelComponent;
  let fixture: ComponentFixture<StandardSidePanelComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StandardSidePanelComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StandardSidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
