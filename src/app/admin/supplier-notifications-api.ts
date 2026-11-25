import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { EMPTY, Observable, expand, map, reduce } from 'rxjs';

const NOTIFICATIONS_URL = '/api/me/notifications';
const SUPPLIER_NOTICE_TYPE = 'nueva_solicitud_proveedor';
const PAGE_SIZE = 100;
const RECENT_LIMIT = 20;

export interface SupplierNotice {
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type: string | null;
  entity_id: string | null;
  read_at: string | null;
  created_at: string;
}

interface NotificationPage {
  data: SupplierNotice[];
  pagination: {
    page: number;
    total_pages: number;
  };
}

@Injectable({ providedIn: 'root' })
export class SupplierNotificationsApi {
  private readonly http = inject(HttpClient);

  countUnread(): Observable<number> {
    return this.collectSupplierNotices(true).pipe(map((notices) => notices.length));
  }

  listRecent(): Observable<SupplierNotice[]> {
    return this.collectSupplierNotices(false, RECENT_LIMIT);
  }

  markAsRead(id: string): Observable<unknown> {
    return this.http.post(`${NOTIFICATIONS_URL}/${encodeURIComponent(id)}/read`, {});
  }

  private collectSupplierNotices(
    unreadOnly: boolean,
    maxResults?: number,
  ): Observable<SupplierNotice[]> {
    const notices = new Map<string, SupplierNotice>();

    // El orden de inserción conserva el orden descendente que devuelve la API.
    const collectPage = (response: NotificationPage): number => {
      for (const notice of response.data) {
        if (notice.type === SUPPLIER_NOTICE_TYPE && !notices.has(notice.id)) {
          notices.set(notice.id, notice);
        }
      }
      return notices.size;
    };

    return this.getPage(1, unreadOnly).pipe(
      expand((response) => {
        const count = collectPage(response);
        const { page, total_pages } = response.pagination;

        if (page >= total_pages || (maxResults !== undefined && count >= maxResults)) {
          return EMPTY;
        }

        return this.getPage(page + 1, unreadOnly);
      }, 1),
      // Emite el resultado una vez que se terminan de consultar las páginas.
      reduce(() => undefined, undefined),
      map(() => Array.from(notices.values()).slice(0, maxResults ?? notices.size)),
    );
  }

  private getPage(page: number, unreadOnly: boolean): Observable<NotificationPage> {
    return this.http.get<NotificationPage>(NOTIFICATIONS_URL, {
      params: {
        page,
        limit: PAGE_SIZE,
        unread: unreadOnly,
      },
    });
  }
}

