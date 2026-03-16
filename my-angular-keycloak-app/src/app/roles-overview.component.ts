import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-roles-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-header">
        <button class="back-btn" (click)="volver()">← Volver al Dashboard</button>
        <h1>Vista Global de Roles</h1>
        <p class="subtitle">Roles asignados por departamento en toda la organización</p>
      </header>

      <div class="content">

        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <div class="dept-section" *ngFor="let dept of overview">
          <div class="dept-header" (click)="toggleDept(dept.department)">
            <div class="dept-title">
              <h2>{{ dept.department | titlecase }}</h2>
              <span class="dept-count">{{ dept.users.length }} personas</span>
            </div>
            <span class="toggle-icon">{{ expandedDepts[dept.department] ? '▲' : '▼' }}</span>
          </div>

          <div class="dept-content" *ngIf="expandedDepts[dept.department]">
            <table class="roles-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre completo</th>
                  <th>Roles asignados</th>
                  <th>Último acceso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of dept.users">
                  <td class="username-cell">{{ u.username }}</td>
                  <td>{{ u.fullName }}</td>
                  <td>
                    <div class="roles-cell">
                      <span class="role-badge" *ngFor="let r of u.roles" [class]="'role-' + r">
                        {{ r.replace('role_', '') }}
                      </span>
                    </div>
                  </td>
                  <td [class.text-danger]="u.daysSinceLogin > 15">
                    {{ u.daysSinceLogin === -1 ? 'Nunca' : 'Hace ' + u.daysSinceLogin + 'd' }}
                  </td>
                  <td>
                    <span class="status-badge" [class]="u.isActive ? 'status-active' : 'status-inactive'">
                      {{ u.isActive ? '✅' : '❌' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>


            <div class="roles-summary">
              <span class="summary-item" *ngFor="let r of getDeptRoleSummary(dept)">
                {{ r.role }}: <strong>{{ r.count }}</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="loading" *ngIf="overview.length === 0 && !error">
          Cargando datos...
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

    .page { min-height: 100vh; background: #f9fafb; font-family: 'Courier Prime', monospace; }

    .page-header {
      background: #1e40af;
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
    .subtitle { margin: 0; opacity: 0.8; }

    .content { max-width: 1000px; margin: 32px auto; padding: 0 16px; display: flex; flex-direction: column; gap: 16px; }
    .loading { text-align: center; padding: 60px; color: #6b7280; }

    .dept-section {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      overflow: hidden;
    }

    .dept-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 24px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid #f3f4f6;
      transition: background 0.2s;
    }

    .dept-header:hover { background: #f9fafb; }

    .dept-title { display: flex; align-items: center; gap: 12px; }
    .dept-icon { font-size: 1.4rem; }
    .dept-title h2 { margin: 0; font-size: 1.1rem; color: #111827; }
    .dept-count { background: #eff6ff; color: #1d4ed8; padding: 3px 10px; border-radius: 12px; font-size: 0.8rem; font-weight: 700; }
    .toggle-icon { color: #6b7280; font-size: 0.9rem; }

    .dept-content { padding: 0 24px 20px; }

    .roles-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-top: 16px; }
    .roles-table th { background: #f9fafb; padding: 8px 12px; text-align: left; font-weight: 700; color: #374151; border-bottom: 2px solid #e5e7eb; }
    .roles-table td { padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
    .roles-table tr:last-child td { border-bottom: none; }
    .roles-table tr:hover td { background: #f9fafb; }

    .username-cell { font-weight: 700; color: #374151; }

    .roles-cell { display: flex; flex-wrap: wrap; gap: 4px; }
    .role-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 700; background: #eff6ff; color: #1d4ed8; }
    .role-role_admin { background: #fef2f2; color: #991b1b; }
    .role-role_manager { background: #fef3c7; color: #92400e; }
    .role-role_area_manager { background: #f0fdf4; color: #065f46; }

    .text-danger { color: #ef4444; font-weight: 700; }

    .status-badge { font-size: 1rem; }

    .roles-summary {
      display: flex;
      gap: 16px;
      padding: 12px 0 0;
      border-top: 1px solid #f3f4f6;
      margin-top: 12px;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .alert { padding: 14px 18px; border-radius: 8px; font-weight: 700; }
    .alert-error { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }
  `]
})
export class RolesOverviewComponent implements OnInit {
  overview: any[] = [];
  expandedDepts: Record<string, boolean> = {};
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.http.get<any[]>('http://localhost:5001/api/areamanager/roles-overview').subscribe({
      next: (data) => {
        this.overview = data;
        data.forEach(d => this.expandedDepts[d.department] = true);
      },
      error: () => { this.error = 'Error al cargar la vista global de roles.'; }
    });
  }

  toggleDept(dept: string) {
    this.expandedDepts[dept] = !this.expandedDepts[dept];
  }

  getDeptRoleSummary(dept: any): { role: string; count: number }[] {
    const counts: Record<string, number> = {};
    dept.users.forEach((u: any) => {
      u.roles.forEach((r: string) => {
        counts[r] = (counts[r] ?? 0) + 1;
      });
    });
    return Object.entries(counts).map(([role, count]) => ({ role: role.replace('role_', ''), count }));
  }

  volver() { this.router.navigate(['/dashboard']); }
}
