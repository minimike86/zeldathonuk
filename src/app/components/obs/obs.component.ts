import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
import {KeyValue} from '@angular/common';

import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { faTwitch } from '@fortawesome/free-brands-svg-icons';

import { CurrentlyPlayingService } from '../../services/firebase/currently-playing/currently-playing.service';
import { GameLineupService } from '../../services/firebase/game-lineup/game-lineup.service';
import { FirebaseTimerService } from '../../services/firebase/firebase-timer/firebase-timer.service';
import { CountUpTimerId } from '../../services/firebase/firebase-timer/count-up-timer';
import { RunnerNameService } from '../../services/firebase/runner-name/runner-name.service';
import { RunnerNameId } from '../../services/firebase/runner-name/runner-name';
import { CountUpService } from '../../services/countup-service/countup.service';
import { TrackedDonation } from '../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../services/firebase/donation-tracking/donation-tracking.service';
import {BreakCountdownService} from '../../services/firebase/break-countdown/break-countdown.service';

import {GameBadge, Runner, ZeldaGame} from '../../models/zelda-game';
import firebase from 'firebase/app';
import Timestamp = firebase.firestore.Timestamp;
import {sha256} from 'js-sha256';

import {faPlay, faPause, faStop, faHistory,
        faBackward} from '@fortawesome/free-solid-svg-icons';
