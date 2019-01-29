import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Components
import { HomeComponent } from "./components/home/home.component";
import { TimersComponent } from "./components/timers/timers.component";
import { CountdownComponent } from "./components/timers/countdown/countdown.component";
import { CountupComponent } from "./components/timers/countup/countup.component";
import { CountDateComponent } from "./components/timers/count-date/count-date.component";
import { PageNotFoundComponent } from "./components/page-not-found/page-not-found.component";

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: '', redirectTo: '/',  pathMatch: 'full' },
  { path: 'timers', component: TimersComponent },
  { path: 'count-up', component: CountupComponent },
  { path: 'count-down', component: CountdownComponent },
  { path: 'count-to-date', component: CountDateComponent },
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
