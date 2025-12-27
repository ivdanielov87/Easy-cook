import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { fadeIn } from '../../shared/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
  animations: [fadeIn]
})
export class Profile implements OnInit {
  displayName = signal<string>('');
  email = signal<string>('');
  saving = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const profile = this.authService.currentProfile();
    const user = this.authService.currentUser();
    
    if (profile) {
      this.displayName.set(profile.display_name || '');
    }
    
    if (user) {
      this.email.set(user.email || '');
    }
  }

  async updateProfile(): Promise<void> {
    this.saving.set(true);
    this.error.set('');
    this.success.set('');

    try {
      const result = await this.authService.updateProfile({
        display_name: this.displayName().trim()
      });

      if (result.success) {
        this.success.set('Profile updated successfully');
        setTimeout(() => this.success.set(''), 3000);
      } else {
        this.error.set(result.error || 'Failed to update profile');
      }
    } catch (err: any) {
      this.error.set(err.message || 'An error occurred');
    } finally {
      this.saving.set(false);
    }
  }
}
