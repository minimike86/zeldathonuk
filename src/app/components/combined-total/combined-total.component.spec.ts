import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CombinedTotalComponent } from './combined-total.component';

describe('CombinedTotalComponent', () => {
  let component: CombinedTotalComponent;
  let fixture: ComponentFixture<CombinedTotalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CombinedTotalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CombinedTotalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
