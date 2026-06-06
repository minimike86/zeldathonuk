import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WspGameDescriptionComponent } from './wsp-game-description.component';

describe('WspGameDescriptionComponent', () => {
  let component: WspGameDescriptionComponent;
  let fixture: ComponentFixture<WspGameDescriptionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WspGameDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WspGameDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
