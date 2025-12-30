import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin Guard - Protects routes that require admin role
 */
export const adminGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for auth to initialize
  while (authService.loading()) {
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  if (authService.isUserAuthenticated() && authService.hasAdminRole()) {
    return true;
  }

  // Redirect to home if not admin
  router.navigate(['/']);
  return false;
};
