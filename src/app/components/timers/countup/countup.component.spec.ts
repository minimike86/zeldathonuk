import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CountupComponent } from './countup.component';

describe('CountupComponent', () => {
  let component: CountupComponent;
  let fixture: ComponentFixture<CountupComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CountupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
