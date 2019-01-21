import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JgDonationComponent } from './jg-donation.component';

describe('JgDonationComponent', () => {
  let component: JgDonationComponent;
  let fixture: ComponentFixture<JgDonationComponent>;

  beforeEach(async(() => {
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
