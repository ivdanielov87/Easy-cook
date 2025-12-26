import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { fadeIn } from '../../../shared/animations';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
  animations: [fadeIn]
})
export class Login {
  email = signal<string>('');
  password = signal<string>('');
  loading = signal<boolean>(false);
  error = signal<string>('');

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (!this.email() || !this.password()) {
      this.error.set('AUTH.FILL_ALL_FIELDS');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    try {
      await this.authService.signIn(this.email(), this.password());
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error.set(err.message || 'AUTH.LOGIN_ERROR');
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
}
