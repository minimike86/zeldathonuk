import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpNextGameComponent } from './up-next-game.component';

describe('UpNextGameComponent', () => {
  let component: UpNextGameComponent;
  let fixture: ComponentFixture<UpNextGameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpNextGameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpNextGameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
