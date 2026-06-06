import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoveToScheduleDialogComponent } from './move-to-schedule-dialog.component';

describe('MoveToScheduleDialogComponent', () => {
  let component: MoveToScheduleDialogComponent;
  let fixture: ComponentFixture<MoveToScheduleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ MoveToScheduleDialogComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(MoveToScheduleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
