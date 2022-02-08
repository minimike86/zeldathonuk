import { Component, HostListener, OnInit } from '@angular/core';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { faDiscord, faFacebook, faTwitch, faYoutube, faTwitter } from '@fortawesome/free-brands-svg-icons';

import { ConfirmationService } from 'primeng/api';
import {CurrentlyPlayingService} from '../../services/firebase/currently-playing/currently-playing.service';
import {BehaviorSubject} from 'rxjs';
import {map} from 'rxjs/operators';
import {GameLineupService} from '../../services/firebase/game-lineup/game-lineup.service';
import {ScheduledVideoGame} from '../../models/video-game';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import moment from 'moment';


@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  innerWidth: any;
  public timeAgo: TimeAgo;

  faDiscord = faDiscord;
  faFacebook = faFacebook;
  faTwitch = faTwitch;
  faTwitter = faTwitter;
  faYoutube = faYoutube;
  faInfoCircle = faInfoCircle;

  scheduledVideoGame$: BehaviorSubject<ScheduledVideoGame[]> = new BehaviorSubject<ScheduledVideoGame[]>([]);
  currentVideoGame$: BehaviorSubject<ScheduledVideoGame> = new BehaviorSubject<ScheduledVideoGame>(null);
  nextVideoGame$: BehaviorSubject<ScheduledVideoGame> = new BehaviorSubject<ScheduledVideoGame>(null);
  currentlyPlaying$: BehaviorSubject<string> = new BehaviorSubject<string>(null);
  startDate$: BehaviorSubject<Date> = new BehaviorSubject<Date>(null);

  constructor( private confirmationService: ConfirmationService,
               private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
  }

  ngOnInit() {
    this.innerWidth = window.innerWidth;
    TimeAgo.addLocale(en);
    this.timeAgo = new TimeAgo('en-GB');

    this.gameLineupService.getGameLineUp().pipe(map((data) => {
      this.scheduledVideoGame$.next(data.find(x => x.id === 'ACTIVE-SCHEDULE').activeSchedule);
      this.startDate$.next(data.find(x => x.id === 'ACTIVE-SCHEDULE').startTimestamp.toDate());
      // console.log('getGameLineUp', this.scheduledVideoGame$.getValue());
      this.updatePlaylist();
    })).subscribe();

    this.currentlyPlayingService.getCurrentlyPlaying().subscribe((data) => {
      this.currentlyPlaying$.next(data.find(x => x.id === 'CURRENTLY-PLAYING').index);
      // console.log('getCurrentlyPlaying', this.currentlyPlaying$.getValue());
      this.updatePlaylist();
    });
  }

  updatePlaylist() {
    this.currentVideoGame$.next(this.scheduledVideoGame$.getValue().find(x => x.gameProgressKey === this.currentlyPlaying$.getValue()));
    this.nextVideoGame$.next(this.scheduledVideoGame$.getValue()[this.scheduledVideoGame$.getValue().findIndex(x =>
      x.gameProgressKey === this.currentlyPlaying$.getValue()) + 1]);
  }

  isNowBeforeStartDate(startDate: Date): boolean {
    return !moment().isBefore(moment(startDate));
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.innerWidth = window.innerWidth;
  }

  confirm(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      icon: 'pi pi-exclamation-triangle',
      message: 'Don\'t be fooled by JustGivings "0% Platform Fee"! JustGiving charges non-profits a £39 (+VAT) monthly charge ' +
               'in addition to deducting a "Platform Processing Fee" of 1.9% + £0.20p fee from every donation. ' +
               'Finally JustGiving will further deduct 5% from any GiftAdd added by eligible UK tax payers.',
      accept: () => {
        this.donateJustGiving();
      },
      acceptLabel: 'Donate Anyway',
      acceptButtonStyleClass: 'p-button-warning',
      rejectLabel: 'Cancel',
      rejectButtonStyleClass: 'p-button-outlined p-button-secondary'
    });
  }

  donateFacebook() {
    window.open('https://www.facebook.com/donate/5194665980557244/?fundraiser_source=https://www.zeldathon.co.uk/', '_blank');
  }

  donateTiltify() {
    window.open('https://donate.tiltify.com/@msec/zeldathonuk-gameblast22', '_blank');
  }

  donateJustGiving() {
    window.open('https://www.justgiving.com/fundraising/zeldathonuk-gameblast2022', '_blank');
  }

  learnAboutSpecialEffect() {
    window.open('https://www.specialeffect.org.uk/what-we-do', '_blank');
  }

  learnAboutGameBlast() {
    window.open('https://www.gameblast.org.uk/about/', '_blank');
  }

}
