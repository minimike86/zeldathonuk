import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { KeyValue } from '@angular/common';

import { from, Observable, of } from 'rxjs';
import { concatMap, finalize, map } from 'rxjs/operators';

import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { CurrentlyPlayingService } from '../../services/firebase/currently-playing/currently-playing.service';
import { GameLineupService } from '../../services/firebase/game-lineup/game-lineup.service';
import { FirebaseTimerService } from '../../services/firebase/firebase-timer/firebase-timer.service';
import { CountUpTimerId } from '../../services/firebase/firebase-timer/count-up-timer';
import { RunnerNameService } from '../../services/firebase/runner-name/runner-name.service';
import { RunnerNameId } from '../../services/firebase/runner-name/runner-name';
import { CountUpService } from '../../services/countup-service/countup.service';
import { TrackedDonation, TrackedDonationId } from '../../services/firebase/donation-tracking/tracked-donation';
import { DonationTrackingService } from '../../services/firebase/donation-tracking/donation-tracking.service';
import { BreakCountdownService } from '../../services/firebase/break-countdown/break-countdown.service';

import { ZeldaGame } from '../../models/zelda-game';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;

import {sha256} from 'js-sha256';

import { faTwitch } from '@fortawesome/free-brands-svg-icons';
import { faPlay, faPause, faStop, faHistory, faBackward, faSyncAlt, faTrash, faDonate } from '@fortawesome/free-solid-svg-icons';

import { JgService } from '../../services/jg-service/jg-service.service';
import {
  FundraisingPage,
  FundraisingPageId,
  FundraisingPagesService
} from '../../services/firebase/fundraising-pages/fundraising-pages.service';
import { FundraisingPageDetails, JustGivingDonation } from '../../services/jg-service/fundraising-page';
import { profanityFilter } from './omnibar/omnibar.component';


