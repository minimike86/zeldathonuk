import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JgDonationComponent } from './jg-donation.component';

describe('JgDonationComponent', () => {
  let component: JgDonationComponent;
  let fixture: ComponentFixture<JgDonationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JgDonationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JgDonationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
