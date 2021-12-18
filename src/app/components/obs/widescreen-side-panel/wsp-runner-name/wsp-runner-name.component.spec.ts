import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WspRunnerNameComponent } from './wsp-runner-name.component';

describe('WspRunnerNameComponent', () => {
  let component: WspRunnerNameComponent;
  let fixture: ComponentFixture<WspRunnerNameComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WspRunnerNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WspRunnerNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
