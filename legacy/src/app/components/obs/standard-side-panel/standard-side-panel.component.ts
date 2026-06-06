import {AfterViewInit, Component, OnInit, ViewChild} from '@angular/core';
import {SspGameDescriptionComponent} from './ssp-game-description/ssp-game-description.component';
import {SspCameraComponent} from './ssp-camera/ssp-camera.component';
import {SspRunnerNameComponent} from './ssp-runner-name/ssp-runner-name.component';
import {SspTimerComponent} from './ssp-timer/ssp-timer.component';
import {SspAdPanelComponent} from './ssp-ad-panel/ssp-ad-panel.component';

@Component({
  selector: 'app-standard-side-panel',
  templateUrl: './standard-side-panel.component.html',
  styleUrls: ['./standard-side-panel.component.css']
})
export class StandardSidePanelComponent implements OnInit, AfterViewInit {
  @ViewChild(SspGameDescriptionComponent)
  private gameDescriptionComponent: SspGameDescriptionComponent;
  @ViewChild(SspCameraComponent)
  private cameraComponent: SspCameraComponent;
  @ViewChild(SspRunnerNameComponent)
  private runnerNameComponent: SspRunnerNameComponent;
  @ViewChild(SspTimerComponent)
  private sspTimerComponent: SspTimerComponent;
  @ViewChild(SspAdPanelComponent)
  private adPanelComponent: SspAdPanelComponent;

  constructor() {
  }

  ngOnInit() {
  }

  ngAfterViewInit(): void {
  }

}
