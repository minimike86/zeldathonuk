import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {GameDescriptionComponent} from "./game-description/game-description.component";
import {CameraComponent} from "./camera/camera.component";
import {RunnerNameComponent} from "./runner-name/runner-name.component";
import {SspTimerComponent} from "./ssp-timer/ssp-timer.component";
import {AdPanelComponent} from "./ad-panel/ad-panel.component";

@Component({
  selector: 'app-standard-side-panel',
  templateUrl: './standard-side-panel.component.html',
  styleUrls: ['./standard-side-panel.component.css']
})
export class StandardSidePanelComponent implements OnInit, AfterViewInit {
  @ViewChild(GameDescriptionComponent)
  private gameDescriptionComponent: GameDescriptionComponent;
  @ViewChild(CameraComponent)
  private cameraComponent: CameraComponent;
  @ViewChild(RunnerNameComponent)
  private runnerNameComponent: RunnerNameComponent;
  @ViewChild(SspTimerComponent)
  private sspTimerComponent: SspTimerComponent;
  @ViewChild(AdPanelComponent)
  private adPanelComponent: AdPanelComponent;

  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

}
