import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmnibarDonationPleaComponent } from './omnibar-donation-plea.component';

describe('OmnibarDonationPleaComponent', () => {
  let component: OmnibarDonationPleaComponent;
  let fixture: ComponentFixture<OmnibarDonationPleaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OmnibarDonationPleaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmnibarDonationPleaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
