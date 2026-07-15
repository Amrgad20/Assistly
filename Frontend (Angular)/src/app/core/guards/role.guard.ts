import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {

  const auth = inject(AuthService);
  const router = inject(Router);

  const expectedRole = route.data['role'];

  const user = auth.getCurrentUser();

  if (!user) {

    router.navigate(['/login']);

    return false;

  }

  if (user.role !== expectedRole) {

    router.navigate(['/login']);

    return false;

  }

  return true;

};