@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.scss']
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

  @ViewChild('addManualDonationModalDialog')
  private addManualDonationModalDialogRef: TemplateRef<any>;
  public addManualDonationModal: NgbActiveModal;

  public showObsLayouts = false;
  public showBreakCountdownDate = false;
  public showTimer = false;
  public showRunnerName = false;
  public showAddDonation = false;
  public showGameSelect = true;
  public showGameTracking = true;

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

  public justGivingPages: FundraisingPage[] = [];
  public inputJustGivingPageUrl = '';
  public trackedDonations$: Observable<TrackedDonationId[]>;
  public trackedDonationIds: TrackedDonationId[];
  public trackedDonations: TrackedDonation[];
  public selectedDonations: TrackedDonation[];

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
  faSyncAlt = faSyncAlt;
  faTrash = faTrash;
  faDonate = faDonate;

  constructor( private modalService: NgbModal,
               private breakCountdownService: BreakCountdownService,
               private countUpService: CountUpService,
               private firebaseTimerService: FirebaseTimerService,
               private donationTrackingService: DonationTrackingService,
               private runnerNameService: RunnerNameService,
               private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService,
               private jgService: JgService,
               private fundraisingPagesService: FundraisingPagesService ) {
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
    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data[0].gameLineUp;
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
    this.fundraisingPagesService.getFundraisingPagesIdArray().pipe(map((data: FundraisingPageId[]) => {
      this.justGivingPages = Array.from(Object.values(data[0].fundraisingPages))
        .sort((a: FundraisingPage, b: FundraisingPage) => a.eventDate.seconds - b.eventDate.seconds);
    })).subscribe();
    this.trackedDonations$ = this.donationTrackingService.getTrackedDonationArray();
    this.trackedDonations$.subscribe(data => {
      this.trackedDonationIds = data.filter(x => x.id === 'TEST-DONATIONS');
      this.trackedDonations = data.find(x => x.id === 'TEST-DONATIONS').donations;
    });
  }

  onOpenAddGameModalClick() {
    this.tempAddGame.order = this.gameLineUp !== undefined ? Object.keys(this.gameLineUp).length : 0;
    this.addGameModal = this.modalService.open(this.addGameModalDialogRef);
  }

  onOpenAddManualDonationModalClick() {
    this.addManualDonationModal = this.modalService.open(this.addManualDonationModalDialogRef);
  }

  submitAddJustGivingPage() {
    if (this.inputJustGivingPageUrl.trim().length >= 1
        && !this.justGivingPages.some(x => x.pageShortName === this.inputJustGivingPageUrl)) {
      const jgResult = this.jgService.getFundraisingPageDetailsByPageShortName(this.inputJustGivingPageUrl)
        .subscribe((data: FundraisingPageDetails) => {
        const temp: FundraisingPage = {
          pageId: data.pageId,
          pageShortName: this.inputJustGivingPageUrl,
          eventDate: Timestamp.fromDate(this.jgService.parseJustGivingDateString(data.eventDate)),
          image: data.image,
          title: data.title,
          story: data.story,
          currencyCode: data.currencyCode,
          currencySymbol: data.currencySymbol,
          grandTotalRaisedExcludingGiftAid: data.grandTotalRaisedExcludingGiftAid,
          vendor: 'JustGiving'
        };
        this.justGivingPages.push(temp);
        this.fundraisingPagesService.setFundraisingPages(this.justGivingPages);
      });
    }
  }

  refreshFundraisingPage(pageShortName: string) {
    const jgResult = this.jgService.getFundraisingPageDetailsByPageShortName(pageShortName)
      .subscribe((data: FundraisingPageDetails) => {
        const temp: FundraisingPage = {
          pageId: data.pageId,
          pageShortName: this.inputJustGivingPageUrl,
          eventDate: Timestamp.fromDate(this.jgService.parseJustGivingDateString(data.eventDate)),
          image: data.image,
          title: data.title,
          story: data.story,
          currencyCode: data.currencyCode,
          currencySymbol: data.currencySymbol,
          grandTotalRaisedExcludingGiftAid: data.grandTotalRaisedExcludingGiftAid,
          vendor: 'JustGiving'
        };
        this.justGivingPages = this.justGivingPages.filter(x => x.pageShortName !== pageShortName);
        this.justGivingPages.push(temp);
        this.fundraisingPagesService.setFundraisingPages(this.justGivingPages);
      });
  }

  deleteFundraisingPage(pageShortName: string) {
    this.justGivingPages = this.justGivingPages.filter(x => x.pageShortName !== pageShortName);
    this.fundraisingPagesService.setFundraisingPages(this.justGivingPages);
  }

  getTrackedDonationCount(pageShortName: string): number {
    return this.trackedDonations.filter(x => x.pageShortName === pageShortName).length;
  }

  getTrackedDonationTotal(pageShortName: string): number {
    return this.trackedDonations.filter(x => x.pageShortName === pageShortName).reduce((a, b) => a + b.donationAmount, 0);
  }

  deleteDonation(donationId: number) {
    this.donationTrackingService.removeTrackedDonation([this.trackedDonations.find(x => x.id === donationId)]);
  }

  stripHtml(html: string): string {
    html = html.replace('&lt;p&gt;', '');
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || '';
  }

  getSumOfJustGivingPages(): string {
    let grandTotalRaisedExcludingGiftAid = 0;
    this.justGivingPages.forEach(page => {
      grandTotalRaisedExcludingGiftAid += Number(page.grandTotalRaisedExcludingGiftAid).valueOf();
    });
    return grandTotalRaisedExcludingGiftAid.toFixed(2);
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
      pageShortName: 'Manual',
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

  importFundraisingPageDonations(pageShortName: string) {
    this.jgService.getAllJustGivingDonationsByPageShortName(pageShortName).pipe(
      map((donations: JustGivingDonation[]) => {
        return donations.filter(donation => !this.trackedDonations?.some(x => x.id === donation.id));
      }),
      map((newDonations: JustGivingDonation[]) => {
        console.log('getNewJustGivingDonations', newDonations, this.trackedDonations);
        from(newDonations.reverse()).pipe(
          map((donation: JustGivingDonation) => this.donationTrackingService
            .convertJustGivingDonationToTrackedDonation(pageShortName, donation)),
          map((trackedDonation: TrackedDonation) => profanityFilter(trackedDonation)),
          concatMap((trackedDonation: TrackedDonation) => of(trackedDonation).pipe(
            map((donation: TrackedDonation) => {
              const donationExists = this.donationTrackingService.trackedDonationExists(donation);
              console.log('trackedDonationExists', donation, donationExists);
              if (!donationExists) {
                this.donationTrackingService.addTrackedDonation([donation]);
              }
            }),
            finalize(() => {
              console.log('next donationExists');
            })
          )),
        ).subscribe();
        // console.log('getAllJustGivingDonations:', donations);
        return newDonations;
      })).subscribe();
  }

}


