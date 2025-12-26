import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { IngredientService } from '../../../core/services/ingredient.service';
import { RecipeService } from '../../../core/services/recipe.service';
import { Ingredient, Recipe } from '../../../core/models';
import { fadeIn, staggerList } from '../../../shared/animations';

@Component({
  selector: 'app-pantry',
  imports: [CommonModule, RouterLink, FormsModule, TranslateModule],
  templateUrl: './pantry.html',
  styleUrl: './pantry.scss',
  animations: [fadeIn, staggerList]
})
export class Pantry implements OnInit {
  allIngredients = signal<Ingredient[]>([]);
  selectedIngredients = signal<string[]>([]);
  matchingRecipes = signal<Recipe[]>([]);
  searchQuery = signal<string>('');
  
  loadingIngredients = signal<boolean>(true);
  loadingRecipes = signal<boolean>(false);
  hasSearched = signal<boolean>(false);

  constructor(
    private ingredientService: IngredientService,
    private recipeService: RecipeService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadIngredients();
  }

  async loadIngredients(): Promise<void> {
    this.loadingIngredients.set(true);
    const ingredients = await this.ingredientService.getIngredients();
    this.allIngredients.set(ingredients);
    this.loadingIngredients.set(false);
  }

  get filteredIngredients(): Ingredient[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) {
      return this.allIngredients();
    }
    return this.allIngredients().filter(ing => 
      ing.name.toLowerCase().includes(query)
    );
  }

  toggleIngredient(ingredientId: string): void {
    const selected = this.selectedIngredients();
    if (selected.includes(ingredientId)) {
      this.selectedIngredients.set(selected.filter(id => id !== ingredientId));
    } else {
      this.selectedIngredients.set([...selected, ingredientId]);
    }
  }

  isSelected(ingredientId: string): boolean {
    return this.selectedIngredients().includes(ingredientId);
  }

  async findRecipes(): Promise<void> {
    if (this.selectedIngredients().length === 0) {
      return;
    }

    this.loadingRecipes.set(true);
    this.hasSearched.set(true);
    
    const recipes = await this.recipeService.searchByIngredients(
      this.selectedIngredients()
    );
    
    this.matchingRecipes.set(recipes);
    this.loadingRecipes.set(false);
  }

  clearSelection(): void {
    this.selectedIngredients.set([]);
    this.matchingRecipes.set([]);
    this.hasSearched.set(false);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }
}
