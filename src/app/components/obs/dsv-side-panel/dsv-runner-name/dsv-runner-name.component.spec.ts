import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DsvRunnerNameComponent } from './dsv-runner-name.component';

describe('DsvRunnerNameComponent', () => {
  let component: DsvRunnerNameComponent;
  let fixture: ComponentFixture<DsvRunnerNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DsvRunnerNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsvRunnerNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
