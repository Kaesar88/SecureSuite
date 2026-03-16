import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-area-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <button class="back-btn" (click)="volver()">← Volver al Dashboard</button>
        <div class="header-content">
          <h1>Panel de Jefe de Área</h1>
          <p class="subtitle">{{ department | titlecase }} — Gestión de identidades y accesos</p>
        </div>
      </header>

      <div class="content" *ngIf="data">


        <div class="kpi-grid">
          <div class="kpi-card">
            <span class="kpi-number">{{ data.totalUsers }}</span>
            <span class="kpi-label"> Total personal</span>
          </div>
          <div class="kpi-card kpi-ok">
            <span class="kpi-number">{{ data.activeUsers }}</span>
            <span class="kpi-label"> Activos</span>
          </div>
          <div class="kpi-card kpi-warn" [class.kpi-alert]="data.inactiveUsers > 0">
            <span class="kpi-number">{{ data.inactiveUsers }}</span>
            <span class="kpi-label"> Sin actividad +15d</span>
          </div>
          <div class="kpi-card kpi-danger" [class.kpi-alert]="data.usersWithAlerts > 0">
            <span class="kpi-number">{{ data.usersWithAlerts }}</span>
            <span class="kpi-label"> Con alertas</span>
          </div>
        </div>


        <div class="card">
          <div class="card-header">
            <h2>Personal del departamento</h2>
            <button class="btn-refresh" (click)="cargarDatos()">🔄 Actualizar</button>
          </div>

          <div class="table-wrapper">
            <table class="user-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>Último acceso</th>
                  <th>Estado</th>
                  <th>Alertas</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of data.users" [class.row-alert]="u.alerts.length > 0">
                  <td>
                    <div class="user-cell">
                      <span class="avatar">{{ u.fullName.charAt(0) }}</span>
                      <div>
                        <div class="username">{{ u.username }}</div>
                        <div class="fullname">{{ u.fullName }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="email">{{ u.email }}</td>
                  <td>
                    <div class="roles-cell">
                      <span class="role-badge" *ngFor="let r of u.roles" [class]="'role-' + r">
                        {{ r.replace('role_', '') }}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span [class.text-danger]="u.daysSinceLogin > 15">
                      {{ u.daysSinceLogin === -1 ? 'Nunca' : 'Hace ' + u.daysSinceLogin + ' días' }}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge" [class]="u.isActive ? 'status-active' : 'status-inactive'">
                      {{ u.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                  <td>
                    <div class="alerts-cell" *ngIf="u.alerts.length > 0">
                      <span class="alert-item" *ngFor="let a of u.alerts">⚠️ {{ a }}</span>
                    </div>
                    <span class="no-alerts" *ngIf="u.alerts.length === 0">—</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>


        <div class="card" *ngIf="solicitudes.length > 0">
          <h2>Solicitudes de acceso pendientes</h2>
          <div class="request-list">
            <div class="request-item" *ngFor="let s of solicitudes">
              <div class="request-top">
                <div class="user-info">
                  <span class="username">👤 {{ s.requestedBy }}</span>
                  <span class="role-requested">{{ s.requestedRole }}</span>
                </div>
                <span class="badge badge-pending">⏳ Pendiente</span>
              </div>
              <p class="justification">{{ s.justification }}</p>
              <div class="actions">
                <input type="text" [(ngModel)]="comentarios[s.id]" placeholder="Comentario (opcional)" class="input-comment"/>
                <div class="action-buttons">
                  <button class="btn-approve" (click)="aprobar(s.id)">✅ Aprobar</button>
                  <button class="btn-reject" (click)="rechazar(s.id)">❌ Rechazar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="card info-empty" *ngIf="solicitudes.length === 0">
          <p>✅ No hay solicitudes pendientes en tu departamento.</p>
        </div>


        <div class="alert alert-success" *ngIf="mensaje">{{ mensaje }}</div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

      </div>

      <div class="loading" *ngIf="!data">Cargando datos del departamento...</div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

    .page { min-height: 100vh; background: #f9fafb; font-family: 'Courier Prime', monospace; }

    .page-header {
      background: #065f46;
      color: white;
      padding: 24px 32px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .back-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.4);
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Courier Prime', monospace;
      width: fit-content;
      font-size: 0.9rem;
    }

    .back-btn:hover { background: rgba(255,255,255,0.1); }
    .page-header h1 { margin: 0; font-size: 1.6rem; }
    .subtitle { margin: 0; opacity: 0.8; font-size: 0.95rem; }

    .content { max-width: 1100px; margin: 32px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 20px; }
    .loading { text-align: center; padding: 60px; color: #6b7280; font-size: 1.1rem; }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

    .kpi-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border-top: 4px solid #d1d5db;
    }

    .kpi-ok    { border-top-color: #10b981; }
    .kpi-warn  { border-top-color: #f59e0b; }
    .kpi-danger{ border-top-color: #ef4444; }
    .kpi-alert { animation: pulse 2s infinite; }

    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }

    .kpi-number { display: block; font-size: 2.2rem; font-weight: 700; color: #111827; }
    .kpi-label  { font-size: 0.85rem; color: #6b7280; }

    .card { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.07); }
    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .card h2 { margin: 0 0 16px 0; font-size: 1.2rem; color: #111827; }

    .btn-refresh { background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 6px; padding: 6px 14px; cursor: pointer; font-family: 'Courier Prime', monospace; }
    .btn-refresh:hover { background: #e5e7eb; }

    .table-wrapper { overflow-x: auto; }

    .user-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
    .user-table th { background: #f9fafb; padding: 10px 12px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb; }
    .user-table td { padding: 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    .user-table tr:hover td { background: #f9fafb; }
    .row-alert td { background: #fffbeb; }

    .user-cell { display: flex; align-items: center; gap: 10px; }
    .avatar { width: 36px; height: 36px; border-radius: 50%; background: #065f46; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
    .username { font-weight: 700; color: #111827; }
    .fullname { font-size: 0.8rem; color: #6b7280; }
    .email { color: #6b7280; font-size: 0.85rem; }

    .roles-cell { display: flex; flex-wrap: wrap; gap: 4px; }
    .role-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: #eff6ff; color: #1d4ed8; }
    .role-role_admin { background: #fef2f2; color: #991b1b; }
    .role-role_manager { background: #fef3c7; color: #92400e; }
    .role-role_area_manager { background: #f0fdf4; color: #065f46; }

    .status-badge { padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
    .status-active { background: #d1fae5; color: #065f46; }
    .status-inactive { background: #fee2e2; color: #991b1b; }

    .alerts-cell { display: flex; flex-direction: column; gap: 3px; }
    .alert-item { font-size: 0.8rem; color: #92400e; }
    .no-alerts { color: #9ca3af; }
    .text-danger { color: #ef4444; font-weight: 700; }

    .request-list { display: flex; flex-direction: column; gap: 14px; }
    .request-item { border: 1px solid #fbbf24; border-radius: 8px; padding: 16px; background: #fffbeb; }
    .request-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .user-info { display: flex; gap: 10px; align-items: center; }
    .role-requested { background: #eff6ff; color: #1d4ed8; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
    .badge-pending { background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; }
    .justification { color: #374151; margin: 8px 0; font-size: 0.95rem; }
    .actions { border-top: 1px solid #fde68a; padding-top: 12px; }
    .input-comment { width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 8px 12px; font-family: 'Courier Prime', monospace; margin-bottom: 10px; box-sizing: border-box; }
    .action-buttons { display: flex; gap: 10px; }
    .btn-approve { flex: 1; background: #d1fae5; color: #065f46; border: none; border-radius: 8px; padding: 10px; font-family: 'Courier Prime', monospace; font-weight: 700; cursor: pointer; }
    .btn-approve:hover { background: #a7f3d0; }
    .btn-reject { flex: 1; background: #fee2e2; color: #991b1b; border: none; border-radius: 8px; padding: 10px; font-family: 'Courier Prime', monospace; font-weight: 700; cursor: pointer; }
    .btn-reject:hover { background: #fecaca; }

    .info-empty { text-align: center; color: #6b7280; padding: 32px; }

    .alert { padding: 14px 18px; border-radius: 8px; font-weight: 700; }
    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    @media (max-width: 768px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
  `]
})
export class AreaManagerComponent implements OnInit {
  data: any = null;
  solicitudes: any[] = [];
  comentarios: Record<string, string> = {};
  department = '';
  mensaje = '';
  error = '';

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  ngOnInit() {
    const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
    const roles: string[] = tokenParsed?.['realm_access']?.['roles'] ?? [];
    const depts = ['ventas', 'tecnologia', 'recursos', 'finanzas', 'direccion'];
    const managerRole = roles.find(r => r.startsWith('role_manager_') && depts.some(d => r === 'role_manager_' + d));
    this.department = managerRole ? managerRole.replace('role_manager_', '') : '';
    this.cargarDatos();
  }

  cargarDatos() {
    this.http.get<any>('http://localhost:5001/api/areamanager/my-department').subscribe({
      next: (data) => {
        this.data = data;
        this.cargarSolicitudes();
      },
      error: () => { this.error = 'Error al cargar los datos del departamento.'; }
    });
  }

  cargarSolicitudes() {
    if (!this.department) return;
    this.http.get<any[]>(`http://localhost:5001/api/areamanager/access-requests/${this.department}`).subscribe({
      next: (data) => { this.solicitudes = data.filter(s => s.status === 'pending'); },
      error: () => {}
    });
  }

  aprobar(id: string) {
    this.mensaje = '';
    this.error = '';
    this.http.put<any>(`http://localhost:5001/api/areamanager/access-requests/${id}/approve`, {
      comment: this.comentarios[id] ?? ''
    }).subscribe({
      next: (res) => { this.mensaje = res.message; this.cargarDatos(); },
      error: (err) => { this.error = err.error?.message ?? 'Error al aprobar.'; }
    });
  }

  rechazar(id: string) {
    this.mensaje = '';
    this.error = '';
    this.http.put<any>(`http://localhost:5001/api/areamanager/access-requests/${id}/reject`, {
      comment: this.comentarios[id] ?? ''
    }).subscribe({
      next: (res) => { this.mensaje = res.message; this.cargarDatos(); },
      error: (err) => { this.error = err.error?.message ?? 'Error al rechazar.'; }
    });
  }

  volver() { this.router.navigate(['/dashboard']); }
}
