import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { Ds3RunnerNameComponent } from './ds3-runner-name.component';

describe('Ds3RunnerNameComponent', () => {
  let component: Ds3RunnerNameComponent;
  let fixture: ComponentFixture<Ds3RunnerNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ Ds3RunnerNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(Ds3RunnerNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
