import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

export const authGuard: CanActivateFn = async (route, state) => {
  const keycloakService = inject(KeycloakService);
  const router = inject(Router);

  if (!keycloakService.getKeycloakInstance().authenticated) {
    await keycloakService.login({
      redirectUri: window.location.origin + state.url,
    });
    return false;
  }
  
  return true;
};