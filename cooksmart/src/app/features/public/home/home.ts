import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { Recipe } from '../../../core/models';
import { fadeIn, staggerList } from '../../../shared/animations';

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  animations: [fadeIn, staggerList]
})
export class Home implements OnInit {
  featuredRecipes = signal<Recipe[]>([]);
  loading = signal<boolean>(true);

  constructor(private recipeService: RecipeService) {}

  async ngOnInit(): Promise<void> {
    await this.loadFeaturedRecipes();
  }

  async loadFeaturedRecipes(): Promise<void> {
    this.loading.set(true);
    const recipes = await this.recipeService.getRecipes();
    // Get first 6 recipes as featured
    this.featuredRecipes.set(recipes.slice(0, 6));
    this.loading.set(false);
  }
}
