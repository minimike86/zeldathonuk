import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FbDonationComponent } from './fb-donation.component';

describe('FbDonationComponent', () => {
  let component: FbDonationComponent;
  let fixture: ComponentFixture<FbDonationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FbDonationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FbDonationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
