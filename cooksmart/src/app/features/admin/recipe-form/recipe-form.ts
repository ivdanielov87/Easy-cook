import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { IngredientService } from '../../../core/services/ingredient.service';
import { Recipe, Ingredient, RecipeIngredient } from '../../../core/models';
import { fadeIn } from '../../../shared/animations';

@Component({
  selector: 'app-recipe-form',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './recipe-form.html',
  styleUrl: './recipe-form.scss',
  animations: [fadeIn]
})
export class RecipeForm implements OnInit {
  isEditMode = signal<boolean>(false);
  loading = signal<boolean>(false);
  saving = signal<boolean>(false);
  recipeId = signal<string | null>(null);

  // Form fields
  title = signal<string>('');
  description = signal<string>('');
  prepTime = signal<number>(30);
  servings = signal<number>(4);
  difficulty = signal<'Easy' | 'Medium' | 'Hard'>('Medium');
  imageUrl = signal<string>('');
  
  // Ingredients
  availableIngredients = signal<Ingredient[]>([]);
  selectedIngredients = signal<{ ingredient_id: string; quantity: string; unit: string; }[]>([]);
  ingredientSearch = signal<string>('');
  filteredIngredients = signal<Ingredient[]>([]);
  
  // New ingredient form
  showNewIngredientForm = signal<boolean>(false);
  newIngredientNameBg = signal<string>('');
  newIngredientNameEn = signal<string>('');
  creatingIngredient = signal<boolean>(false);
  
  // Steps
  steps = signal<string[]>(['']);
  
