import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { IncentivesComponent } from './incentives.component';

describe('IncentivesComponent', () => {
  let component: IncentivesComponent;
  let fixture: ComponentFixture<IncentivesComponent>;

  beforeEach(waitForAsync(() => {
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
