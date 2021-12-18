import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DsGameDescriptionComponent } from './ds-game-description.component';

describe('DsGameDescriptionComponent', () => {
  let component: DsGameDescriptionComponent;
  let fixture: ComponentFixture<DsGameDescriptionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DsGameDescriptionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DsGameDescriptionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
