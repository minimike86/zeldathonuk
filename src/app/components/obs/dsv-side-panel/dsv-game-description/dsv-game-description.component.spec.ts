import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsvGameDescriptionComponent } from './dsv-game-description.component';

describe('DsvGameDescriptionComponent', () => {
  let component: DsvGameDescriptionComponent;
  let fixture: ComponentFixture<DsvGameDescriptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsvGameDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsvGameDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
