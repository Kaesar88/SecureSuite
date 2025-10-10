// app.config.ts
import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { KeycloakService } from 'keycloak-angular'; // Asegúrate de importar el servicio
import { routes } from './app.routes';
import { keycloakInterceptorFn } from './keycloak.interceptor';

// Función factory para inicializar Keycloak
function initializeKeycloak(keycloak: KeycloakService) {
  return () =>
    keycloak.init({
      config: {
        url: 'http://localhost:8080',
        realm: '2cl-realm',
        clientId: 'angular-app',
      },
      initOptions: {
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri:
          window.location.origin + '/assets/silent-check-sso.html',
      },
    });
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      keycloakInterceptorFn
    ])),

    // 1. PROVEER EL SERVICIO: Esto resuelve el error "No provider found".
    // Le decimos a Angular que la clase KeycloakService está disponible para ser inyectada.
    KeycloakService,

    // 2. INICIALIZAR EL SERVICIO: Usamos APP_INITIALIZER para configurar Keycloak
    // antes de que la aplicación se renderice.
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloak,
      multi: true,
      deps: [KeycloakService], // Le decimos al factory que necesita una instancia de KeycloakService
    }
  ]
};