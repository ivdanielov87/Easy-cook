import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { RecipeService } from '../../../core/services/recipe.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Recipe } from '../../../core/models';
import { fadeIn, staggerList } from '../../../shared/animations';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  animations: [fadeIn, staggerList]
})
export class Home implements OnInit, OnDestroy {
  featuredRecipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  
  private connectionSubscription?: Subscription;

  constructor(
    private recipeService: RecipeService,
    private supabaseService: SupabaseService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadFeaturedRecipes();
    
    // Subscribe to connection restoration events
    this.connectionSubscription = this.supabaseService.connectionRestored$.subscribe(() => {
      console.log('[Home] Connection restored, reloading recipes...');
      this.loadFeaturedRecipes();
    });
  }
  
  ngOnDestroy(): void {
    this.connectionSubscription?.unsubscribe();
  }

  async loadFeaturedRecipes(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    
    try {
      const recipes = await this.recipeService.getRecipes();
      
      if (recipes.length === 0) {
        // Check if this is due to a timeout/error or genuinely no recipes
        console.warn('[Home] No recipes returned - may be timeout or connection issue');
        this.error.set('Unable to connect to the database. Please check your internet connection or try again later.');
      } else {
        // Get first 6 recipes as featured
        this.featuredRecipes.set(recipes.slice(0, 6));
      }
    } catch (err: any) {
      console.error('[Home] Error loading recipes:', err);
      const errorMessage = err.message?.includes('timeout') 
        ? 'Connection timeout. Please check your internet connection and try again.'
        : 'Failed to load recipes. Please try again.';
      this.error.set(errorMessage);
    } finally {
      this.loading.set(false);
    }
  }
}
