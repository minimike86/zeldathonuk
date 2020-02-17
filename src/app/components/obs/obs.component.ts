import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CurrentlyPlayingService } from '../../services/firebase/currently-playing/currently-playing.service';
import { GameLineupService } from '../../services/firebase/game-lineup/game-lineup.service';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FirebaseTimerService } from '../../services/firebase/firebase-timer/firebase-timer.service';
import { CountUpTimerId } from '../../services/firebase/firebase-timer/count-up-timer';
import { faTwitch } from '@fortawesome/free-brands-svg-icons';
import { RunnerNameService } from '../../services/firebase/runner-name/runner-name.service';
import { RunnerNameId } from '../../services/firebase/runner-name/runner-name';
import { map } from 'rxjs/operators';
import { ZeldaGame } from '../../models/zelda-game';
import { KeyValue } from '@angular/common';
import { JgService } from '../../services/jg-service/jg-service.service';
import {CountupService} from '../../services/countup-service/countup.service';
import {Observable} from 'rxjs';


@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css']
})
@Injectable({
  providedIn: 'root',
})
export class ObsComponent implements OnInit {
  @ViewChild('yesNoModalDialog', {static: false})
  private yesNoModalDialogRef: TemplateRef<any>;
  public yesNoModal: NgbActiveModal;

  public showObsLayouts = false;

  public faTwitch = faTwitch;
  public runnerName: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};
  public currentRunner: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};

  public currentlyPlaying = {id: '', index: ''};
  public gameLineUp: Map<string, ZeldaGame>;
  public swapGameKey: KeyValue<string, ZeldaGame>;

  public countUpData: CountUpTimerId[];
  public timer$: Observable<string>;
  public timer: string;

  constructor( private modalService: NgbModal,
               private countupService: CountupService,
               private firebaseTimerService: FirebaseTimerService,
               private jgService: JgService,
               private runnerNameService: RunnerNameService,
               private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
  }

  ngOnInit() {
    this.runnerNameService.getRunnerName().pipe(map(data => {
      this.runnerName = data[0];
      this.currentRunner.runnerName = data[0].runnerName;
      this.currentRunner.runnerHasTwitchAccount = data[0].runnerHasTwitchAccount;
    })).subscribe();
    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlaying = data[0];
      // console.log('currentlyPlaying', this.currentlyPlaying, data);
    })).subscribe();
    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data[0].gameLineUp;
      // console.log('gameLineUp', this.gameLineUp);
    })).subscribe();
    this.firebaseTimerService.getCountUpTimer().subscribe(data => {
      this.countUpData = data;
    });
    this.timer$ = this.countupService.getTimer().pipe(map(timer => {
      return this.timer = timer;
    }));
  }

  onSwapGameClick(gameKey: KeyValue<string, ZeldaGame>) {
    this.swapGameKey = gameKey;
    this.yesNoModal = this.modalService.open(this.yesNoModalDialogRef);
  }

  swapModalBtn() {
    this.currentlyPlayingService.setCurrentlyPlaying({index: this.swapGameKey.key});
    this.yesNoModal.close('Game swapped');
  }

  start() {
    if (this.countUpData[0].isStarted === false && this.countUpData[0].hasPaused === false) {
      this.countupService.startNewTimer();
    } else {
      this.countupService.continueExistingTimer();
    }
  }

  reset() {
    if (this.countUpData[0].isStopped === true) {
      this.countupService.resetStoppedTimer();
    } else {
      this.countupService.resetCurrentTimer();
    }
  }

  stop() {
    if (this.countUpData[0].isStarted === true && this.countUpData[0].hasPaused === false) {
      this.countupService.pauseTimer();
    } else {
      this.countupService.stopTimer();
    }
  }

  updateRunner() {
    this.runnerNameService.setRunnerName({
        'runnerName': this.runnerName.runnerName,
        runnerHasTwitchAccount: this.runnerName.runnerHasTwitchAccount
      });
  }

  toggleShowObsLayouts() {
    this.showObsLayouts = !this.showObsLayouts;
  }

}


