import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {
  CurrentlyPlaying, CurrentlyPlayingId,
  CurrentlyPlayingService
} from "../../services/firebase/currently-playing/currently-playing.service";
import {ModalDismissReasons, NgbActiveModal, NgbModal} from "@ng-bootstrap/ng-bootstrap";


@Component({
  selector: 'app-obs',
  templateUrl: './obs.component.html',
  styleUrls: ['./obs.component.css']
})
export class ObsComponent implements OnInit {
  @ViewChild('yesNoModalDialog')
  private yesNoModalDialogRef : TemplateRef<any>;
  public yesNoModal: NgbActiveModal;

  public currentlyPlaying: CurrentlyPlayingId[];
  public gameList: CurrentlyPlaying[];
  public swapToGame: CurrentlyPlaying;

  constructor(private modalService: NgbModal,
              private currentlyPlayingService: CurrentlyPlayingService) {
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

}


