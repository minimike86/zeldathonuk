import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WspGameDescriptionComponent } from './wsp-game-description.component';

describe('WspGameDescriptionComponent', () => {
  let component: WspGameDescriptionComponent;
  let fixture: ComponentFixture<WspGameDescriptionComponent>;

  beforeEach(async(() => {
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
