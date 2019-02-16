import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Ds3GameDescriptionComponent } from './ds3-game-description.component';

describe('Ds3GameDescriptionComponent', () => {
  let component: Ds3GameDescriptionComponent;
  let fixture: ComponentFixture<Ds3GameDescriptionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Ds3GameDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ds3GameDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
