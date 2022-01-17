import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import moment from 'moment';

import {
  ChannelInformation,
  SearchChannelsResponse,
  TwitchService,
  UserInformation
} from '../../services/twitch-service/twitch-service.service';
import { GameLineupService } from '../../services/firebase/game-lineup/game-lineup.service';

import { HowLongToBeatGameDetail } from '../../services/howlongtobeat-service/howlongtobeat-models';
import { ScheduledVideoGame } from '../../models/video-game';
import {CurrentlyPlayingService} from '../../services/firebase/currently-playing/currently-playing.service';


@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css']
})
export class ScheduleComponent implements OnInit {

  public startDate: Date;
  public now: Date;

  public activeSchedule$: BehaviorSubject<ScheduledVideoGame[]> = new BehaviorSubject<ScheduledVideoGame[]>([]);
  public currentGameName: string;

  public twitchUser: UserInformation;
  public twitchSearch: SearchChannelsResponse;
  public twitchChannelInfo: ChannelInformation;
  public isLive = false;

  constructor( private router: Router,
               private twitchService: TwitchService,
               private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {
  }

  ngOnInit() {
    this.now = new Date();

    this.twitchService.getSearchChannels('zeldathonuk', 1, false).subscribe((data) => {
      this.twitchSearch = data;
      this.isLive = data.is_live;
    });

    this.twitchService.getUserInformation().subscribe((user) => {
      this.twitchUser = user.data[0];
      this.twitchService.getChannelInformation(parseInt(this.twitchUser.id, 10)).subscribe((channel) => {
        this.twitchChannelInfo = channel;
      });
    });

    this.gameLineupService.getGameLineUp().pipe(map((data) => {
      // console.log('activeSchedule', data[0].activeSchedule);
      this.activeSchedule$.next(data[0].activeSchedule
        .sort((a: ScheduledVideoGame, b: ScheduledVideoGame) => a.order - b.order));
      this.startDate = data[0].startTimestamp.toDate();
    })).subscribe();

    this.currentlyPlayingService.getCurrentlyPlaying().subscribe((data) => {
      this.currentGameName = data[0].index;
    });

  }

  routeToLiveView() {
    this.router.navigate(['']).then();
  }

  isCurrentlyPlaying(index: number): boolean {
    return this.activeSchedule$.getValue()[index].gameDetail.title === this.twitchChannelInfo?.game_name;
  }

  hasBeenPlayed(index: number): boolean {
    return this.activeSchedule$.getValue()[index]?.isCompleted;
  }

  calculateStartDate(i: number): Date {
    if (i === 0) {
      return this.startDate;
    } else {
      let prevStartDate: Date = this.startDate;
      const activeSchedule: ScheduledVideoGame[] = this.activeSchedule$.getValue();
      for (let j = 1; j < activeSchedule.length; j++) {
        const prevGame = this.getTimeToBeatMainStoryRushed(activeSchedule[j - 1].gameDetail);
        const hours = parseInt(prevGame.match(/\d+(?=h)/g)[0], 10);
        const mins = parseInt(prevGame.match(/\d+(?=m)/g)[0], 10);
        if (i === j) {
          return moment(prevStartDate).add(hours, 'h').add(mins, 'm').toDate();
        }
        prevStartDate = moment(prevStartDate).add(hours, 'h').add(mins, 'm').toDate();
      }
    }
  }

  getTimeToBeatMainStory(howLongToBeatGameDetail: HowLongToBeatGameDetail) {
    return howLongToBeatGameDetail.titleGameTimes.find(x => x.label === 'Main Story').time;
  }

  getTimeToBeatMainStoryRushed(howLongToBeatGameDetail: HowLongToBeatGameDetail) {
    return howLongToBeatGameDetail.gameTimes.split('</td><td>')[5];
  }

}
