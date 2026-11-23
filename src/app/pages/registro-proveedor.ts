import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { take } from 'rxjs';

import {
  ProviderRegistrationApi,
  type ProviderDocumentType,
  type SupplierType,
  type RegistrationCategory,
} from '../registration/provider-registration-api';
import { BranchMap } from '../registration/branch-map';
import {
  ADDRESS_FIELDS,
  createBranchDraft,
  toBranchInput,
  validateBranch,
  type BranchDraft,
} from '../registration/provider-branches';

type RegistrationStep = 1 | 2 | 3 | 4 | 5;
type DocumentStatus = 'pending' | 'ready' | 'error';

interface ManagerDraft {
  name: string;
  lastnameP: string;
  lastnameM: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
}

interface BusinessDraft {
  name: string;
  phone: string;
  email: string;
  supplierType: SupplierType | '';
}

interface RegistrationDraft {
  step: RegistrationStep;
  manager: Omit<ManagerDraft, 'password' | 'passwordConfirmation'>;
  business: BusinessDraft;
  branches?: BranchDraft[];
}

interface RegistrationDocument extends ProviderDocumentType {
  file?: File;
  fileName?: string;
  fileSize?: string;
  previewUrl?: string;
  status: DocumentStatus;
  error?: string;
}

const DRAFT_KEY = 'fixora-provider-registration-draft-v1';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 15 * 1024 * 1024;

@Component({
  selector: 'app-provider-registration',
  imports: [FormsModule, RouterLink, BranchMap],
  templateUrl: './registro-proveedor.html',
  styleUrl: './registro-proveedor.css',
})
export class ProviderRegistration implements OnInit {
  private readonly registrationApi = inject(ProviderRegistrationApi);

  currentStep: RegistrationStep = 1;
  restoredDraft = false;
  showPassword = false;
  showPasswordConfirmation = false;

  manager: ManagerDraft = this.createManagerDraft();
  business: BusinessDraft = this.createBusinessDraft();
  documents: RegistrationDocument[] = [];
  documentsLoading = false;
  documentsError = '';
  errors: Record<string, string> = {};

  // New branch related properties
  readonly addressFields = ADDRESS_FIELDS;
  branches: BranchDraft[] = [createBranchDraft()];
  branchErrors: string[][] = [];

  categories: RegistrationCategory[] = [];
  categoriesLoading = false;
  categoriesError = '';

  get canAddBranch(): boolean {
    return this.business.supplierType === 'empresa';
  }

  addBranch(): void {
    if (!this.canAddBranch) return;
    this.branches.push(createBranchDraft());
    this.saveDraft();
  }

  removeBranch(index: number): void {
    if (this.branches.length <= 1) return;
    this.branches.splice(index, 1);
    this.branchErrors = [];
    this.saveDraft();
  }

  loadCategories(): void {
    if (this.categoriesLoading) return;
    this.categoriesLoading = true;
    this.categoriesError = '';

    this.registrationApi.getCategories().pipe(take(1)).subscribe({
      next: ({ data }) => {
        this.categories = data.map(({ id, name }) => ({ id: String(id), name }));
        this.categoriesLoading = false;
      },
      error: () => {
        this.categoriesLoading = false;
        this.categoriesError = 'No pudimos cargar el catálogo de categorías.';
      },
    });
  }

  buildBranchesInput(): ReturnType<typeof toBranchInput>[] {
    return this.branches.map(toBranchInput);
  }



  ngOnInit(): void {
    this.restoreDraft();
  }

  startRegistration(): void {
    this.currentStep = 2;
    this.errors = {};
    this.saveDraft();
  }

