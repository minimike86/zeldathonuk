import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RunnerNameComponent } from './runner-name.component';

describe('RunnerNameComponent', () => {
  let component: RunnerNameComponent;
  let fixture: ComponentFixture<RunnerNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RunnerNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RunnerNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
