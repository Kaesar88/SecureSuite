import { KeycloakService } from 'keycloak-angular';
import { inject } from '@angular/core';
import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';

/**
 * Interceptor funcional para Keycloak (HttpInterceptorFn).
 * Inyecta KeycloakService y añade el token de acceso a la cabecera 'Authorization'.
 */
// ¡CRÍTICO! Este es el nombre que se importa.
export const keycloakInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  const keycloakService = inject(KeycloakService);

  if (!keycloakService.isLoggedIn()) {
    return next(req);
  }

  return from(keycloakService.getToken()).pipe(
    switchMap(token => {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next(authReq);
    })
  );
};
