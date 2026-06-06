import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OmnibarDonationsComponent } from './omnibar-donations.component';

describe('OmnibarDonationsComponent', () => {
  let component: OmnibarDonationsComponent;
  let fixture: ComponentFixture<OmnibarDonationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OmnibarDonationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmnibarDonationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
