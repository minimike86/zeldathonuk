import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WspRunnerNameComponent } from './wsp-runner-name.component';

describe('WspRunnerNameComponent', () => {
  let component: WspRunnerNameComponent;
  let fixture: ComponentFixture<WspRunnerNameComponent>;

  beforeEach(async(() => {
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
