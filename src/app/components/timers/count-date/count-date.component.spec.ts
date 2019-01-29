import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CountDateComponent } from './count-date.component';

describe('CountDateComponent', () => {
  let component: CountDateComponent;
  let fixture: ComponentFixture<CountDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CountDateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CountDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
