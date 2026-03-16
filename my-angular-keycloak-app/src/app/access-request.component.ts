import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';

@Component({
  selector: 'app-access-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-header">
        <button class="back-btn" (click)="volver()">← Volver al Dashboard</button>
        <h1>Solicitar Rol de Manager</h1>
        <p class="subtitle">Envía una solicitud al administrador para obtener el rol de Manager</p>
      </header>

      <div class="content">

        <!-- Formulario de solicitud -->
        <div class="card" *ngIf="!hasPendingRequest && !hasManagerRole">
          <h2>Nueva Solicitud</h2>
          <p class="info">
            El rol de <strong>Manager</strong> te permite acceder a funcionalidades avanzadas
            de gestión de equipo. Tu solicitud será revisada por el administrador.
          </p>

          <div class="form-group">
            <label>Justificación <span class="required">*</span></label>
            <textarea
              [(ngModel)]="justification"
              placeholder="Explica por qué necesitas el rol de Manager..."
              rows="4"
              class="textarea"
            ></textarea>
            <span class="char-count">{{ justification.length }}/500</span>
          </div>

          <button
            class="btn-primary"
            (click)="enviarSolicitud()"
            [disabled]="justification.trim().length < 10 || enviando">
            {{ enviando ? 'Enviando...' : 'Enviar Solicitud' }}
          </button>
        </div>

        <!-- Ya tiene el rol -->
        <div class="card info-card" *ngIf="hasManagerRole">
          <div class="icon">✅</div>
          <h2>Ya tienes el rol de Manager</h2>
          <p>No es necesario solicitar el rol porque ya lo tienes asignado.</p>
        </div>

        <!-- Solicitud pendiente -->
        <div class="card warning-card" *ngIf="hasPendingRequest && !hasManagerRole">
          <div class="icon">⏳</div>
          <h2>Solicitud Pendiente</h2>
          <p>Ya tienes una solicitud en revisión. El administrador la procesará en breve.</p>
        </div>

        <!-- Mensaje de éxito/error -->
        <div class="alert alert-success" *ngIf="mensaje && !error">{{ mensaje }}</div>
        <div class="alert alert-error" *ngIf="error">{{ error }}</div>

        <!-- Historial de solicitudes -->
        <div class="card" *ngIf="solicitudes.length > 0">
          <h2>Mis Solicitudes</h2>
          <div class="request-list">
            <div class="request-item" *ngFor="let s of solicitudes" [class]="'status-' + s.status">
              <div class="request-header">
                <span class="badge" [class]="'badge-' + s.status">
                  {{ getStatusLabel(s.status) }}
                </span>
                <span class="date">{{ s.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <p class="justification">{{ s.justification }}</p>
              <div class="review-info" *ngIf="s.status !== 'pending'">
                <p><strong>Revisado por:</strong> {{ s.reviewedBy }}</p>
                <p *ngIf="s.reviewComment"><strong>Comentario:</strong> {{ s.reviewComment }}</p>
              </div>
            </div>
          </div>
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
      background: #1e3a8a;
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
      max-width: 700px;
      margin: 32px auto;
      padding: 0 16px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.07);
    }

    .card h2 {
      margin: 0 0 12px 0;
      font-size: 1.2rem;
      color: #111827;
    }

    .info { color: #4b5563; line-height: 1.6; margin-bottom: 20px; }

    .form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
    .form-group label { font-weight: 700; color: #374151; }
    .required { color: #dc2626; }

    .textarea {
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 12px;
      font-family: 'Courier Prime', monospace;
      font-size: 0.95rem;
      resize: vertical;
      transition: border-color 0.2s;
    }

    .textarea:focus { outline: none; border-color: #1e3a8a; }
    .char-count { font-size: 0.8rem; color: #9ca3af; text-align: right; }

    .btn-primary {
      background: #1e3a8a;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-family: 'Courier Prime', monospace;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      transition: background 0.2s;
      width: 100%;
    }

    .btn-primary:hover:not(:disabled) { background: #3b82f6; }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

    .info-card, .warning-card {
      text-align: center;
      padding: 32px;
    }

    .icon { font-size: 2.5rem; margin-bottom: 12px; }
    .info-card h2, .warning-card h2 { color: #111827; }
    .info-card p, .warning-card p { color: #6b7280; }

    .alert {
      padding: 14px 18px;
      border-radius: 8px;
      font-weight: 700;
    }

    .alert-success { background: #d1fae5; color: #065f46; border: 1px solid #6ee7b7; }
    .alert-error   { background: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; }

    .request-list { display: flex; flex-direction: column; gap: 14px; }

    .request-item {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
    }

    .request-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
    }

    .badge-pending  { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #fee2e2; color: #991b1b; }

    .date { font-size: 0.85rem; color: #9ca3af; }
    .justification { color: #374151; margin: 0 0 10px 0; }
    .review-info { border-top: 1px solid #f3f4f6; padding-top: 10px; font-size: 0.9rem; color: #6b7280; }
    .review-info p { margin: 4px 0; }
  `]
})
export class AccessRequestComponent implements OnInit {
  justification = '';
  enviando = false;
  mensaje = '';
  error = '';
  solicitudes: any[] = [];
  hasPendingRequest = false;
  hasManagerRole = false;

  constructor(
    private http: HttpClient,
    private keycloakService: KeycloakService,
    private router: Router
  ) {}

  async ngOnInit() {
    const tokenParsed = this.keycloakService.getKeycloakInstance().tokenParsed;
    const roles: string[] = tokenParsed?.['realm_access']?.['roles'] ?? [];
    this.hasManagerRole = roles.includes('role_manager');
    await this.cargarSolicitudes();
  }

  async cargarSolicitudes() {
    this.http.get<any[]>('http://localhost:5001/api/accessrequest/mine')
      .subscribe({
        next: (data) => {
          this.solicitudes = data;
          this.hasPendingRequest = data.some(s => s.status === 'pending');
        },
        error: () => {}
      });
  }

  enviarSolicitud() {
    if (this.justification.trim().length < 10) return;
    this.enviando = true;
    this.mensaje = '';
    this.error = '';

    this.http.post<any>('http://localhost:5001/api/accessrequest', {
      justification: this.justification
    }).subscribe({
      next: (res) => {
        this.mensaje = res.message;
        this.justification = '';
        this.hasPendingRequest = true;
        this.cargarSolicitudes();
        this.enviando = false;
      },
      error: (err) => {
        this.error = err.error?.message ?? 'Error al enviar la solicitud.';
        this.enviando = false;
      }
    });
  }

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
