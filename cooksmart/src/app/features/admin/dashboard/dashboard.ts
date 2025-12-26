import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { fadeIn } from '../../../shared/animations';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  animations: [fadeIn]
})
export class Dashboard implements OnInit {
  totalRecipes = signal<number>(0);
  loading = signal<boolean>(true);

  constructor(private recipeService: RecipeService) {}

  async ngOnInit(): Promise<void> {
    await this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.loading.set(true);
    const recipes = await this.recipeService.getRecipes();
    this.totalRecipes.set(recipes.length);
    this.loading.set(false);
  }
}
