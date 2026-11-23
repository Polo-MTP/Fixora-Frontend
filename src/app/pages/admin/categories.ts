import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminShell } from '../../admin/admin-shell';
import { CategoriesApi, type Category, type CategoryInput } from '../../admin/categories-api';

@Component({
  imports: [AdminShell, FormsModule],
  templateUrl: './categories.html',
  styleUrl: './admin-management.css',
})
export class Categories implements OnInit {
  private readonly api = inject(CategoriesApi);
  private readonly destroyRef = inject(DestroyRef);
  readonly rows = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly search = signal('');
  readonly state = signal('');
  readonly editing = signal<string | undefined>(undefined);
  readonly deactivate = signal<Category | null>(null);
  readonly visible = computed(() =>
    this.rows()
      .filter(
        (row) =>
          (!this.state() || String(row.active) === this.state()) &&
          (row.name + ' ' + row.slug)
            .toLocaleLowerCase()
            .includes(this.search().trim().toLocaleLowerCase()),
      )
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)),
  );
  draft: CategoryInput = this.empty();
  ngOnInit() {
    this.load();
  }
  load() {
    if (this.loading() || this.saving()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (data) => this.rows.set(data),
        error: (error) => this.fail(error),
      });
  }
  edit(row: Category) {
    if (this.saving()) return;
    this.editing.set(row.id);
    this.deactivate.set(null);
    this.draft = {
      name: row.name,
      slug: row.slug,
      icon_key: row.icon_key,
      sort_order: row.sort_order,
      active: row.active,
    };
    this.message.set('');
    this.error.set('');
  }
  reset() {
    this.editing.set(undefined);
    this.draft = this.empty();
  }
  save() {
    if (this.saving() || this.loading()) return;
    this.error.set('');
    this.message.set('');
    if (
      this.draft.name.trim().length < 2 ||
      this.draft.name.trim().length > 150 ||
      !Number.isSafeInteger(this.draft.sort_order) ||
      this.draft.sort_order < 0 ||
      (this.draft.icon_key?.trim().length || 0) > 500 ||
      (this.draft.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.draft.slug))
    ) {
      this.error.set(
        'Revisa el nombre, el slug (minúsculas, números y guiones), el ícono y el orden entero no negativo.',
      );
      return;
    }
    const input = {
      ...this.draft,
      name: this.draft.name.trim(),
      icon_key: this.draft.icon_key?.trim() || null,
    };
    if (!input.slug) delete input.slug;
    this.saving.set(true);
    this.api
      .save(input, this.editing())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (row) => {
          this.upsert(row);
          this.reset();
          this.message.set('Categoría guardada.');
        },
        error: (error) => this.fail(error),
      });
  }
  toggle(row: Category) {
    if (this.saving() || this.loading()) return;
    this.error.set('');
    this.message.set('');
    this.saving.set(true);
    this.api
      .setActive(row)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.upsert(updated);
          this.deactivate.set(null);
          this.message.set(updated.active ? 'Categoría activada.' : 'Categoría desactivada.');
        },
        error: (error) => this.fail(error),
      });
  }
  private upsert(row: Category) {
    this.rows.update((rows) => [...rows.filter((item) => item.id !== row.id), row]);
  }
  private fail(error: unknown) {
    this.error.set(
      error instanceof HttpErrorResponse && typeof error.error?.message === 'string'
        ? error.error.message
        : 'No se pudo completar la operación. Intenta nuevamente.',
    );
  }
  private empty(): CategoryInput {
    return { name: '', slug: '', icon_key: '', sort_order: 0, active: true };
  }
}
