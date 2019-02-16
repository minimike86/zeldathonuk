import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsGameDescriptionComponent } from './ds-game-description.component';

describe('DsGameDescriptionComponent', () => {
  let component: DsGameDescriptionComponent;
  let fixture: ComponentFixture<DsGameDescriptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsGameDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsGameDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
