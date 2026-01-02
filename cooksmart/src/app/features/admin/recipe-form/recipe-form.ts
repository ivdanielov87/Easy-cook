import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RecipeService } from '../../../core/services/recipe.service';
import { IngredientService } from '../../../core/services/ingredient.service';
import { Recipe, Ingredient, RecipeIngredient, IngredientCategory, INGREDIENT_CATEGORY_LABELS, IngredientUnit, INGREDIENT_UNIT_LABELS } from '../../../core/models';
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
  newIngredientCategory = signal<string>('');
  creatingIngredient = signal<boolean>(false);
  ingredientError = signal<string>('');
  ingredientSuccess = signal<string>('');
  
  // Steps
  steps = signal<string[]>(['']);
  
  error = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private recipeService: RecipeService,
    private ingredientService: IngredientService,
    private translate: TranslateService
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
    console.log('=== Adding ingredient ===');
    console.log('Ingredient:', ingredient);
    console.log('Current selected ingredients:', this.selectedIngredients());
    
    const exists = this.selectedIngredients().some(i => i.ingredient_id === ingredient.id);
    console.log('Already exists?', exists);
    
    if (exists) {
      console.log('Ingredient already selected, skipping');
      return;
    }
    
    console.log('Adding ingredient to selected list');
    this.selectedIngredients.update(ingredients => [
      ...ingredients,
      {
        ingredient_id: ingredient.id,
        quantity: '',
        unit: ''
      }
    ]);
    
    console.log('Updated selected ingredients:', this.selectedIngredients());
    console.log('=== Ingredient added ===');
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
    console.log('=== Recipe Form Submit Started ===');
    console.log('Form validation starting...');
    
    if (!this.validateForm()) {
      console.log('Form validation failed:', this.error());
      return;
    }
    
    console.log('Form validation passed');
    this.saving.set(true);
    this.error.set('');
    
    try {
      let result;
      
      if (this.isEditMode() && this.recipeId()) {
        console.log('Edit mode - updating recipe:', this.recipeId());
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
        console.log('Update data:', updateData);
        result = await this.recipeService.updateRecipe(this.recipeId()!, updateData);
      } else {
        console.log('Create mode - creating new recipe');
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
        console.log('Create data:', createData);
        console.log('Calling recipeService.createRecipe...');
        result = await this.recipeService.createRecipe(createData);
        console.log('Recipe service result:', result);
      }
      
      if (result.success) {
        console.log('Recipe saved successfully, navigating to /admin/recipes');
        this.router.navigate(['/admin/recipes']);
      } else {
        const errorMsg = result.error || 'Failed to save recipe';
        console.error('Recipe save failed:', errorMsg);
        this.error.set(errorMsg);
        alert('Error: ' + errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      console.error('Exception during recipe save:', err);
      this.error.set(errorMsg);
      alert('Error: ' + errorMsg);
    } finally {
      console.log('Setting saving to false');
      this.saving.set(false);
      console.log('=== Recipe Form Submit Complete ===');
    }
  }

  generateSlug(title: string): string {
    // Transliterate Cyrillic to Latin
    const cyrillicToLatin: { [key: string]: string } = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ж': 'zh', 'з': 'z',
      'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
      'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch',
      'ш': 'sh', 'щ': 'sht', 'ъ': 'a', 'ь': 'y', 'ю': 'yu', 'я': 'ya'
    };
    
    return title
      .toLowerCase()
      .trim()
      .split('')
      .map(char => cyrillicToLatin[char] || char)
      .join('')
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
    const category = this.newIngredientCategory().trim();
    
    console.log('=== Starting ingredient creation ===');
    console.log('Creating ingredient:', { nameBg, nameEn, category });
    console.log('Current creatingIngredient state:', this.creatingIngredient());
    
    if (!nameBg || !nameEn || !category) {
      this.ingredientError.set(this.translate.instant('ADMIN.INGREDIENT_REQUIRED_FIELDS'));
      return;
    }

    // Check if ingredient already exists
    const existingIngredient = this.availableIngredients().find(
      ing => ing.name_bg.toLowerCase() === nameBg.toLowerCase() || 
             ing.name_en.toLowerCase() === nameEn.toLowerCase()
    );

    if (existingIngredient) {
      const name = `${existingIngredient.name_bg} / ${existingIngredient.name_en}`;
      this.ingredientError.set(this.translate.instant('ADMIN.INGREDIENT_ALREADY_EXISTS', { name }));
      return;
    }

    this.creatingIngredient.set(true);
    console.log('Set creatingIngredient to true');
    this.ingredientError.set('');
    this.ingredientSuccess.set('');

    try {
      console.log('Calling ingredientService.createIngredient...');
      const result = await this.ingredientService.createIngredient({
        name_bg: nameBg,
        name_en: nameEn,
        category: category as IngredientCategory
      });

      console.log('Create ingredient result:', result);

      if (result.success && result.data) {
        console.log('Success! Reloading ingredients list...');
        
        // Reload the full ingredients list from the database to ensure sync
        await this.loadIngredients();
        
        // Show success message
        const name = `${result.data.name_bg} / ${result.data.name_en}`;
        this.ingredientSuccess.set(this.translate.instant('ADMIN.INGREDIENT_CREATED_SUCCESS', { name }));
        
        console.log('Resetting form...');
        // Reset form after a short delay to show success message
        setTimeout(() => {
          this.newIngredientNameBg.set('');
          this.newIngredientNameEn.set('');
          this.newIngredientCategory.set('');
          this.showNewIngredientForm.set(false);
          this.ingredientError.set('');
          this.ingredientSuccess.set('');
        }, 2000);
        
        console.log('Adding ingredient to selected...');
        // Optionally add to selected ingredients
        this.addIngredient(result.data);
        
        console.log('Ingredient created successfully:', result.data);
      } else {
        const errorMsg = result.error || 'Failed to create ingredient';
        this.ingredientError.set(errorMsg);
        this.ingredientSuccess.set('');
        console.error('Failed to create ingredient:', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      this.ingredientError.set(errorMsg);
      this.ingredientSuccess.set('');
      console.error('Exception creating ingredient:', err);
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
    this.newIngredientCategory.set('');
    this.creatingIngredient.set(false);
    this.ingredientError.set('');
    this.error.set('');
    
    this.showNewIngredientForm.set(willShow);
  }

  getIngredientCategories(): IngredientCategory[] {
    return Object.values(IngredientCategory);
  }

  getCategoryLabel(category: IngredientCategory): string {
    const currentLang = this.translate.currentLang || 'en';
    return INGREDIENT_CATEGORY_LABELS[category][currentLang as 'en' | 'bg'];
  }

  getIngredientUnits(): IngredientUnit[] {
    return Object.values(IngredientUnit);
  }

  getUnitLabel(unit: IngredientUnit): string {
    const currentLang = this.translate.currentLang || 'en';
    return INGREDIENT_UNIT_LABELS[unit][currentLang as 'en' | 'bg'];
  }
}
