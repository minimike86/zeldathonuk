import {Component, Input, OnInit} from '@angular/core';
import {GameBadge, GameRunner, ScheduledVideoGame, VideoGame} from '../../../models/video-game';
import {BehaviorSubject} from 'rxjs';
import {HowLongToBeatGameDetail} from '../../../services/howlongtobeat-service/howlongtobeat-models';
import {GameLineupService} from '../../../services/firebase/game-lineup/game-lineup.service';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ConfirmationService} from 'primeng/api';

@Component({
  selector: 'app-edit-game-dialog',
  templateUrl: './edit-game-dialog.component.html',
  styleUrls: ['./edit-game-dialog.component.css']
})
export class EditGameDialogComponent implements OnInit {

  @Input()
  public scheduledVideoGame: ScheduledVideoGame;

  public scheduledVideoGames: ScheduledVideoGame[];

  public selectedPlatform: string = null;
  public selectedRunners$: BehaviorSubject<GameRunner[]>;
  public selectedBadges$: BehaviorSubject<GameBadge[]>;

  public tempRunner: GameRunner;
  public tempBadge: GameBadge;
  public badgeTypes: {name: string, value: string}[];


  constructor( private modalService: NgbModal,
               private confirmationService: ConfirmationService,
               private gameLineupService: GameLineupService ) {
  }

  ngOnInit(): void {
    this.selectedRunners$ = new BehaviorSubject<GameRunner[]>(this.scheduledVideoGame.runners);
    this.selectedBadges$ = new BehaviorSubject<GameBadge[]>(this.scheduledVideoGame.badges);
    this.selectedPlatform = this.scheduledVideoGame.platform;
    console.log('scheduledVideoGame', this.scheduledVideoGame);
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

    this.gameLineupService.getGameLineUp().subscribe((data) => {
      this.scheduledVideoGames = data[0].activeSchedule.filter(x => x.gameDetail.id !== this.scheduledVideoGame.gameDetail.id);
    });
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

  updateAvailableGame() {
  }

  confirmUpdateScheduledGame(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: 'Are you sure that you want to proceed?',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.updateScheduledGame();
      },
      reject: () => {
      }
    });
  }

  updateScheduledGame() {
    if (this.scheduledVideoGame.runners === [...this.selectedRunners$.getValue()]) {
      this.scheduledVideoGame.runners = [...this.selectedRunners$.getValue()];
    }
    this.scheduledVideoGame.badges = [...this.selectedBadges$.getValue()];
    this.scheduledVideoGame.platform = this.selectedPlatform;
    if (this.scheduledVideoGame.badges.length >= 1
      && this.scheduledVideoGame.runners.length >= 1
      && this.scheduledVideoGame.platform !== null) {
      this.scheduledVideoGame.isLive = false;
      this.scheduledVideoGame.isCompleted = false;
      // UPDATE FIRESTORE
      this.scheduledVideoGames.push(this.scheduledVideoGame);
      this.gameLineupService.purgeActiveSchedule();
      this.gameLineupService.updateGameToActiveSchedule(this.scheduledVideoGames);
      this.modalService.dismissAll();
    }
  }

}
