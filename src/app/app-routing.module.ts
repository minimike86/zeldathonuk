import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { HomeComponent } from "./components/home/home.component";
import { TimersComponent } from "./components/timers/timers.component";
import { CountdownComponent } from "./components/timers/countdown/countdown.component";
import { CountupComponent } from "./components/timers/countup/countup.component";
import { PageNotFoundComponent } from "./components/page-not-found/page-not-found.component";

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '', redirectTo: '/',  pathMatch: 'full' },
  { path: 'timers', component: TimersComponent },
  { path: 'countup', component: CountupComponent },
  { path: 'countup/:autoStart', component: CountupComponent },
  { path: 'countdown/:countdownDuration', component: CountdownComponent },
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
