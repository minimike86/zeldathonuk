import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CurrentlyPlayingService } from '../../services/firebase/currently-playing/currently-playing.service';
import {GameLineupService} from '../../services/firebase/game-lineup/game-lineup.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CurrentlyPlaying } from '../../services/firebase/currently-playing/currently-playing';
import { FirebaseTimerService } from '../../services/firebase/firebase-timer/firebase-timer.service';
import { CountUpTimerId } from '../../services/firebase/firebase-timer/count-up-timer';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';
import { RunnerNameService } from '../../services/firebase/runner-name/runner-name.service';
import { RunnerNameId } from '../../services/firebase/runner-name/runner-name';
import {GameLineUp} from '../../services/firebase/game-lineup/game-lineup';
import {map} from 'rxjs/operators';
import {ZeldaGame} from '../../models/zelda-game';


@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css']
})
export class ObsComponent implements OnInit {
  @ViewChild('yesNoModalDialog', {static: false})
  private yesNoModalDialogRef: TemplateRef<any>;
  public yesNoModal: NgbActiveModal;

  public countUpTimer: CountUpTimerId[];

  public faTwitch = faTwitch;
  public runnerName: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};
  public currentRunner: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};

  public currentlyPlayingKey = 'Loading...';
  public gameLineUp: Map<string, ZeldaGame>;

  constructor(private modalService: NgbModal,
              private firebaseTimerService: FirebaseTimerService,
              private runnerNameService: RunnerNameService,
              private gameLineupService: GameLineupService,
              private currentlyPlayingService: CurrentlyPlayingService) {
    this.firebaseTimerService.getCountUpTimer().pipe(map(data => {
      this.countUpTimer = data;
    })).subscribe();
    this.runnerNameService.getRunnerName().pipe(map(data => {
      this.runnerName = data[0];
      this.currentRunner.runnerName = data[0].runnerName;
      this.currentRunner.runnerHasTwitchAccount = data[0].runnerHasTwitchAccount;
    })).subscribe();
    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlayingKey = data[0].key;
      console.log('currentlyPlayingKey', this.currentlyPlayingKey);
    })).subscribe();
    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data[0].gameLineUp;
      console.log('gameLineUp', this.gameLineUp);
    })).subscribe();
  }

  ngOnInit() {
  }

  onSwapGameClick(game: string) {
    this.yesNoModal = this.modalService.open(this.yesNoModalDialogRef);
  }

  swapModalBtn(game: CurrentlyPlaying) {
    this.currentlyPlayingService.setCurrentlyPlaying(game);
    this.yesNoModal.close('Game swapped');
  }

  start() {
    if (this.countUpTimer[0].isStarted === false && this.countUpTimer[0].hasPaused === false) {
      // Start New Timer
      this.firebaseTimerService.setCountUpTimerStartDate(new Date());
      this.firebaseTimerService.setCountUpTimerStopDate(null);
      this.firebaseTimerService.setCountUpTimerIsStarted(true);
      this.firebaseTimerService.setCountUpTimerHasPaused(false);
      this.firebaseTimerService.setCountUpTimerIsStopped(false);
    } else {
      // Continue Existing Timer
      this.firebaseTimerService.setCountUpTimerIsStarted(true);
      this.firebaseTimerService.setCountUpTimerHasPaused(false);
    }
  }

  reset() {
    if (this.countUpTimer[0].isStarted === true || this.countUpTimer[0].hasPaused === true) {
      // Reset New Timer
      this.firebaseTimerService.setCountUpTimerStartDate(new Date());
      this.firebaseTimerService.setCountUpTimerStopDate(null);
      this.firebaseTimerService.setCountUpTimerIsStarted(true);
      this.firebaseTimerService.setCountUpTimerHasPaused(false);
    } else {
      // Reset Stopped Timer
      this.firebaseTimerService.setCountUpTimerStartDate(new Date());
      this.firebaseTimerService.setCountUpTimerStopDate(null);
      this.firebaseTimerService.setCountUpTimerIsStarted(false);
      this.firebaseTimerService.setCountUpTimerHasPaused(false);
      this.firebaseTimerService.setCountUpTimerIsStopped(true);
    }
  }

  stop() {
    if (this.countUpTimer[0].isStarted === true && this.countUpTimer[0].hasPaused === false) {
      // Pause
      this.firebaseTimerService.setCountUpTimerStopDate(new Date());
      this.firebaseTimerService.setCountUpTimerIsStarted(false);
      this.firebaseTimerService.setCountUpTimerHasPaused(true);
    } else {
      // Stop
      this.firebaseTimerService.setCountUpTimerIsStarted(false);
      this.firebaseTimerService.setCountUpTimerHasPaused(false);
      this.firebaseTimerService.setCountUpTimerIsStopped(true);
    }
  }

  updateRunner() {
    this.runnerNameService.setRunnerName({
        'runnerName': this.runnerName.runnerName,
        runnerHasTwitchAccount: this.runnerName.runnerHasTwitchAccount
      });
  }

}


