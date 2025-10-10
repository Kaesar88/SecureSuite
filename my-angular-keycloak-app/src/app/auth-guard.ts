// auth-guard.ts
import { inject } from '@angular/core';
// AQUÍ ESTÁ LA CORRECCIÓN: Se importa CanActivateFn
import { CanActivateFn, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

// Ahora TypeScript reconoce 'CanActivateFn' y los tipos de 'route' y 'state'
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