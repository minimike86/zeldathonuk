import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { OmnibarComponent } from './omnibar.component';

describe('OmnibarComponent', () => {
  let component: OmnibarComponent;
  let fixture: ComponentFixture<OmnibarComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ OmnibarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OmnibarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
