import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditsRollComponent } from './credits-roll.component';

describe('CreditsRollComponent', () => {
  let component: CreditsRollComponent;
  let fixture: ComponentFixture<CreditsRollComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreditsRollComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditsRollComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
