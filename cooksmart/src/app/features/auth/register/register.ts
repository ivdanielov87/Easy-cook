import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { fadeIn } from '../../../shared/animations';

@Component({
  selector: 'app-register',
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  animations: [fadeIn]
})
export class Register {
  email = signal<string>('');
  password = signal<string>('');
  displayName = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');
  registrationComplete = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password() || !this.displayName()) {
      this.error.set('AUTH.FILL_ALL_FIELDS');
      return;
    }

    if (this.password().length < 6) {
      this.error.set('ERRORS.PASSWORD_TOO_SHORT');
      return;
    }

    this.loading.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const result = await this.authService.signUp(this.email(), this.password(), this.displayName());
      
      if (result.success) {
        // Show success message about email confirmation
        this.registrationComplete.set(true);
        this.success.set('AUTH.REGISTRATION_SUCCESS');
      } else {
        this.error.set(result.error || 'ERRORS.REGISTRATION_FAILED');
      }
    } catch (err: any) {
      this.error.set(err.message || 'ERRORS.REGISTRATION_FAILED');
    } finally {
      this.loading.set(false);
    }
  }

  onEmailChange(value: string): void {
    this.email.set(value);
  }

  onPasswordChange(value: string): void {
    this.password.set(value);
  }

  onDisplayNameChange(value: string): void {
    this.displayName.set(value);
  }

  async signInWithGoogle(): Promise<void> {
    this.loading.set(true);
    this.error.set('');

    try {
      const result = await this.authService.signInWithGoogle();
      if (!result.success && result.error) {
        this.error.set(result.error);
      }
    } catch (err: any) {
      this.error.set(err.message || 'ERRORS.REGISTRATION_FAILED');
    } finally {
      this.loading.set(false);
    }
  }
}
