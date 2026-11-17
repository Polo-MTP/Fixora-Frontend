import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type RegistrationStep = 1 | 2 | 3;
type SupplierType = 'independiente' | 'empresa';

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
  completed: boolean;
  manager: Omit<ManagerDraft, 'password' | 'passwordConfirmation'>;
  business: BusinessDraft;
}

const DRAFT_KEY = 'fixora-provider-registration-draft-v1';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\d{10}$/;

@Component({
  selector: 'app-provider-registration',
  imports: [FormsModule, RouterLink],
  templateUrl: './registro-proveedor.html',
  styleUrl: './registro-proveedor.css',
})
export class ProviderRegistration implements OnInit {
  currentStep: RegistrationStep = 1;
  completed = false;
  restoredDraft = false;
  showPassword = false;
  showPasswordConfirmation = false;

  manager: ManagerDraft = this.createManagerDraft();
  business: BusinessDraft = this.createBusinessDraft();
  errors: Record<string, string> = {};

  ngOnInit(): void {
    this.restoreDraft();
  }

  startRegistration(): void {
    this.completed = false;
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

      this.completed = true;
      this.saveDraft();
    }
  }

  back(): void {
    if (this.currentStep === 3) {
      this.completed = false;
      this.currentStep = 2;
    } else if (this.currentStep === 2) {
      this.currentStep = 1;
    }

    this.errors = {};
    this.saveDraft();
  }

  editBusiness(): void {
    this.completed = false;
    this.errors = {};
    this.saveDraft();
  }

  saveDraft(): void {
    const draft: RegistrationDraft = {
      step: this.currentStep,
      completed: this.completed,
      manager: {
        name: this.manager.name,
        lastnameP: this.manager.lastnameP,
        lastnameM: this.manager.lastnameM,
        phone: this.manager.phone,
        email: this.manager.email,
      },
      business: { ...this.business },
    };

    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  clearDraft(): void {
    this.currentStep = 1;
    this.completed = false;
    this.restoredDraft = false;
    this.showPassword = false;
    this.showPasswordConfirmation = false;
    this.manager = this.createManagerDraft();
    this.business = this.createBusinessDraft();
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
      this.completed = Boolean(draft.completed) && this.currentStep === 3;
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
    } catch {
      sessionStorage.removeItem(DRAFT_KEY);
    }
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
    return value === 1 || value === 2 || value === 3;
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