  error = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private ingredientService: IngredientService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.loadIngredients();
    
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.recipeId.set(id);
      await this.loadRecipe(id);
    }
  }

  async loadIngredients(): Promise<void> {
    const ingredients = await this.ingredientService.getIngredients();
    this.availableIngredients.set(ingredients);
    this.filteredIngredients.set(ingredients);
  }

  async loadRecipe(id: string): Promise<void> {
    this.loading.set(true);
    const recipe = await this.recipeService.getRecipeById(id);
    
    if (recipe) {
      this.title.set(recipe.title);
      this.description.set(recipe.description || '');
      this.prepTime.set(recipe.prep_time);
      this.servings.set(recipe.servings);
      this.difficulty.set(recipe.difficulty);
      this.imageUrl.set(recipe.image_url || '');
      this.steps.set(recipe.steps || ['']);
      
      // Map RecipeIngredientDetail to our form format
      const ingredients = (recipe.ingredients || []).map(ing => ({
        ingredient_id: ing.id,
        quantity: ing.quantity,
        unit: ing.unit
      }));
      this.selectedIngredients.set(ingredients);
    }
    
    this.loading.set(false);
  }

  onIngredientSearchChange(value: string): void {
    this.ingredientSearch.set(value);
    const query = value.toLowerCase();
    
    if (!query) {
      this.filteredIngredients.set(this.availableIngredients());
      return;
    }
    
    const filtered = this.availableIngredients().filter(ing =>
      ing.name_bg.toLowerCase().includes(query) || 
      ing.name_en.toLowerCase().includes(query)
    );
    this.filteredIngredients.set(filtered);
  }

  addIngredient(ingredient: Ingredient): void {
    const exists = this.selectedIngredients().some(i => i.ingredient_id === ingredient.id);
    if (exists) return;
    
    this.selectedIngredients.update(ingredients => [
      ...ingredients,
      {
        ingredient_id: ingredient.id,
        quantity: '',
        unit: ''
      }
    ]);
  }

  removeIngredient(ingredientId: string): void {
    this.selectedIngredients.update(ingredients =>
      ingredients.filter(i => i.ingredient_id !== ingredientId)
    );
  }

  updateIngredientQuantity(ingredientId: string, quantity: string): void {
    this.selectedIngredients.update(ingredients =>
      ingredients.map(i =>
        i.ingredient_id === ingredientId ? { ...i, quantity } : i
      )
    );
  }

  updateIngredientUnit(ingredientId: string, unit: string): void {
    this.selectedIngredients.update(ingredients =>
      ingredients.map(i =>
        i.ingredient_id === ingredientId ? { ...i, unit } : i
      )
    );
  }

  addStep(): void {
    this.steps.update(steps => [...steps, '']);
  }

  removeStep(index: number): void {
    if (this.steps().length <= 1) return;
    this.steps.update(steps => steps.filter((_, i) => i !== index));
  }

  updateStep(index: number, value: string): void {
    this.steps.update(steps =>
      steps.map((step, i) => i === index ? value : step)
    );
  }

  async onSubmit(): Promise<void> {
    if (!this.validateForm()) return;
    
    this.saving.set(true);
    this.error.set('');
    
    try {
      let result;
      
      if (this.isEditMode() && this.recipeId()) {
        const updateData = {
          title: this.title(),
          description: this.description(),
          prep_time: this.prepTime(),
          servings: this.servings(),
          difficulty: this.difficulty(),
          image_url: this.imageUrl() || null,
          steps: this.steps().filter(s => s.trim()),
          ingredients: this.selectedIngredients()
        };
        result = await this.recipeService.updateRecipe(this.recipeId()!, updateData);
      } else {
        const createData = {
          title: this.title(),
          slug: this.generateSlug(this.title()),
          description: this.description(),
          prep_time: this.prepTime(),
          servings: this.servings(),
          difficulty: this.difficulty(),
          image_url: this.imageUrl() || null,
          steps: this.steps().filter(s => s.trim()),
          ingredients: this.selectedIngredients()
        };
        result = await this.recipeService.createRecipe(createData);
      }
      
      if (result.success) {
        this.router.navigate(['/admin/recipes']);
      } else {
        this.error.set(result.error || 'Failed to save recipe');
      }
    } catch (err: any) {
      this.error.set(err.message || 'An error occurred');
    } finally {
      this.saving.set(false);
    }
  }

  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  validateForm(): boolean {
    if (!this.title().trim()) {
      this.error.set('Title is required');
      return false;
    }
    
    if (this.selectedIngredients().length === 0) {
      this.error.set('At least one ingredient is required');
      return false;
    }
    
    if (this.steps().filter(s => s.trim()).length === 0) {
      this.error.set('At least one step is required');
      return false;
    }
    
    return true;
  }

  cancel(): void {
    this.router.navigate(['/admin/recipes']);
  }

  isIngredientSelected(ingredientId: string): boolean {
    return this.selectedIngredients().some(i => i.ingredient_id === ingredientId);
  }

  getIngredientName(ingredientId: string): string {
    const ingredient = this.availableIngredients().find(i => i.id === ingredientId);
    if (!ingredient) return '';
    return this.ingredientService.getIngredientName(ingredient);
  }

  async createNewIngredient(): Promise<void> {
    // Prevent double-clicking
    if (this.creatingIngredient()) {
      console.log('Already creating ingredient, ignoring duplicate call');
      return;
    }

    const nameBg = this.newIngredientNameBg().trim();
    const nameEn = this.newIngredientNameEn().trim();
    
    console.log('=== Starting ingredient creation ===');
    console.log('Creating ingredient:', { nameBg, nameEn });
    console.log('Current creatingIngredient state:', this.creatingIngredient());
    
    if (!nameBg || !nameEn) {
      this.error.set('Both Bulgarian and English names are required');
      alert('Both Bulgarian and English names are required');
      return;
    }

    this.creatingIngredient.set(true);
    console.log('Set creatingIngredient to true');
    this.error.set('');

    try {
      console.log('Calling ingredientService.createIngredient...');
      const result = await this.ingredientService.createIngredient({
        name_bg: nameBg,
        name_en: nameEn
      });

      console.log('Create ingredient result:', result);

      if (result.success && result.data) {
        console.log('Success! Adding ingredient to lists...');
        
        // Add to available ingredients
        this.availableIngredients.update(ingredients => [...ingredients, result.data!]);
        this.filteredIngredients.update(ingredients => [...ingredients, result.data!]);
        
        console.log('Resetting form...');
        // Reset form
        this.newIngredientNameBg.set('');
        this.newIngredientNameEn.set('');
        this.showNewIngredientForm.set(false);
        
        console.log('Adding ingredient to selected...');
        // Optionally add to selected ingredients
        this.addIngredient(result.data);
        
        // Show success message
        console.log('Ingredient created successfully:', result.data);
        alert('Ingredient created successfully: ' + nameBg + ' / ' + nameEn);
      } else {
        const errorMsg = result.error || 'Failed to create ingredient';
        this.error.set(errorMsg);
        console.error('Failed to create ingredient:', errorMsg);
        alert('Error creating ingredient: ' + errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      this.error.set(errorMsg);
      console.error('Exception creating ingredient:', err);
      alert('Error creating ingredient: ' + errorMsg);
    } finally {
      console.log('Setting creatingIngredient to false');
      this.creatingIngredient.set(false);
      console.log('Final creatingIngredient state:', this.creatingIngredient());
      console.log('=== Ingredient creation complete ===');
    }
  }

  toggleNewIngredientForm(): void {
    const willShow = !this.showNewIngredientForm();
    console.log('Toggling ingredient form, will show:', willShow);
    
    // Always reset form state when toggling
    this.newIngredientNameBg.set('');
    this.newIngredientNameEn.set('');
    this.creatingIngredient.set(false);
    this.error.set('');
    
    this.showNewIngredientForm.set(willShow);
  }
}
