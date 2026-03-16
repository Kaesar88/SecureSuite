import { Routes } from '@angular/router';
import { LoginComponent } from './login.component';
import { DashboardComponent } from './dashboard.component';
import { AccessRequestComponent } from './access-request.component';
import { AdminPanelComponent } from './admin-panel.component';
import { AreaManagerComponent } from './area-manager.component';
import { RolesOverviewComponent } from './roles-overview.component';
import { authGuard } from './auth-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'access-request', component: AccessRequestComponent, canActivate: [authGuard] },
  { path: 'admin-panel', component: AdminPanelComponent, canActivate: [authGuard] },
  { path: 'area-manager', component: AreaManagerComponent, canActivate: [authGuard] },
  { path: 'roles-overview', component: RolesOverviewComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
