import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe, RecipeFilters, Difficulty } from '../../../core/models';
import { fadeIn, staggerList } from '../../../shared/animations';

@Component({
  selector: 'app-recipe-list',
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './recipe-list.html',
  styleUrl: './recipe-list.scss',
  animations: [fadeIn, staggerList]
})
export class RecipeList implements OnInit {
  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  error = signal<string>('');
  
  // Filter signals
  selectedDifficulty = signal<Difficulty | ''>('');
  selectedPrepTime = signal<'less_than_15' | '15_to_30' | '30_to_60' | 'more_than_60' | ''>('');
  searchQuery = signal<string>('');

  constructor(private recipeService: RecipeService) {}

  async ngOnInit(): Promise<void> {
    await this.loadRecipes();
  }

  async loadRecipes(): Promise<void> {
    console.log('[RecipeList] loadRecipes() called');
    this.loading.set(true);
    this.error.set('');
    
    const filters: RecipeFilters = {};
    
    if (this.selectedDifficulty()) {
      filters.difficulty = this.selectedDifficulty() as Difficulty;
    }
    
    if (this.selectedPrepTime()) {
      filters.prepTime = this.selectedPrepTime() as any;
    }
    
    if (this.searchQuery()) {
      filters.search = this.searchQuery();
    }
    
    console.log('[RecipeList] Filters:', filters);
    
    try {
      console.log('[RecipeList] Starting recipe fetch with timeout...');
      
      // Create timeout that will definitely trigger
      let timeoutId: any;
      const timeoutPromise = new Promise<Recipe[]>((_, reject) => {
        timeoutId = setTimeout(() => {
          console.error('[RecipeList] TIMEOUT TRIGGERED after 15 seconds');
          reject(new Error('Loading timeout - please refresh the page'));
        }, 15000);
      });
      
      const recipesPromise = this.recipeService.getRecipes(filters).then(recipes => {
        console.log('[RecipeList] Recipes received:', recipes.length);
        clearTimeout(timeoutId);
        return recipes;
      });
      
      const recipes = await Promise.race([recipesPromise, timeoutPromise]);
      console.log('[RecipeList] Setting recipes:', recipes.length);
      this.recipes.set(recipes);
    } catch (err: any) {
      console.error('[RecipeList] Error loading recipes:', err);
      this.error.set(err.message || 'Failed to load recipes. Please refresh the page.');
      this.recipes.set([]);
    } finally {
      console.log('[RecipeList] Setting loading to false');
      this.loading.set(false);
    }
  }

  onDifficultyChange(value: string): void {
    this.selectedDifficulty.set(value as Difficulty | '');
    this.loadRecipes();
  }

  onPrepTimeChange(value: string): void {
    this.selectedPrepTime.set(value as any);
    this.loadRecipes();
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.loadRecipes();
  }

  clearFilters(): void {
    this.selectedDifficulty.set('');
    this.selectedPrepTime.set('');
    this.searchQuery.set('');
    this.loadRecipes();
  }
}
