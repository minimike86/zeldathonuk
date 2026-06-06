import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { GameBadge, ScheduledVideoGame, GameRunner } from '../../../models/video-game';
import { HowLongToBeatGameDetail } from '../../../services/howlongtobeat-service/howlongtobeat-models';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'app-move-to-schedule-dialog',
  templateUrl: './move-to-schedule-dialog.component.html',
  styleUrls: ['./move-to-schedule-dialog.component.css']
})
export class MoveToScheduleDialogComponent implements OnInit {

  public zeldaGame: ScheduledVideoGame;

  public selectedPlatform: string = null;
  public selectedRunners$: BehaviorSubject<GameRunner[]> = new BehaviorSubject<GameRunner[]>([]);
  public selectedBadges$: BehaviorSubject<GameBadge[]> = new BehaviorSubject<GameBadge[]>([]);

  public tempRunner: GameRunner;
  public tempBadge: GameBadge;
  public badgeTypes: {name: string, value: string}[];

  constructor( public ref: DynamicDialogRef,
               public config: DynamicDialogConfig ) {
  }

  ngOnInit(): void {
    console.log('dialog data', this.config.data);
    this.zeldaGame = this.config.data[0];
    this.badgeTypes = [
      { name: 'Primary', value: 'bg-primary' },
      { name: 'Secondary', value: 'bg-secondary' },
      { name: 'Success', value: 'bg-success' },
      { name: 'Danger', value: 'bg-danger' },
      { name: 'Warning', value: 'bg-warning' },
      { name: 'Info', value: 'bg-info' },
      { name: 'Light', value: 'bg-light' },
      { name: 'Dark', value: 'bg-dark' },
    ];
    this.tempRunner = this.getEmptyRunner();
    this.tempBadge = this.getEmptyBadge();
  }

  getTimeToBeatMainStory(howLongToBeatGameDetail: HowLongToBeatGameDetail) {
    return howLongToBeatGameDetail.titleGameTimes.find(x => x.label === 'Main Story').time;
  }

  getEmptyBadge(): GameBadge {
    return {
      name: '',
      type: '',
      tooltip: '',
      url: ''
    };
  }

  getEmptyRunner(): GameRunner {
    return {
      name: '',
      streamer: false,
      channelUrl: ''
    };
  }

  addBadge() {
    if (this.tempBadge.name !== ''
      && this.tempBadge.type !== '') {
      const badges = this.selectedBadges$.getValue();
      badges.concat([this.tempBadge]);
      this.selectedBadges$.next([...this.selectedBadges$.getValue(), ...[this.tempBadge]]);
      this.tempRunner = this.getEmptyRunner();
      this.tempBadge = this.getEmptyBadge();
    }
  }

  deleteBadge(i: number) {
    this.selectedBadges$.getValue().splice(i, 1);
    this.selectedBadges$.next(this.selectedBadges$.getValue());
  }

  addRunner() {
    if (this.tempRunner.channelUrl.length >= 1) {
      this.tempRunner.streamer = true;
    }
    if (this.tempRunner.name !== ''
      && ((this.tempRunner.streamer === true && this.tempRunner.channelUrl !== '')
        || (this.tempRunner.streamer === false && this.tempRunner.channelUrl === ''))) {
      this.selectedRunners$.next(this.selectedRunners$.getValue().concat([this.tempRunner]));
      this.tempRunner = this.getEmptyRunner();
    }
  }

  deleteRunner(i: number) {
    this.selectedRunners$.getValue().splice(i, 1);
    this.selectedRunners$.next(this.selectedRunners$.getValue());
  }

  scheduleGame() {
    this.zeldaGame.runners = [...this.selectedRunners$.getValue()];
    this.zeldaGame.badges = [...this.selectedBadges$.getValue()];
    this.zeldaGame.platform = this.selectedPlatform;
    if (this.zeldaGame.badges.length >= 1
      && this.zeldaGame.runners.length >= 1
        && this.zeldaGame.platform !== null) {
      this.zeldaGame.isLive = false;
      this.zeldaGame.isCompleted = false;
      this.ref.close(this.zeldaGame);
    }
  }

}