  continue(): void {
    if (this.currentStep === 2) {
      this.errors = this.validateManager();
      if (Object.keys(this.errors).length > 0) return;

      this.currentStep = 3;
      this.saveDraft();
      return;
    }

    if (this.currentStep === 3) {
      this.errors = this.validateBusiness();
      if (Object.keys(this.errors).length > 0) return;

      this.currentStep = 4;
      this.saveDraft();
      this.loadCategories();
      return;
    }

    if (this.currentStep === 4) {
      if (this.categoriesLoading || this.categoriesError) return;

      if (!this.canAddBranch && this.branches.length > 1) {
        this.errors = { branches: 'Deja un solo local para continuar como independiente.' };
        return;
      }

      this.errors = {};
      const availableIds = new Set(this.categories.map(({ id }) => id));
      this.branchErrors = this.branches.map((branch) => validateBranch(branch, availableIds));
      if (this.branchErrors.some((errors) => errors.length > 0)) return;

      this.currentStep = 5;
      this.saveDraft();
      this.loadDocumentTypes();
    }
  }

  back(): void {
    if (this.currentStep === 5) {
      this.currentStep = 4;
    } else if (this.currentStep === 4) {
      this.currentStep = 3;
      if (this.categories.length === 0) this.loadCategories();
    } else if (this.currentStep === 3) {
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      this.currentStep = 1;
    }

    this.errors = {};
    this.saveDraft();
  }

