import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { RecipeService } from '../../core/services/recipe.service';
import { Recipe } from '../../core/models';
import { fadeIn } from '../../shared/animations';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
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
  savedRecipes = signal<Recipe[]>([]);
  loadingSavedRecipes = signal<boolean>(false);

  constructor(
    public authService: AuthService,
    private recipeService: RecipeService,
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

    this.loadSavedRecipes();
  }

  async loadSavedRecipes(): Promise<void> {
    this.loadingSavedRecipes.set(true);
    try {
      const recipes = await this.recipeService.getSavedRecipes();
      this.savedRecipes.set(recipes);
    } catch (error) {
      console.error('Error loading saved recipes:', error);
    } finally {
      this.loadingSavedRecipes.set(false);
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
