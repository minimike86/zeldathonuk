/* MODULES */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { CountdownModule } from "ngx-countdown";
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';

// Environment Variables
import { environment } from "../environments/environment";

/* SERVICES */
import { AuthGuardService } from "./router/guards/auth-guard.service";
import { JgServiceService } from "./services/jg-service/jg-service.service";

/* COMPONENTS */
import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { FooterComponent } from './components/footer/footer.component';
import { JgDonationComponent } from './components/jg-donation/jg-donation.component';
import { TimersComponent } from './components/timers/timers.component';
import { FbDonationComponent } from './components/fb-donation/fb-donation.component';
import { CountdownComponent } from './components/timers/countdown/countdown.component';
import { CountupComponent } from './components/timers/countup/countup.component';
import { CountDateComponent } from './components/timers/count-date/count-date.component';
import { IncentivesComponent } from './components/incentives/incentives.component';
import { DonationsComponent } from './components/donations/donations.component';
import { ObsComponent } from './components/obs/obs.component';
import { StandardSidePanelComponent } from './components/obs/standard-side-panel/standard-side-panel.component';
  import { SspGameDescriptionComponent } from './components/obs/standard-side-panel/ssp-game-description/ssp-game-description.component';
  import { SspCameraComponent } from './components/obs/standard-side-panel/ssp-camera/ssp-camera.component';
  import { SspRunnerNameComponent } from './components/obs/standard-side-panel/ssp-runner-name/ssp-runner-name.component';
  import { SspTimerComponent } from './components/obs/standard-side-panel/ssp-timer/ssp-timer.component';
  import { SspAdPanelComponent } from './components/obs/standard-side-panel/ssp-ad-panel/ssp-ad-panel.component';
import { OmnibarComponent } from './components/obs/omnibar/omnibar.component';
import { GameTrackingComponent } from './components/game-tracking/game-tracking.component';
import { LoginComponent } from './components/login/login.component';
import { WidescreenSidePanelComponent } from './components/obs/widescreen-side-panel/widescreen-side-panel.component';
import { Ds3BottomPanelComponent } from './components/obs/ds3-bottom-panel/ds3-bottom-panel.component';
import { DsvSidePanelComponent } from './components/obs/dsv-side-panel/dsv-side-panel.component';
import { WspAdPanelComponent } from './components/obs/widescreen-side-panel/wsp-ad-panel/wsp-ad-panel.component';
import { WspCameraComponent } from './components/obs/widescreen-side-panel/wsp-camera/wsp-camera.component';
import { WspGameDescriptionComponent } from './components/obs/widescreen-side-panel/wsp-game-description/wsp-game-description.component';
import { WspRunnerNameComponent } from './components/obs/widescreen-side-panel/wsp-runner-name/wsp-runner-name.component';
import { WspTimerComponent } from './components/obs/widescreen-side-panel/wsp-timer/wsp-timer.component';
import { DsvGameDescriptionComponent } from './components/obs/dsv-side-panel/dsv-game-description/dsv-game-description.component';
import { DsvCameraComponent } from './components/obs/dsv-side-panel/dsv-camera/dsv-camera.component';
import { DsvRunnerNameComponent } from './components/obs/dsv-side-panel/dsv-runner-name/dsv-runner-name.component';
import { DsvTimerComponent } from './components/obs/dsv-side-panel/dsv-timer/dsv-timer.component';
import { DsvAdPanelComponent } from './components/obs/dsv-side-panel/dsv-ad-panel/dsv-ad-panel.component';
import { ObsLayoutComponent } from './components/obs/layout/obs-layout.component';
import { Ds3AdPanelComponent } from './components/obs/ds3-bottom-panel/ds3-ad-panel/ds3-ad-panel.component';
import { Ds3CameraComponent } from './components/obs/ds3-bottom-panel/ds3-camera/ds3-camera.component';
import { Ds3GameDescriptionComponent } from './components/obs/ds3-bottom-panel/ds3-game-description/ds3-game-description.component';
import { Ds3RunnerNameComponent } from './components/obs/ds3-bottom-panel/ds3-runner-name/ds3-runner-name.component';
import { Ds3TimerComponent } from './components/obs/ds3-bottom-panel/ds3-timer/ds3-timer.component';
import { DsSidePanelComponent } from './components/obs/ds-side-panel/ds-side-panel.component';
import { DsCameraComponent } from './components/obs/ds-side-panel/ds-camera/ds-camera.component';
import { DsGameDescriptionComponent } from './components/obs/ds-side-panel/ds-game-description/ds-game-description.component';
import { DsRunnerNameComponent } from './components/obs/ds-side-panel/ds-runner-name/ds-runner-name.component';
import { DsTimerComponent } from './components/obs/ds-side-panel/ds-timer/ds-timer.component';


@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    PageNotFoundComponent,
    NavbarComponent,
    FooterComponent,
    JgDonationComponent,
    TimersComponent,
    FbDonationComponent,
    CountdownComponent,
    CountupComponent,
    CountDateComponent,
    IncentivesComponent,
    DonationsComponent,
    ObsComponent,
    ObsLayoutComponent,
    OmnibarComponent,
    StandardSidePanelComponent,
    SspGameDescriptionComponent,
    SspCameraComponent,
    SspRunnerNameComponent,
    SspTimerComponent,
    SspAdPanelComponent,
    GameTrackingComponent,
    LoginComponent,
    WidescreenSidePanelComponent,
    Ds3BottomPanelComponent,
    DsvSidePanelComponent,
    WspAdPanelComponent,
    WspCameraComponent,
    WspGameDescriptionComponent,
    WspRunnerNameComponent,
    WspTimerComponent,
    DsvGameDescriptionComponent,
    DsvCameraComponent,
    DsvRunnerNameComponent,
    DsvTimerComponent,
    DsvAdPanelComponent,
    Ds3AdPanelComponent,
    Ds3CameraComponent,
    Ds3GameDescriptionComponent,
    Ds3RunnerNameComponent,
    Ds3TimerComponent,
    DsSidePanelComponent,
    DsCameraComponent,
    DsGameDescriptionComponent,
    DsRunnerNameComponent,
    DsTimerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    NgbModule,
    FontAwesomeModule,
    CountdownModule,
    AngularFireModule.initializeApp(environment.firebase, 'zeldathonuk'),
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [AuthGuardService, JgServiceService],
  bootstrap: [AppComponent]
})
export class AppModule {}
