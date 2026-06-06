import { Component, OnInit } from '@angular/core';
import { faTwitch, faYoutube } from '@fortawesome/free-brands-svg-icons';
import { GameLineupService } from '../../../../services/firebase/game-lineup/game-lineup.service';
import { ScheduledVideoGame } from '../../../../models/video-game';
import { CurrentlyPlayingService } from '../../../../services/firebase/currently-playing/currently-playing.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-ds-runner-name',
  templateUrl: './ds-runner-name.component.html',
  styleUrls: ['./ds-runner-name.component.css']
})
export class DsRunnerNameComponent implements OnInit {
  public currentGame: string;
  public zeldaGame: ScheduledVideoGame = new ScheduledVideoGame(null, null, null, null, null, 0);
  public gameLineUp: ScheduledVideoGame[];
  public faTwitch = faTwitch;
  public faYoutube = faYoutube;

  constructor( private gameLineupService: GameLineupService,
               private currentlyPlayingService: CurrentlyPlayingService ) {

    this.currentlyPlayingService.getCurrentlyPlaying().pipe(map(data => {
      this.currentGame = data[0].index;
    })).subscribe();

    this.gameLineupService.getGameLineUp().pipe(map(data => {
      this.gameLineUp = data.find(x => x.id === 'ACTIVE-SCHEDULE').activeSchedule;
      this.zeldaGame = this.gameLineUp.find(x => x.gameProgressKey === this.currentGame);
    })).subscribe();

  }

  ngOnInit() {
  }

}
