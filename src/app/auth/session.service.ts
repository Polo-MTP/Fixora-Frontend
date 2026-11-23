import { Injectable, signal } from '@angular/core';

export interface Session {
  accessToken: string;
  refreshToken: string;
  role: string;
}

const STORAGE_KEY = 'fixora-session';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly current = signal<Session | null>(this.restore());

  save(session: Session): void {
    this.current.set(session);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  }

  clear(): void {
    this.current.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  private restore(): Session | null {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return null;
      const session: unknown = JSON.parse(saved);
      if (
        typeof session === 'object' &&
        session !== null &&
        'accessToken' in session &&
        typeof session.accessToken === 'string' &&
        'refreshToken' in session &&
        typeof session.refreshToken === 'string' &&
        'role' in session &&
        typeof session.role === 'string' &&
        session.accessToken &&
        session.refreshToken &&
        session.role
      ) {
        return session as Session;
      }
    } catch {
      // Una sesión corrupta no debe impedir el inicio de la aplicación.
    }
    return null;
  }
}
