import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OmnibarComponent } from './omnibar.component';

describe('OmnibarComponent', () => {
  let component: OmnibarComponent;
  let fixture: ComponentFixture<OmnibarComponent>;

  beforeEach(async(() => {
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
