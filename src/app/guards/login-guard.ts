import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth } from '../services/auth';

export const loginGuard: CanActivateFn = (route, state) => {
  let authService = inject(Auth);
  let router = inject(Router);

  if (authService.estaLogueado()) {
    return router.parseUrl("/home")
  }
  else {
    return true;
  }
};
