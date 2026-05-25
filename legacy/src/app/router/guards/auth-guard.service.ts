import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthGuardService implements CanActivate {

  constructor(private afAuth: AngularFireAuth,
              private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot,
              state: RouterStateSnapshot): Observable<boolean> {

    return this.afAuth.authState.pipe(
      switchMap(user => {
        if (user) {
          console.log('AuthGuardService:', user);
          return of(true);
        } else {
          console.log('AuthGuardService:', false);
          this.router.navigate(['/login']).then();
          return of(false);
        }
      })
    );

  }

}
