import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { KeyValue } from '@angular/common';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { faTwitch } from '@fortawesome/free-brands-svg-icons';

import { CurrentlyPlayingService } from '../../services/firebase/currently-playing/currently-playing.service';
import { GameLineupService } from '../../services/firebase/game-lineup/game-lineup.service';
import { FirebaseTimerService } from '../../services/firebase/firebase-timer/firebase-timer.service';
import { CountUpTimerId } from '../../services/firebase/firebase-timer/count-up-timer';
import { RunnerNameService } from '../../services/firebase/runner-name/runner-name.service';
import { RunnerNameId } from '../../services/firebase/runner-name/runner-name';
import { CountUpService } from '../../services/countup-service/countup.service';
import { TrackedDonation, TrackedDonationId } from '../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../services/firebase/donation-tracking/donation-tracking.service';

import { ZeldaGame } from '../../models/zelda-game';


@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css']
})
@Injectable({
  providedIn: 'root',
})
export class ObsComponent implements OnInit {

  @ViewChild('addGameModalDialog')
  private addGameModalDialogRef: TemplateRef<any>;
  public addGameModal: NgbActiveModal;

  @ViewChild('yesNoModalDialog')
  private yesNoModalDialogRef: TemplateRef<any>;
  public yesNoModal: NgbActiveModal;

  public showObsLayouts = false;
  public showTimer = false;
  public showRunnerName = false;
  public showAddDonation = false;
  public showGameSelect = false;
  public showGameTracking = false;

  public countUpData: CountUpTimerId[];
  public timer$: Observable<string>;
  public timer: string;

  public faTwitch = faTwitch;
  public runnerName: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};
  public currentRunner: RunnerNameId = {id: '', runnerName: '', runnerHasTwitchAccount: false};

  public tempTrackedDonation: TrackedDonation;
  public donationDate: string;
  public donationTime: string;

  public tempAddGameKey: string;
  public tempAddGame: ZeldaGame;

  public currentlyPlaying = {id: '', index: ''};
  public gameLineUp: Map<string, ZeldaGame>;
  public sortedGameLineUp: ZeldaGame[];
  public swapGameKey: KeyValue<string, ZeldaGame>;

  constructor( private modalService: NgbModal,
               private countUpService: CountUpService,
               private firebaseTimerService: FirebaseTimerService,
               private donationTrackingService: DonationTrackingService,
               private runnerNameService: RunnerNameService,
               private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
    this.clearTrackedDonation();
    this.clearAddGame();
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
      this.sortedGameLineUp = Array.from(Object.values(this.gameLineUp)).sort((a: ZeldaGame, b: ZeldaGame) => a.order - b.order);
      this.tempAddGame.order = Object.keys(this.gameLineUp).length;
    })).subscribe();
    this.firebaseTimerService.getCountUpTimer().subscribe(data => {
      this.countUpData = data;
    });
    this.timer$ = this.countUpService.getTimer().pipe(map(timer => {
      return this.timer = timer;
    }));
  }

  onOpenAddGameModalClick() {
    this.tempAddGame.order = this.gameLineUp !== undefined ? Object.keys(this.gameLineUp).length : 0;
    this.addGameModal = this.modalService.open(this.addGameModalDialogRef);
  }

  submitAddGame() {
    this.gameLineupService.addGameToLineUp(this.tempAddGameKey, this.tempAddGame);
    this.addGameModal.close();
    this.clearAddGame();
  }

  clearAddGame() {
    this.tempAddGame = {
      active: true,
      coverArt: '',
      gameEstimate: '00:00:00',
      gameName: '',
      gamePlatform: '',
      gameProgressKey: '',
      gameRelYear: '',
      gameType: 'Casual Any%',
      order: this.gameLineUp !== undefined ? Object.keys(this.gameLineUp).length : 0
    };
  }

  onSwapGameClick(game: ZeldaGame) {
    this.swapGameKey = Object.assign({key: game.gameProgressKey}, {value: game});
    this.yesNoModal = this.modalService.open(this.yesNoModalDialogRef);
  }

  swapGameModalBtn() {
    this.currentlyPlayingService.setCurrentlyPlaying({index: this.swapGameKey.key});
    this.yesNoModal.close('Game swapped');
  }

  start() {
    if (this.countUpData[0].isStarted === false && this.countUpData[0].hasPaused === false) {
      this.countUpService.startNewTimer();
    } else {
      this.countUpService.continueExistingTimer();
    }
  }

  reset() {
    if (this.countUpData[0].isStopped === true) {
      this.countUpService.resetStoppedTimer();
    } else {
      this.countUpService.resetCurrentTimer();
    }
  }

  stop() {
    if (this.countUpData[0].isStarted === true && this.countUpData[0].hasPaused === false) {
      this.countUpService.pauseTimer();
    } else {
      this.countUpService.stopTimer();
    }
  }

  updateRunner() {
    this.runnerNameService.setRunnerName({
        'runnerName': this.runnerName.runnerName,
        runnerHasTwitchAccount: this.runnerName.runnerHasTwitchAccount
      });
  }

  submitTrackedDonation() {
    this.tempTrackedDonation.donationDate = new Date(this.donationDate + 'T' + this.donationTime);
    console.log('submitTrackedDonation: ', this.tempTrackedDonation);
    this.donationTrackingService.addTrackedDonation([this.tempTrackedDonation]);
    this.clearTrackedDonation();
  }

  clearTrackedDonation() {
    this.tempTrackedDonation = {
      name: '',
      imgUrl: '',
      message: '',
      currency: 'GBP',
      donationAmount: 0.00,
      giftAidAmount: 0.00,
      donationSource: 'Facebook',
      donationDate: null
    };
    this.donationDate = '';
    this.donationTime = '';
  }

  toggleShowObsLayouts() {
    this.showObsLayouts = !this.showObsLayouts;
  }

  toggleShowTimer() {
    this.showTimer = !this.showTimer;
  }

  toggleShowRunnerName() {
    this.showRunnerName = !this.showRunnerName;
  }

  toggleShowAddDonation() {
    this.showAddDonation = !this.showAddDonation;
  }

  toggleShowGameSelect() {
    this.showGameSelect = !this.showGameSelect;
  }

  toggleShowGameTracking() {
    this.showGameTracking = !this.showGameTracking;
  }

}