  saveDraft(): void {
    const draft: RegistrationDraft = {
      step: this.currentStep,
      manager: {
        name: this.manager.name,
        lastnameP: this.manager.lastnameP,
        lastnameM: this.manager.lastnameM,
        phone: this.manager.phone,
        email: this.manager.email,
      },
      business: { ...this.business },
      branches: this.branches,
    };

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  clearDraft(): void {
    this.currentStep = 1;
    this.restoredDraft = false;
    this.showPassword = false;
    this.showPasswordConfirmation = false;
    this.manager = this.createManagerDraft();
    this.business = this.createBusinessDraft();
    this.branches = [createBranchDraft()];
    this.branchErrors = [];
    this.clearDocuments();
    this.errors = {};
    sessionStorage.removeItem(DRAFT_KEY);
  }

  private restoreDraft(): void {
    try {
      const saved = sessionStorage.getItem(DRAFT_KEY);
      if (!saved) return;

      const draft = JSON.parse(saved) as Partial<RegistrationDraft>;
      if (!draft.manager || !draft.business) return;

      this.currentStep = this.isRegistrationStep(draft.step) ? draft.step : 1;
      this.manager = {
        ...this.createManagerDraft(),
        name: typeof draft.manager.name === 'string' ? draft.manager.name : '',
        lastnameP: typeof draft.manager.lastnameP === 'string' ? draft.manager.lastnameP : '',
        lastnameM: typeof draft.manager.lastnameM === 'string' ? draft.manager.lastnameM : '',
        phone: typeof draft.manager.phone === 'string' ? draft.manager.phone : '',
        email: typeof draft.manager.email === 'string' ? draft.manager.email : '',
      };
      this.business = {
        ...this.createBusinessDraft(),
        name: typeof draft.business.name === 'string' ? draft.business.name : '',
        phone: typeof draft.business.phone === 'string' ? draft.business.phone : '',
        email: typeof draft.business.email === 'string' ? draft.business.email : '',
        supplierType:
          draft.business.supplierType === 'independiente' ||
          draft.business.supplierType === 'empresa'
            ? draft.business.supplierType
            : '',
      };
      this.restoredDraft = true;

      if (Array.isArray(draft.branches) && draft.branches.length > 0) {
        this.branches = draft.branches;
      }

      if (!draft.branches && this.currentStep === 5) {
        this.currentStep = 4;
      }

      if (this.currentStep === 4) this.loadCategories();
      if (this.currentStep === 5) this.loadDocumentTypes();
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
  }

  onDocumentSelected(document: RegistrationDocument, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.item(0);
    if (!file) return;

    this.clearDocumentPreview(document);
    document.file = undefined;
    document.fileName = undefined;
    document.fileSize = undefined;
    document.error = undefined;

    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      document.status = 'error';
      document.error = 'Selecciona un archivo PDF, JPG, PNG o WEBP.';
      input.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      document.status = 'error';
      document.error = 'El archivo no puede superar los 15 MB.';
      input.value = '';
      return;
    }

    document.file = file;
    document.fileName = file.name;
    document.fileSize = this.formatFileSize(file.size);
    document.previewUrl =
      typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : undefined;
    document.status = 'ready';
  }

  removeDocument(document: RegistrationDocument, input: HTMLInputElement): void {
    this.clearDocumentPreview(document);
    document.file = undefined;
    document.fileName = undefined;
    document.fileSize = undefined;
    document.error = undefined;
    document.status = 'pending';
    input.value = '';
  }

  isImage(document: RegistrationDocument): boolean {
    return Boolean(document.file?.type.startsWith('image/'));
  }

  retryDocumentTypes(): void {
    this.loadDocumentTypes();
  }

  private validateManager(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (this.manager.name.trim().length < 2) {
      errors['managerName'] = 'Escribe el nombre del encargado.';
    }

    if (this.manager.lastnameP.trim().length < 2) {
      errors['managerLastnameP'] = 'Escribe el apellido paterno.';
    }

    if (!EMAIL_PATTERN.test(this.manager.email.trim())) {
      errors['managerEmail'] = 'Escribe un correo electrónico válido.';
    }

    if (this.manager.phone && !PHONE_PATTERN.test(this.manager.phone.replace(/\D/g, ''))) {
      errors['managerPhone'] = 'El teléfono debe tener 10 dígitos.';
    }

    if (this.manager.password.length < 8) {
      errors['managerPassword'] = 'La contraseña debe tener al menos 8 caracteres.';
    }

    if (this.manager.password !== this.manager.passwordConfirmation) {
      errors['managerPasswordConfirmation'] = 'Las contraseñas no coinciden.';
    }

    return errors;
  }

  private validateBusiness(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (this.business.name.trim().length < 2) {
      errors['businessName'] = 'Escribe el nombre de tu negocio.';
    }

    if (!PHONE_PATTERN.test(this.business.phone.replace(/\D/g, ''))) {
      errors['businessPhone'] = 'El teléfono debe tener 10 dígitos.';
    }

    if (!EMAIL_PATTERN.test(this.business.email.trim())) {
      errors['businessEmail'] = 'Escribe un correo electrónico válido.';
    }

    if (!this.business.supplierType) {
      errors['supplierType'] = 'Selecciona cómo opera tu negocio.';
    }

    return errors;
  }

  private isRegistrationStep(value: unknown): value is RegistrationStep {
    return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
  }

  private loadDocumentTypes(): void {
    if (!this.business.supplierType) return;

    this.clearDocuments();
    this.documentsLoading = true;
    this.documentsError = '';

    this.registrationApi
      .getDocumentTypes(this.business.supplierType)
      .pipe(take(1))
      .subscribe({
        next: ({ data }) => {
          this.documents = data.map((document) => ({ ...document, status: 'pending' }));
          this.documentsLoading = false;
        },
        error: () => {
          this.documentsLoading = false;
          this.documentsError = 'No pudimos obtener los documentos requeridos. Intenta nuevamente.';
        },
      });
  }

  private clearDocuments(): void {
    this.documents.forEach((document) => this.clearDocumentPreview(document));
    this.documents = [];
    this.documentsLoading = false;
    this.documentsError = '';
  }

  private clearDocumentPreview(document: RegistrationDocument): void {
    if (document.previewUrl) URL.revokeObjectURL(document.previewUrl);
    document.previewUrl = undefined;
  }

  private formatFileSize(size: number): string {
    if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  private createManagerDraft(): ManagerDraft {
    return {
      name: '',
      lastnameP: '',
      lastnameM: '',
      phone: '',
      email: '',
      password: '',
      passwordConfirmation: '',
    };
  }

  private createBusinessDraft(): BusinessDraft {
    return {
      name: '',
      phone: '',
      email: '',
      supplierType: '',
    };
  }
}