import {GameLineUpId} from '../../services/firebase/game-lineup/game-lineup';
import {TwitchService} from '../../services/twitch-service/twitch-service.service';
import {ZeldathonBackendService} from '../../services/zeldathon-backend-service/zeldathon-backend-service.service';


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

  @ViewChild('addBadgeModalDialog')
  private addBadgeModalDialogRef: TemplateRef<any>;
  public addBadgeModal: NgbActiveModal;
  public badgeType: string;
  public badgeText: string;
  public badgeUrlYn = false;
  public badgeUrl: string;

  @ViewChild('addRunnerModalDialog')
  private addRunnerModalDialogRef: TemplateRef<any>;
  public addRunnerModal: NgbActiveModal;
  public tempRunnerName: string;
  public tempRunnerChannelUrl: string;

  @ViewChild('yesNoModalDialog')
  private yesNoModalDialogRef: TemplateRef<any>;
  public yesNoModal: NgbActiveModal;

  public showObsLayouts = false;
  public showBreakCountdownDate = false;
  public showTimer = false;
  public showRunnerName = false;
  public showAddDonation = false;
  public showGameSelect = false;
  public showGameTracking = false;

  public countUpData: CountUpTimerId[];
  public timer$: Observable<string>;
  public timer: string;

  public pauseTimestamp: Timestamp;
  public pauseOffset: number;

  public breakCountdownDate: string;
  public breakCountdownTime: string;

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

  faPlay = faPlay;
  faPause = faPause;
  faStop = faStop;
  faHistory = faHistory;
  faBackward = faBackward;

  constructor( private modalService: NgbModal,
               private breakCountdownService: BreakCountdownService,
               private countUpService: CountUpService,
               private zeldathonBackendService: ZeldathonBackendService,
               private firebaseTimerService: FirebaseTimerService,
               private donationTrackingService: DonationTrackingService,
               private runnerNameService: RunnerNameService,
               private gameLineupService: GameLineupService,
               private twitchService: TwitchService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
    this.clearTrackedDonation();
    this.clearAddGame();
  }

  ngOnInit() {

    this.breakCountdownService.getBreakCountdown().pipe(map(data => {
      const date: Date = data[0].timestamp.toDate();
      this.breakCountdownDate = `${date.getFullYear()}-${this.zeroPad(date.getMonth() + 1, 2)}-${this.zeroPad(date.getDate(), 2)}`;
      this.breakCountdownTime = `${this.zeroPad(date.getHours(), 2)}:${this.zeroPad(date.getMinutes(), 2)}:${this.zeroPad(date.getSeconds(), 2)}`;
    })).subscribe();

    this.runnerNameService.getRunnerName().pipe(map(data => {
      this.runnerName = data[0];
      this.currentRunner.runnerName = data[0].runnerName;
      this.currentRunner.runnerHasTwitchAccount = data[0].runnerHasTwitchAccount;
    })).subscribe();

    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentlyPlaying = data[0];
      // console.log('currentlyPlaying', this.currentlyPlaying, data);
    })).subscribe();

    this.gameLineupService.getGameLineUp().pipe(map((data: GameLineUpId[]) => {
      this.gameLineUp = data.find(x => x.id === 'GAME-LINEUP').gameLineUp;
      this.sortedGameLineUp = Array.from(Object.values(this.gameLineUp)).sort((a: ZeldaGame, b: ZeldaGame) => a.order - b.order);
      this.tempAddGame.order = Object.keys(this.gameLineUp).length;
    })).subscribe();

    this.firebaseTimerService.getCountUpTimer().subscribe(data => {
      this.countUpData = data;
    });

    this.pauseOffset = 0;
    this.pauseTimestamp = Timestamp.now();
    this.timer$ = this.countUpService.getTimer().pipe(map((timer: string) => {
      return this.timer = timer;
    }));

  }

  onOpenAddGameModalClick() {
    this.tempAddGame.order = this.gameLineUp !== undefined ? Object.keys(this.gameLineUp).length : 0;
    this.addGameModal = this.modalService.open(this.addGameModalDialogRef, { size: 'lg' });
  }

  openAddBadgeModal() {
    this.addBadgeModal = this.modalService.open(this.addBadgeModalDialogRef);
  }

  submitAddBadge() {
    let badge: GameBadge;
    if (this.badgeUrlYn) {
      badge = {
        type: this.badgeType,
        text: this.badgeText,
        url: this.badgeUrl
      };
    } else {
      badge = {
        type: this.badgeType,
        text: this.badgeText,
      };
    }
    if (this.badgeType && this.badgeText) {
      this.tempAddGame.extraBadges.push(badge);
      this.clearAddBadge();
    }
  }

  clearAddBadge() {
    this.badgeType = null;
    this.badgeText = null;
    this.badgeUrlYn = false;
    this.badgeUrl = null;
  }

  openAddRunnerModal() {
    this.addRunnerModal = this.modalService.open(this.addRunnerModalDialogRef);
  }

  submitAddRunner() {
    const runner: Runner = {
      name: this.tempRunnerName,
      channelUrl: this.tempRunnerChannelUrl,
    };
    if (this.tempRunnerName && this.tempRunnerChannelUrl) {
      this.tempAddGame.runners.push(runner);
      this.clearTempRunner();
    }
  }

  clearTempRunner() {
    this.tempRunnerName = null;
    this.tempRunnerChannelUrl = null;
  }

  submitAddGame() {
    this.gameLineupService.addGameToLineUp(this.tempAddGameKey, this.tempAddGame);
    this.addGameModal.close();
    this.clearAddGame();
  }

  clearAddGame() {
    this.tempAddGameKey = '';
    this.tempAddGame = {
      active: true,
      coverArt: '',
      gameEstimate: '00:00:00',
      gameName: '',
      gamePlatform: '',
      timeline: '',
      gameProgressKey: '',
      gameRelYear: '',
      gameType: 'Casual Any%',
      order: this.gameLineUp !== undefined ? Object.keys(this.gameLineUp).length : 0,
      extraBadges: [],
      runners: [],
      startDate: null,
      endDate: null,
      twitchGameId: null
    };
  }

  onSwapGameClick(game: ZeldaGame) {
    this.swapGameKey = Object.assign({key: game.gameProgressKey}, {value: game});
    this.yesNoModal = this.modalService.open(this.yesNoModalDialogRef);
  }

  swapGameModalBtn() {
    const currentGame: ZeldaGame = Object.values(this.gameLineUp).find((x: ZeldaGame) => x.gameProgressKey === this.currentlyPlaying.index);
    // SET THE PREVIOUS GAME TO COMPLETE AND START THE NEXT GAME
    this.gameLineupService.updateGameFinished(currentGame, this.swapGameKey.value);

    // UPDATE TWITCH GAME AND TITLE
    this.twitchService.updateChannel('52548232', this.swapGameKey.value.twitchGameId, 'en',
        `#GameBlast21 Fundraising for SpecialEffect! | Now playing: ${this.getAbbriatedGameName(this.swapGameKey.value.gameName)} (Game #${this.swapGameKey.value.order + 1} of ${Object.values(this.gameLineUp).length})`)
      .subscribe();

    // CREATE A NEW STREAM MARKER
    this.twitchService.createStreamMaker('52548232',
      `Beaten \"${this.getAbbriatedGameName(currentGame.gameName)}\" and about to start the next game \"${this.getAbbriatedGameName(this.swapGameKey.value.gameName)}\" (#${this.swapGameKey.value.order + 1} of ${Object.values(this.gameLineUp).length})`)
      .subscribe();

    // TWEET THE START OF THE NEXT GAME
    this.zeldathonBackendService.scrapeTwitterTweet(
      `The #ZeldathonUK crew have just beaten \"${this.getAbbriatedGameName(currentGame.gameName)}\" and are about to start the next game \"${this.getAbbriatedGameName(this.swapGameKey.value.gameName)}\" (#${this.swapGameKey.value.order + 1} of ${Object.values(this.gameLineUp).length})!\n\nFundraising for @SpecialEffect #GameBlast21\nWatch Live: https://www.zeldathon.co.uk/`)
      .subscribe();

    this.currentlyPlayingService.setCurrentlyPlaying({index: this.swapGameKey.key});
    this.yesNoModal.close('Game swapped');
  }

  getAbbriatedGameName(gameName: string) {
    return gameName.replace('The Legend of Zelda:', '').trim();
  }

  setBreakCountdown() {
    this.breakCountdownService.setBreakCountdown(Timestamp.fromDate(new Date(this.breakCountdownDate + 'T' + this.breakCountdownTime)));
  }

  start() {
    if (this.countUpData?.find(x => x.id === 'vuect9iPi4vNbssTOgLC').isStarted === false
      && this.countUpData?.find(x => x.id === 'vuect9iPi4vNbssTOgLC').hasPaused === false) {
      this.countUpService.startNewTimer(Timestamp.now());
    } else {
      this.countUpService.continueExistingTimer();
    }
  }

  unpause() {
    this.pauseTimestamp = Timestamp.fromDate(new Date(new Date().getTime() - this.pauseOffset));
    this.countUpService.startNewTimer(this.pauseTimestamp);
  }

  reset() {
    if (this.countUpData?.find(x => x.id === 'vuect9iPi4vNbssTOgLC').isStopped === true) {
      this.countUpService.resetStoppedTimer();
    } else {
      this.countUpService.resetCurrentTimer();
    }
  }

  pauseStop(startDate: Timestamp) {
    if (this.countUpData?.find(x => x.id === 'vuect9iPi4vNbssTOgLC').isStarted === true
      && this.countUpData?.find(x => x.id === 'vuect9iPi4vNbssTOgLC').hasPaused === false) {
      // pause
      this.pauseOffset = new Date(new Date().getTime() - startDate?.toDate()?.getTime()).getTime();
      console.log('pauseOffset', this.pauseOffset);
      this.countUpService.pauseTimer();
    } else {
      // stop
      this.countUpService.stopTimer();
    }
  }

  getCancelTimer(startDate: Timestamp): Observable<string> {
    const pausedTimer: Date = new Date(new Date().getTime() - startDate?.toDate()?.getTime() + 500);
    return of(`${this.zeroPad(pausedTimer.getUTCHours(), 2)}:${this.zeroPad(pausedTimer.getUTCMinutes(), 2)}:${this.zeroPad(pausedTimer.getUTCSeconds(), 2)}`);
  }

  getPausedTimer(): Observable<string> {
    const pausedTimer: Date = new Date(this.pauseOffset + 500);
    return of(`${this.zeroPad(pausedTimer.getUTCHours(), 2)}:${this.zeroPad(pausedTimer.getUTCMinutes(), 2)}:${this.zeroPad(pausedTimer.getUTCSeconds(), 2)}`);
  }

  updateRunner() {
    this.runnerNameService.setRunnerName({
        'runnerName': this.runnerName.runnerName,
        runnerHasTwitchAccount: this.runnerName.runnerHasTwitchAccount
      });
  }

  submitTrackedDonation() {
    this.tempTrackedDonation.donationDate = Timestamp.fromDate(new Date(this.donationDate + 'T' + this.donationTime));
    console.log('submitTrackedDonation: ', this.tempTrackedDonation);
    this.donationTrackingService.addTrackedDonation([this.tempTrackedDonation]);
    this.clearTrackedDonation();
  }

  clearTrackedDonation() {
    this.tempTrackedDonation = {
      id: sha256(new Date().toDateString()),
      name: '',
      imgUrl: 'https://via.placeholder.com/150',
      message: '',
      currency: 'GBP',
      donationAmount: 0.00,
      giftAidAmount: 0.00,
      donationSource: 'Manual',
      donationDate: null
    };
    this.donationDate = '';
    this.donationTime = '';
  }

  toggleShowObsLayouts() {
    this.showObsLayouts = !this.showObsLayouts;
  }

  toggleShowBreakCountdownDate() {
    this.showBreakCountdownDate = !this.showBreakCountdownDate;
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

  zeroPad(num: number, maxLen: number): string {
    if (maxLen > 2) {
      if (num < 10) {
        return ('00' + num);
      } else if (num < 100) {
        return ('0' + num);
      } else {
        return ('' + num);
      }
    } else if (maxLen <= 2) {
      if (num < 10) {
        return ('0' + num);
      } else {
        return ('' + num);
      }
    }
  }

}


