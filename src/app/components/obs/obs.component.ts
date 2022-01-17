import { Component, Injectable, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { KeyValue } from '@angular/common';

import {BehaviorSubject, from, Observable, of} from 'rxjs';
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
import { HowLongToBeatService } from '../../services/howlongtobeat-service/howlongtobeat.service';
import { MessageService } from 'primeng/api';

import {ScheduledVideoGame, VideoGame} from '../../models/video-game';
import firebase from 'firebase/compat/app';
import Timestamp = firebase.firestore.Timestamp;

import { sha256 } from 'js-sha256';

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
import {HowLongToBeatGameDetail, HowLongToBeatSearchResult} from '../../services/howlongtobeat-service/howlongtobeat-models';
import {OverlayPanel} from 'primeng/overlaypanel';
import {PickList} from 'primeng/picklist';
import {MoveToScheduleDialogComponent} from './move-to-schedule-dialog/move-to-schedule-dialog.component';
import {DialogService, DynamicDialogRef} from 'primeng/dynamicdialog';


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

  @ViewChild('editGameScheduleItemDialog')
  private editGameScheduleItemDialogRef: TemplateRef<any>;
  public editGameScheduleItemModal: NgbActiveModal;

  @ViewChild('searchHowLongToBeatOverlayPanel')
  private searchHowLongToBeatOverlayPanel: OverlayPanel;

  @ViewChild('pickListSchedule')
  private pickListSchedule: PickList;

  public showObsLayouts = false;
  public showBreakCountdownDate = false;
  public showTimer = false;
  public showRunnerName = false;
  public showAddDonation = false;
  public showEditSchedule = false;
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

  public justGivingPages: FundraisingPage[] = [];
  public inputJustGivingPageUrl = '';
  public trackedDonations$: Observable<TrackedDonationId[]>;
  public trackedDonationIds: TrackedDonationId[];
  public trackedDonations: TrackedDonation[];
  public selectedDonations: TrackedDonation[];

  public tempTrackedDonation: TrackedDonation;
  public donationDate: string;
  public donationTime: string;

  public tempAddZeldaGameKey: string;
  public tempAddZeldaGame: VideoGame;

  public currentlyPlaying = {id: '', index: ''};
  public sortedGameLineUp: VideoGame[];
  public swapGameKey: KeyValue<string, VideoGame>;

  public hltbSearchQuery = 'zelda';
  public hltbSearchResults: HowLongToBeatSearchResult[] = [];
  public availableGames$: BehaviorSubject<VideoGame[]> = new BehaviorSubject<VideoGame[]>([]);
  public activeSchedule$: BehaviorSubject<ScheduledVideoGame[]> = new BehaviorSubject<ScheduledVideoGame[]>([]);
  public editVideoGame: ScheduledVideoGame;
  public startDate: Date = new Date(Date.parse('25 Feb 2022 09:00:00 GMT'));
  public searchingForGame = false;
  public addingGame = false;
  public addingGameId: string;

  public dynamicDialogRef: DynamicDialogRef;

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
               private dialogService: DialogService,
               private messageService: MessageService,
               private howLongToBeatService: HowLongToBeatService,
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

    this.gameLineupService.getGameLineUp().pipe(map((data) => {
      this.sortedGameLineUp = data.find(x => x.id === 'AVAILABLE-GAMES').availableGames
        .sort((a: VideoGame, b: VideoGame) => a.order - b.order);
      this.availableGames$.next(this.sortedGameLineUp);
      this.tempAddZeldaGame.order = this.sortedGameLineUp.length;
    })).subscribe();

    this.gameLineupService.getGameLineUp().pipe(map((data) => {
      this.activeSchedule$.next(data[0].activeSchedule
        .sort((a: ScheduledVideoGame, b: ScheduledVideoGame) => a.order - b.order));
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
    this.tempAddZeldaGame.order = this.sortedGameLineUp !== undefined ? this.sortedGameLineUp.length : 0;
    this.addGameModal = this.modalService.open(this.addGameModalDialogRef);
  }

  onOpenAddManualDonationModalClick() {
    this.addManualDonationModal = this.modalService.open(this.addManualDonationModalDialogRef);
  }

  submitAddJustGivingPage() {
    if (this.inputJustGivingPageUrl.trim().length >= 1
        && !this.justGivingPages.some(x => x.pageShortName === this.inputJustGivingPageUrl)) {
      this.jgService.getFundraisingPageDetailsByPageShortName(this.inputJustGivingPageUrl)
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
    this.jgService.getFundraisingPageDetailsByPageShortName(pageShortName)
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
    this.gameLineupService.addAvailableGames([this.tempAddZeldaGame]);
    this.addGameModal.close();
    this.clearAddGame();
  }

  clearAddGame() {
    this.tempAddZeldaGame = {
      gameDetail: null,
      gameProgressKey: null,
      category: null,
      active: true,
      order: this.sortedGameLineUp !== undefined ? this.sortedGameLineUp.length : 0
    };
  }

  onSwapGameClick(game: VideoGame) {
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

  searchHowLongToBeat(searchQuery: string) {
    this.searchingForGame = true;
    this.howLongToBeatService.search(searchQuery).subscribe((data) => {
      const bothLists = this.getBothAvailableGamesAndActiveSchedule();
      this.hltbSearchResults = data.filter(item => !bothLists.some(x => x.gameDetail.id === item.id));
      this.searchingForGame = false;
    });
  }

  reFilterSearchHowLongToBeat() {
    this.hltbSearchResults = this.hltbSearchResults.filter(item =>
      this.getBothAvailableGamesAndActiveSchedule().some(x => x.gameDetail.id === item.id));
  }

  addGameToAvailableGames(gameId: string) {
    this.addingGame = true;
    this.addingGameId = gameId;
    const bothLists = this.getBothAvailableGamesAndActiveSchedule();
    if (!bothLists.some(x => x.gameDetail.id === gameId)) {
      this.howLongToBeatService.getDetail(gameId).subscribe((data) => {
        if (data.id !== null) {

          // const availableGames: HowLongToBeatGameDetail[] = this.availableGames$.getValue();
          // availableGames.push(data);
          // this.availableGames$.next(availableGames);

          const zeldaGame: VideoGame = {
            gameDetail: data,
            gameProgressKey: this.getGameProgressKey(data.title),
            category: 'category',
            active: true,
            order: this.sortedGameLineUp !== undefined ? this.sortedGameLineUp.length : 0
          };
          this.gameLineupService.addAvailableGames([zeldaGame]);

          this.searchHowLongToBeatOverlayPanel.toggle(true);
          const upButton: HTMLElement = document.querySelector('body > app-root > div > div > app-obs > div > div > div > div.my-3.ng-star-inserted > p-picklist > div > div.p-picklist-buttons.p-picklist-source-controls.ng-star-inserted > button:nth-child(1)');
          upButton.click();
          this.messageService.add({severity: 'success', detail: data.title + ' added to available games!'});
          this.reFilterSearchHowLongToBeat();
          this.addingGame = false;

        } else {
          // Game ID was null
          this.messageService.add({severity: 'error', detail: 'Game ID was null!'});
          this.addingGame = false;
        }
      });
    } else {
      // already in the available games
      this.messageService.add({severity: 'error', detail: bothLists.find(x => x.gameDetail.id === gameId).gameDetail.title + ' is already in the available games, or active schedule list!'});
      this.addingGame = false;
    }
  }

  onMoveToSource(event: any) {
    console.log('game moved to source', event);
    this.gameLineupService.removeGameFromActiveSchedule([event.items[0]]);
  }

  onMoveToTarget(event: any) {
    console.log('game moved to target', event);
    this.dynamicDialogRef = this.dialogService.open(MoveToScheduleDialogComponent, {
      data: event.items,
      header: 'Schedule Game',
      width: '70%',
      closable: true,
      closeOnEscape: true,
      dismissableMask: false
    });
    this.dynamicDialogRef.onClose.subscribe((scheduledZeldaGame: ScheduledVideoGame) => {
      if (Object(scheduledZeldaGame).hasOwnProperty('platform')) {
        this.messageService.add({severity: 'info', summary: 'ZeldaGame Scheduled', detail: 'title:' + scheduledZeldaGame.gameDetail.title});
        this.gameLineupService.updateGameToActiveSchedule([scheduledZeldaGame]);
      }
    });
  }

  onSourceReorder(event: any) {
    console.log('game source re-ordered', event);
  }

  onTargetReorder(event: any) {
    const tempActiveSchedule: ScheduledVideoGame[] = this.activeSchedule$.getValue();
    for (let i = 0; i < tempActiveSchedule.length; i++) {
      tempActiveSchedule[i].order = i;
    }
    this.gameLineupService.purgeActiveSchedule();
    this.gameLineupService.updateGameToActiveSchedule(tempActiveSchedule);
    console.log('game target re-ordered', event, tempActiveSchedule);
  }

  getTimeToBeatMainStory(howLongToBeatGameDetail: HowLongToBeatGameDetail) {
    return howLongToBeatGameDetail.titleGameTimes.find(x => x.label === 'Main Story').time;
  }

  deleteActiveScheduledGame(zeldaGame: VideoGame|ScheduledVideoGame) {
    if (zeldaGame.hasOwnProperty('platform')) {
      this.gameLineupService.removeGameFromActiveSchedule([<ScheduledVideoGame>zeldaGame]);
    } else if (zeldaGame.hasOwnProperty('gameDetail')) {
    }
  }

  editActiveScheduledGame(videoGame: ScheduledVideoGame) {
    this.editVideoGame = videoGame;
    if (videoGame.hasOwnProperty('platform')) {
      // Edit Scheduled
      this.editGameScheduleItemModal = this.modalService.open(this.editGameScheduleItemDialogRef, { size: 'lg', backdrop: 'static' });
    } else if (videoGame.hasOwnProperty('gameDetail')) {
    }
  }

  getGameProgressKey(title: string): string {
    return title.toUpperCase()
      .replace('THE LEGEND OF ZELDA: ', '')
      .replace(/-/g, '')
      .replace(/'/g, '')
      .replace(/\(/g, '')
      .replace(/\)/g, '')
      .replace(/\s/g, '-');
  }

  getBothAvailableGamesAndActiveSchedule(): VideoGame[] {
    const availableGames: VideoGame[] = this.availableGames$.getValue();
    const activeSchedule: VideoGame[] = this.activeSchedule$.getValue();
    return [...availableGames, ...activeSchedule];
  }

  bothAvailableGamesAndActiveScheduleContainsGameId(gameId: string): boolean {
    return this.getBothAvailableGamesAndActiveSchedule().some(x => x.gameDetail.id === gameId);
  }

  updateActiveScheduleStartTimestamp() {
    this.gameLineupService.updateActiveScheduleStartTimestamp(this.startDate);
  }

}
