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
  
  // Filter signals
  selectedDifficulty = signal<Difficulty | ''>('');
  selectedPrepTime = signal<'less_than_15' | '15_to_30' | '30_to_60' | 'more_than_60' | ''>('');
  searchQuery = signal<string>('');

  constructor(private recipeService: RecipeService) {}

  async ngOnInit(): Promise<void> {
    await this.loadRecipes();
  }

  async loadRecipes(): Promise<void> {
    this.loading.set(true);
    
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
    
    const recipes = await this.recipeService.getRecipes(filters);
    this.recipes.set(recipes);
    this.loading.set(false);
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
