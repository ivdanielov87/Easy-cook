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
  confirmPassword = signal<string>('');
  displayName = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');
  registrationComplete = signal<boolean>(false);
  showPassword = signal<boolean>(false);
  showConfirmPassword = signal<boolean>(false);
  
  // Password validation states
  passwordTouched = signal<boolean>(false);
  hasMinLength = signal<boolean>(false);
  hasUpperCase = signal<boolean>(false);
  hasLowerCase = signal<boolean>(false);
  hasNumber = signal<boolean>(false);
  passwordsMatch = signal<boolean>(false);
  passwordStrength = signal<'weak' | 'medium' | 'good' | ''>('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password() || !this.confirmPassword() || !this.displayName()) {
      this.error.set('ERRORS.FILL_ALL_FIELDS');
      return;
    }

    if (!this.validatePassword()) {
      this.error.set('ERRORS.MEET_PASSWORD_REQUIREMENTS');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.error.set('ERRORS.PASSWORDS_DONT_MATCH');
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
    this.passwordTouched.set(true);
    this.validatePasswordStrength(value);
    this.checkPasswordsMatch();
  }

  onConfirmPasswordChange(value: string): void {
    this.confirmPassword.set(value);
    this.checkPasswordsMatch();
  }

  togglePasswordVisibility(): void {
    this.showPassword.set(!this.showPassword());
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword.set(!this.showConfirmPassword());
  }

  validatePasswordStrength(password: string): void {
    // Check minimum length (8 characters)
    this.hasMinLength.set(password.length >= 8);
    
    // Check for uppercase letter
    this.hasUpperCase.set(/[A-Z]/.test(password));
    
    // Check for lowercase letter
    this.hasLowerCase.set(/[a-z]/.test(password));
    
    // Check for number
    this.hasNumber.set(/[0-9]/.test(password));
    
    // Calculate password strength
    const validations = [
      this.hasMinLength(),
      this.hasUpperCase(),
      this.hasLowerCase(),
      this.hasNumber()
    ];
    
    const validCount = validations.filter(v => v).length;
    
    if (validCount === 4) {
      this.passwordStrength.set('good');
    } else if (validCount >= 2) {
      this.passwordStrength.set('medium');
    } else if (validCount >= 1) {
      this.passwordStrength.set('weak');
    } else {
      this.passwordStrength.set('');
    }
  }

  checkPasswordsMatch(): void {
    if (this.confirmPassword()) {
      this.passwordsMatch.set(this.password() === this.confirmPassword());
    }
  }

  validatePassword(): boolean {
    return this.hasMinLength() && 
           this.hasUpperCase() && 
           this.hasLowerCase() && 
           this.hasNumber();
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
