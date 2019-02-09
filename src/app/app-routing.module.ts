import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { HomeComponent } from "./components/home/home.component";
import { DonationsComponent } from "./components/donations/donations.component";
import { IncentivesComponent } from "./components/incentives/incentives.component";
import { TimersComponent } from "./components/timers/timers.component";
import { CountdownComponent } from "./components/timers/countdown/countdown.component";
import { CountupComponent } from "./components/timers/countup/countup.component";
import { CountDateComponent } from "./components/timers/count-date/count-date.component";
import { ObsComponent } from "./components/obs/obs.component";
import { PageNotFoundComponent } from "./components/page-not-found/page-not-found.component";
import { GameTrackingComponent } from "./components/game-tracking/game-tracking.component";

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '', redirectTo: '/',  pathMatch: 'full' },
  { path: 'donors', component: DonationsComponent },
  { path: 'donations', component: DonationsComponent },
  { path: 'incentives', component: IncentivesComponent },
  { path: 'obs', component: ObsComponent },
  { path: 'obs/standard', component: ObsComponent },
  { path: 'tracking/:game', component: GameTrackingComponent },
  { path: 'api/timers', component: TimersComponent },
  { path: 'api/count-up', component: CountupComponent },
  { path: 'api/count-down', component: CountdownComponent },
  { path: 'api/count-to-date', component: CountDateComponent },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(
      routes,
      { enableTracing: false }
    )
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
