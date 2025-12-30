import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { AuthService } from '../../../core/services/auth.service';
import { TranslateService } from '../../../core/services/translate.service';
import { RecipeWithIngredients, RecipeIngredientDetail } from '../../../core/models';
import { fadeIn } from '../../../shared/animations';

@Component({
  selector: 'app-recipe-detail',
  imports: [CommonModule, FormsModule, TranslateModule, RouterLink],
  templateUrl: './recipe-detail.html',
  styleUrl: './recipe-detail.scss',
  animations: [fadeIn]
})
export class RecipeDetail implements OnInit {
  recipe = signal<RecipeWithIngredients | null>(null);
  loading = signal<boolean>(true);
  isSaved = signal<boolean>(false);
  savingRecipe = signal<boolean>(false);
  checkedIngredients = signal<boolean[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    public authService: AuthService,
    private translateService: TranslateService
  ) {}

  async ngOnInit(): Promise<void> {
    // Check if user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.loading.set(false);
      return;
    }

    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      await this.loadRecipe(slug);
    } else {
      this.router.navigate(['/recipes']);
    }
  }

  async loadRecipe(slug: string): Promise<void> {
    this.loading.set(true);
    const recipe = await this.recipeService.getRecipeBySlug(slug);
    
    if (recipe) {
      this.recipe.set(recipe);
      // Initialize checkbox states for all ingredients
      this.checkedIngredients.set(new Array(recipe.ingredients?.length || 0).fill(false));
      
      // Check if recipe is already saved
      const saved = await this.recipeService.isRecipeSaved(recipe.id);
      this.isSaved.set(saved);
    } else {
      this.router.navigate(['/recipes']);
    }
    
    this.loading.set(false);
  }

  async toggleSaveRecipe(): Promise<void> {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    const recipe = this.recipe();
    if (!recipe) return;

    this.savingRecipe.set(true);

    if (this.isSaved()) {
      const result = await this.recipeService.unsaveRecipe(recipe.id);
      if (result.success) {
        this.isSaved.set(false);
      }
    } else {
      const result = await this.recipeService.saveRecipe(recipe.id);
      if (result.success) {
        this.isSaved.set(true);
      }
    }

    this.savingRecipe.set(false);
  }

  goBack(): void {
    this.router.navigate(['/recipes']);
  }

  getIngredientName(ingredient: RecipeIngredientDetail): string {
    const currentLang = this.translateService.getCurrentLanguage();
    return currentLang === 'bg' ? ingredient.name_bg : ingredient.name_en;
  }
}
