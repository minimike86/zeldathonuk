import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TwitchOAuthComponent } from './twitch-oauth.component';

describe('TwitchOAuthComponent', () => {
  let component: TwitchOAuthComponent;
  let fixture: ComponentFixture<TwitchOAuthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TwitchOAuthComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TwitchOAuthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
