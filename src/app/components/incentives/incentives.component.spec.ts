import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IncentivesComponent } from './incentives.component';

describe('IncentivesComponent', () => {
  let component: IncentivesComponent;
  let fixture: ComponentFixture<IncentivesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ IncentivesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IncentivesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
