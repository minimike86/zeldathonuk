import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuardService as AuthGuard } from './router/guards/auth-guard.service';

// Components
import { HomeComponent } from './components/home/home.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { DonationsComponent } from './components/donations/donations.component';
import { IncentivesComponent } from './components/incentives/incentives.component';
import { TimersComponent } from './components/timers/timers.component';
import { CountupComponent } from './components/timers/countup/countup.component';
import { ObsComponent } from './components/obs/obs.component';
import { ObsLayoutComponent } from './components/obs/layout/obs-layout.component';
import { GameTrackingComponent } from './components/game-tracking/game-tracking.component';
import { LoginComponent } from './components/login/login.component';
import { ScheduleComponent } from './components/schedule/schedule.component';
import { PrivacyPolicyComponent } from './components/privacy-policy/privacy-policy.component';
import { TermsOfUseComponent } from './components/terms-of-use/terms-of-use.component';
import { AudioVisualizerComponent } from './components/audio-visualizer/audio-visualizer.component';
import { AboutComponent } from './components/about/about.component';
import { HistoryComponent } from './components/history/history.component';
import { CharityComponent } from './components/charity/charity.component';


const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '', redirectTo: '/',  pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'privacy', component: PrivacyPolicyComponent },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'terms', component: TermsOfUseComponent },
  { path: 'terms-of-service', component: TermsOfUseComponent },
  { path: 'donors', component: DonationsComponent },
  { path: 'donate', component: DonationsComponent },
  { path: 'donations', component: DonationsComponent },
  { path: 'incentives', component: IncentivesComponent },
  { path: 'schedule', component: ScheduleComponent },
  { path: 'about', component: AboutComponent },
  { path: 'history', component: HistoryComponent },
  { path: 'charity', component: CharityComponent },
  { path: 'obs', component: ObsComponent },
  { path: 'obs/layout/:layout', component: ObsLayoutComponent },
  { path: 'obs/audio-countdown', component: AudioVisualizerComponent },
  { path: 'tracking/:game', component: GameTrackingComponent },
  { path: 'api/timers', component: TimersComponent },
  { path: 'api/count-up', component: CountupComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      {
    enableTracing: false,
    relativeLinkResolution: 'legacy'
}
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
