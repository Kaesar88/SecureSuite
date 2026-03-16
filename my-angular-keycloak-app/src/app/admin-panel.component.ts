import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <button class="back-btn" (click)="volver()">← Volver al Dashboard</button>
        <h1>Panel de Administración</h1>
        <p class="subtitle">Gestión de solicitudes de acceso — Access Request Workflow</p>
      </header>

      <div class="content">


        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-number">{{ getPendingCount() }}</span>
            <span class="stat-label">Pendientes</span>
          </div>
          <div class="stat-card stat-approved">
            <span class="stat-number">{{ getApprovedCount() }}</span>
            <span class="stat-label">Aprobadas</span>
          </div>
          <div class="stat-card stat-rejected">
            <span class="stat-number">{{ getRejectedCount() }}</span>
            <span class="stat-label">Rechazadas</span>
          </div>
          <div class="stat-card stat-total">
            <span class="stat-number">{{ solicitudes.length }}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>


        <div class="alert alert-success" *ngIf="mensaje">{{ mensaje }}</div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>


        <div class="card">
          <div class="card-header">
            <h2>Solicitudes de Acceso</h2>
            <button class="btn-refresh" (click)="cargarSolicitudes()">🔄 Actualizar</button>
          </div>

          <div class="empty-state" *ngIf="solicitudes.length === 0">
            <p>No hay solicitudes registradas.</p>
          </div>

          <div class="request-list" *ngIf="solicitudes.length > 0">
            <div class="request-item" *ngFor="let s of solicitudes" [class]="'status-' + s.status">

              <div class="request-top">
                <div class="user-info">
                  <span class="username">👤 {{ s.requestedBy }}</span>
                  <span class="email">{{ s.requestedByEmail }}</span>
                </div>
                <div class="request-meta">
                  <span class="badge" [class]="'badge-' + s.status">
                    {{ getStatusLabel(s.status) }}
                  </span>
                  <span class="role-requested">{{ s.requestedRole }}</span>
                </div>
              </div>

              <div class="justification-box">
                <strong>Justificación:</strong>
                <p>{{ s.justification }}</p>
              </div>

              <div class="dates">
                <span>Solicitado: {{ s.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="s.reviewedAt"> · Revisado: {{ s.reviewedAt | date:'dd/MM/yyyy HH:mm' }}</span>
                <span *ngIf="s.reviewedBy"> · por {{ s.reviewedBy }}</span>
              </div>

              <div class="review-comment" *ngIf="s.reviewComment">
                <strong>Comentario del admin:</strong> {{ s.reviewComment }}
              </div>


              <div class="actions" *ngIf="s.status === 'pending'">
                <div class="comment-input">
                  <input
                    type="text"
                    [(ngModel)]="comentarios[s.id]"
                    placeholder="Comentario (opcional)"
                    class="input-comment"
                  />
                </div>
                <div class="action-buttons">
                  <button
                    class="btn-approve"
                    (click)="aprobar(s.id)"
                    [disabled]="procesando[s.id]">
                    ✅ Aprobar
                  </button>
                  <button
                    class="btn-reject"
                    (click)="rechazar(s.id)"
                    [disabled]="procesando[s.id]">
                    ❌ Rechazar
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>


        <div class="card info-box" *ngIf="getApprovedCount() > 0">
          <h3>ℹ️ Siguiente paso tras aprobar</h3>
          <p>
            Las solicitudes aprobadas quedan registradas aquí. Para que el cambio de rol
            se aplique efectivamente en MidPoint y el LDAP, ejecuta una tarea de
            <strong>Reconciliation</strong> en MidPoint desde
            <strong>Server Tasks → Reconciliation tasks</strong>.
          </p>
          <p>
            MidPoint detectará el cambio y asignará el rol automáticamente según
            el Object Template configurado.
          </p>
        </div>

      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap');

    .page {
      min-height: 100vh;
      background: #f9fafb;
      font-family: 'Courier Prime', monospace;
    }

    .page-header {
      background: #7f1d1d;
      color: white;
      padding: 24px 32px;
    }

    .back-btn {
      background: transparent;
      border: 1px solid rgba(255,255,255,0.4);
      color: white;
      padding: 6px 14px;
      border-radius: 6px;
      cursor: pointer;
      font-family: 'Courier Prime', monospace;
      margin-bottom: 12px;
      font-size: 0.9rem;
    }

    .back-btn:hover { background: rgba(255,255,255,0.1); }
    .page-header h1 { margin: 0 0 6px 0; font-size: 1.6rem; }
    .subtitle { margin: 0; opacity: 0.8; font-size: 0.95rem; }

    .content {
      max-width: 800px;
      margin: 32px auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
      border-top: 4px solid #f59e0b;
    }

    .stat-approved { border-top-color: #10b981; }
    .stat-rejected { border-top-color: #ef4444; }
    .stat-total    { border-top-color: #1e3a8a; }

    .stat-number { display: block; font-size: 2rem; font-weight: 700; color: #111827; }
    .stat-label  { font-size: 0.85rem; color: #6b7280; }

    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .card-header h2 { margin: 0; font-size: 1.2rem; color: #111827; }

    .btn-refresh {
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 6px 14px;
      cursor: pointer;
      font-family: 'Courier Prime', monospace;
      font-size: 0.9rem;
    }

    .btn-refresh:hover { background: #e5e7eb; }

    .empty-state { text-align: center; color: #9ca3af; padding: 32px; }

    .request-list { display: flex; flex-direction: column; gap: 16px; }

    .request-item {
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      padding: 18px;
      transition: box-shadow 0.2s;
    }

    .request-item:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .status-pending  { border-left: 4px solid #f59e0b; }
    .status-approved { border-left: 4px solid #10b981; }
    .status-rejected { border-left: 4px solid #ef4444; }

    .request-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .user-info { display: flex; flex-direction: column; gap: 2px; }
    .username { font-weight: 700; font-size: 1rem; color: #111827; }
    .email { font-size: 0.85rem; color: #6b7280; }

    .request-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }

    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .badge-pending  { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }

    .role-requested {
      font-size: 0.8rem;
      background: #eff6ff;
      color: #1d4ed8;
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 700;
    }

    .justification-box {
      background: #f9fafb;
      border-radius: 6px;
      padding: 12px;
      margin-bottom: 10px;
      font-size: 0.95rem;
      color: #374151;
    }

    .justification-box p { margin: 6px 0 0 0; }

    .dates { font-size: 0.82rem; color: #9ca3af; margin-bottom: 8px; }

    .review-comment {
      font-size: 0.9rem;
      color: #4b5563;
      background: #f3f4f6;
      padding: 8px 12px;
      border-radius: 6px;
      margin-bottom: 10px;
    }

    .actions { border-top: 1px solid #f3f4f6; padding-top: 14px; }

    .comment-input { margin-bottom: 10px; }

    .input-comment {
      width: 100%;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 8px 12px;
      font-family: 'Courier Prime', monospace;
      font-size: 0.9rem;
      box-sizing: border-box;
    }

    .input-comment:focus { outline: none; border-color: #1e3a8a; }

    .action-buttons { display: flex; gap: 10px; }

    .btn-approve, .btn-reject {
      flex: 1;
      border: none;
      border-radius: 8px;
      padding: 10px;
      font-family: 'Courier Prime', monospace;
      font-weight: 700;
      font-size: 0.95rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }

    .btn-approve { background: #d1fae5; color: #065f46; }
    .btn-approve:hover:not(:disabled) { background: #a7f3d0; }

    .btn-reject { background: #fee2e2; color: #991b1b; }
    .btn-reject:hover:not(:disabled) { background: #fecaca; }

    .btn-approve:disabled, .btn-reject:disabled { opacity: 0.5; cursor: not-allowed; }

    .alert {
      padding: 14px 18px;
      border-radius: 8px;
      font-weight: 700;
    }

    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    .info-box { background: #eff6ff; border: 1px solid #bfdbfe; }
    .info-box h3 { margin: 0 0 10px 0; color: #1e40af; }
    .info-box p { color: #1e40af; margin: 0 0 8px 0; line-height: 1.6; font-size: 0.95rem; }

    @media (max-width: 600px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }
  `]
})
export class AdminPanelComponent implements OnInit {
  solicitudes: any[] = [];
  comentarios: Record<string, string> = {};
  procesando: Record<string, boolean> = {};
  mensaje = '';
  error = '';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    this.http.get<any[]>('http://localhost:5001/api/accessrequest')
      .subscribe({
        next: (data) => { this.solicitudes = data; },
        error: (err) => { this.error = 'Error al cargar solicitudes.'; }
      });
  }

  aprobar(id: string) {
    this.procesando[id] = true;
    this.mensaje = '';
    this.error = '';

    this.http.put<any>(`http://localhost:5001/api/accessrequest/${id}/approve`, {
      comment: this.comentarios[id] ?? ''
    }).subscribe({
      next: (res) => {
        this.mensaje = res.message;
        this.procesando[id] = false;
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.error = err.error?.message ?? 'Error al aprobar.';
        this.procesando[id] = false;
      }
    });
  }

  rechazar(id: string) {
    this.procesando[id] = true;
    this.mensaje = '';
    this.error = '';

    this.http.put<any>(`http://localhost:5001/api/accessrequest/${id}/reject`, {
      comment: this.comentarios[id] ?? ''
    }).subscribe({
      next: (res) => {
        this.mensaje = res.message;
        this.procesando[id] = false;
        this.cargarSolicitudes();
      },
      error: (err) => {
        this.error = err.error?.message ?? 'Error al rechazar.';
        this.procesando[id] = false;
      }
    });
  }

  getPendingCount()  { return this.solicitudes.filter(s => s.status === 'pending').length; }
  getApprovedCount() { return this.solicitudes.filter(s => s.status === 'approved').length; }
  getRejectedCount() { return this.solicitudes.filter(s => s.status === 'rejected').length; }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending:  '⏳ Pendiente',
      approved: '✅ Aprobada',
      rejected: '❌ Rechazada'
    };
    return labels[status] ?? status;
  }

  volver() {
    this.router.navigate(['/dashboard']);
  }
}
