import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmnibarDonationsComponent } from './omnibar-donations.component';

describe('OmnibarDonationsComponent', () => {
  let component: OmnibarDonationsComponent;
  let fixture: ComponentFixture<OmnibarDonationsComponent>;

  beforeEach(async(() => {
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
