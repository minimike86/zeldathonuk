import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsRunnerNameComponent } from './ds-runner-name.component';

describe('DsRunnerNameComponent', () => {
  let component: DsRunnerNameComponent;
  let fixture: ComponentFixture<DsRunnerNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsRunnerNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsRunnerNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
