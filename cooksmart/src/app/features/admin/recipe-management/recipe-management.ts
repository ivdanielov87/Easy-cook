import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe } from '../../../core/models';
import { fadeIn, staggerList } from '../../../shared/animations';

@Component({
  selector: 'app-recipe-management',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './recipe-management.html',
  styleUrl: './recipe-management.scss',
  animations: [fadeIn, staggerList]
})
export class RecipeManagement implements OnInit {
  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);
  searchQuery = signal<string>('');
  filteredRecipes = signal<Recipe[]>([]);

  constructor(private recipeService: RecipeService) {}

  async ngOnInit(): Promise<void> {
    await this.loadRecipes();
  }

  async loadRecipes(): Promise<void> {
    this.loading.set(true);
    const recipes = await this.recipeService.getRecipes();
    this.recipes.set(recipes);
    this.filteredRecipes.set(recipes);
    this.loading.set(false);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
    this.filterRecipes();
  }

  filterRecipes(): void {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      this.filteredRecipes.set(this.recipes());
      return;
    }

    const filtered = this.recipes().filter(recipe =>
      recipe.title.toLowerCase().includes(query) ||
      recipe.description?.toLowerCase().includes(query)
    );
    this.filteredRecipes.set(filtered);
  }

  async deleteRecipe(id: string): Promise<void> {
    if (!confirm('Are you sure you want to delete this recipe?')) {
      return;
    }

    const result = await this.recipeService.deleteRecipe(id);
    if (result.success) {
      await this.loadRecipes();
    }
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: { [key: string]: string } = {
      'easy': 'RECIPE.EASY',
      'medium': 'RECIPE.MEDIUM',
      'hard': 'RECIPE.HARD'
    };
    return labels[difficulty] || difficulty;
  }
}
