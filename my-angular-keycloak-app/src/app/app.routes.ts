import { Routes } from '@angular/router';
import { LoginComponent } from './login.component'; // Relativo: mismo folder
import { DashboardComponent } from './dashboard.component'; // Relativo
import { authGuard } from './auth-guard'; // Relativo (nota: archivo es auth-guard.ts, no .component)

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];