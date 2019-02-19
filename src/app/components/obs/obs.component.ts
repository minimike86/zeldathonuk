import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { CurrentlyPlayingService } from "../../services/firebase/currently-playing/currently-playing.service";
import { NgbActiveModal, NgbModal } from "@ng-bootstrap/ng-bootstrap";
import { CurrentlyPlaying, CurrentlyPlayingId } from "../../services/firebase/currently-playing/currently-playing";
import { FirebaseTimerService } from "../../services/firebase/firebase-timer/firebase-timer.service";
import { CountUpTimerId } from "../../services/firebase/firebase-timer/count-up-timer";


@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css']
})
export class ObsComponent implements OnInit {
  @ViewChild('yesNoModalDialog')
  private yesNoModalDialogRef : TemplateRef<any>;
  public yesNoModal: NgbActiveModal;

  public countUpTimer: CountUpTimerId[];

  public currentlyPlaying: CurrentlyPlayingId[];
  public gameList: CurrentlyPlaying[];
  public swapToGame: CurrentlyPlaying;

  constructor(private modalService: NgbModal,
              private firebaseTimerService: FirebaseTimerService,
              private currentlyPlayingService: CurrentlyPlayingService) {
    firebaseTimerService.getCountUpTimer().subscribe(data => {
      this.countUpTimer = data;
    });
    currentlyPlayingService.getCurrentlyPlaying().subscribe(data => {
      this.currentlyPlaying = data;
    });
    this.gameList = currentlyPlayingService.gameList;
    this.swapToGame = null;
  }

  ngOnInit() {
  }

  onSwapGameClick(game: CurrentlyPlaying) {
    this.swapToGame = game;
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

}


