import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SspRunnerNameComponent } from './runner-name.component';

describe('RunnerNameComponent', () => {
  let component: SspRunnerNameComponent;
  let fixture: ComponentFixture<SspRunnerNameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SspRunnerNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SspRunnerNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
