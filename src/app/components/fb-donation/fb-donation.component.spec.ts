import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FbDonationComponent } from './fb-donation.component';

describe('FbDonationComponent', () => {
  let component: FbDonationComponent;
  let fixture: ComponentFixture<FbDonationComponent>;

  beforeEach(async(() => {
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
