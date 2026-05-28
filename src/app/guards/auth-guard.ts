import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  let authService = inject(Auth);
  let router = inject(Router);

  if (authService.estaLogueado()) {
    return true;
  }
  else {
    return router.parseUrl("/login");
  }
};
