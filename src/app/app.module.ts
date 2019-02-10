/* MODULES */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MomentModule } from "ngx-moment";
import { CountdownModule } from "ngx-countdown";
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule } from '@angular/fire';
import { AngularFireAuthModule } from '@angular/fire/auth';
import { AngularFirestoreModule } from '@angular/fire/firestore';

// Environment Variables
import { environment } from "../environments/environment";

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
import { OmnibarComponent } from './components/obs/omnibar/omnibar.component';
import { StandardSidePanelComponent } from './components/obs/standard-side-panel/standard-side-panel.component';
import { GameDescriptionComponent } from './components/obs/standard-side-panel/game-description/game-description.component';
import { CameraComponent } from './components/obs/standard-side-panel/camera/camera.component';
import { RunnerNameComponent } from './components/obs/standard-side-panel/runner-name/runner-name.component';
import { SspTimerComponent } from './components/obs/standard-side-panel/ssp-timer/ssp-timer.component';
import { AdPanelComponent } from './components/obs/standard-side-panel/ad-panel/ad-panel.component';
import { GameTrackingComponent } from './components/game-tracking/game-tracking.component';
import { LoginComponent } from './components/login/login.component';


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
    OmnibarComponent,
    StandardSidePanelComponent,
    GameDescriptionComponent,
    CameraComponent,
    RunnerNameComponent,
    SspTimerComponent,
    AdPanelComponent,
    GameTrackingComponent,
    LoginComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    NgbModule,
    FontAwesomeModule,
    MomentModule,
    CountdownModule,
    AngularFireModule.initializeApp(environment.firebase, 'zeldathonuk'),
    AngularFireAuthModule,
    AngularFirestoreModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
