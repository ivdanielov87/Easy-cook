import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { SupabaseHttpService } from './supabase-http.service';
import { AuthService } from './auth.service';
import { Recipe, RecipeWithIngredients, RecipeIngredient, RecipeFilters, RecipeCreate, RecipeUpdate, RecipeIngredientInput } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(false);

  constructor(
    private supabase: SupabaseService,
    private supabaseHttp: SupabaseHttpService,
    private auth: AuthService
  ) {}

  /**
   * Fetch all recipes with optional filters
   */
  async getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    try {
      this.loading.set(true);

      const params: Record<string, string> = {
        'select': '*',
        'order': 'created_at.desc'
      };

      // Apply filters
      if (filters?.difficulty) {
        params['difficulty'] = `eq.${filters.difficulty}`;
      }

      if (filters?.prepTime) {
        switch (filters.prepTime) {
          case 'less_than_15':
            params['prep_time'] = 'lt.15';
            break;
          case '15_to_30':
            params['prep_time'] = 'gte.15';
            params['prep_time'] = 'lte.30';
            break;
          case '30_to_60':
            params['prep_time'] = 'gte.30';
            params['prep_time'] = 'lte.60';
            break;
          case 'more_than_60':
            params['prep_time'] = 'gt.60';
            break;
        }
      }

      if (filters?.search) {
        params['title'] = `ilike.*${filters.search}*`;
      }

      const { data, error } = await this.supabaseHttp.get<Recipe[]>('recipes', params);

      if (error) {
        throw error;
      }

      this.recipes.set(data as Recipe[]);
      return data as Recipe[];
    } catch (error: any) {
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get a single recipe by ID with ingredients (for editing)
   */
  async getRecipeById(id: string): Promise<RecipeWithIngredients | null> {
    try {
      this.loading.set(true);

      // First get the recipe by ID
      const { data: recipe, error: recipeError } = await this.supabase.client
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (recipeError) throw recipeError;
      if (!recipe) return null;

      // Then get the recipe ingredients
      const { data: ingredients, error: ingredientsError } = await this.supabase.client
        .from('recipe_ingredients')
        .select(`
          quantity,
          unit,
          ingredient:ingredients (
            id,
            name_bg,
            name_en
          )
        `)
        .eq('recipe_id', id);

      if (ingredientsError) throw ingredientsError;

      // Map ingredients to the expected format
      const mappedIngredients = (ingredients || []).map((ing: any) => ({
        id: ing.ingredient.id,
        name_bg: ing.ingredient.name_bg,
        name_en: ing.ingredient.name_en,
        quantity: ing.quantity,
        unit: ing.unit
      }));

      return {
        ...recipe,
        ingredients: mappedIngredients
      } as RecipeWithIngredients;
    } catch (error) {
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get a single recipe by slug with ingredients (for viewing)
   */
  async getRecipeBySlugWithIngredients(slug: string): Promise<RecipeWithIngredients | null> {
    try {
      this.loading.set(true);

      // First get the recipe by slug
      const recipeParams: Record<string, string> = {
        'select': '*',
        'slug': `eq.${slug}`
      };
      
      const { data: recipeData, error: recipeError } = await this.supabaseHttp.get<Recipe[]>('recipes', recipeParams);

      if (recipeError) throw recipeError;
      if (!recipeData || recipeData.length === 0) return null;

      const recipe = recipeData[0];

      // Then get the recipe ingredients with ingredient details
      const ingredientsParams: Record<string, string> = {
        'select': 'quantity,unit,ingredient_id,ingredients(id,name_bg,name_en)',
        'recipe_id': `eq.${recipe.id}`
      };
      
      const { data: ingredientsData, error: ingredientsError } = await this.supabaseHttp.get<any[]>('recipe_ingredients', ingredientsParams);

      if (ingredientsError) throw ingredientsError;

      // Map ingredients to the expected format
      const mappedIngredients = (ingredientsData || []).map((ing: any) => ({
        id: ing.ingredients?.id || ing.ingredient_id,
        name_bg: ing.ingredients?.name_bg || '',
        name_en: ing.ingredients?.name_en || '',
        quantity: ing.quantity,
        unit: ing.unit
      }));

      return {
        ...recipe,
        ingredients: mappedIngredients
      } as RecipeWithIngredients;
    } catch (error) {
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get recipe by slug
   */
  async getRecipeBySlug(slug: string): Promise<RecipeWithIngredients | null> {
    return await this.getRecipeBySlugWithIngredients(slug);
  }

  /**
   * Create a new recipe (admin only)
   */
  async createRecipe(recipe: RecipeCreate): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      this.loading.set(true);

      // Get Supabase credentials and user session
      const supabaseUrl = (this.supabase.client as any).supabaseUrl;
      const supabaseKey = (this.supabase.client as any).supabaseKey;
      
      const currentUser = this.auth.currentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      const userId = currentUser.id;
      
      // Get access token with timeout
      let accessToken = supabaseKey;
      try {
        const sessionPromise = this.supabase.client.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        accessToken = session?.access_token || supabaseKey;
      } catch (err) {
        // Use API key as fallback
      }

      // Insert recipe using direct HTTP POST
      const recipeResponse = await fetch(`${supabaseUrl}/rest/v1/recipes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: recipe.title,
          slug: recipe.slug,
          description: recipe.description,
          image_url: recipe.image_url,
          prep_time: recipe.prep_time,
          servings: recipe.servings,
          difficulty: recipe.difficulty,
          steps: recipe.steps,
          author_id: userId
        })
      });

      if (!recipeResponse.ok) {
        const errorText = await recipeResponse.text();
        throw new Error(`HTTP ${recipeResponse.status}: ${errorText}`);
      }

      const recipeDataArray = await recipeResponse.json();
      const recipeData = Array.isArray(recipeDataArray) ? recipeDataArray[0] : recipeDataArray;

      // Insert recipe ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        const ingredientsToInsert = recipe.ingredients.map((ing: RecipeIngredientInput) => ({
          recipe_id: recipeData.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit
        }));

        const ingredientsResponse = await fetch(`${supabaseUrl}/rest/v1/recipe_ingredients`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`,
            'Prefer': 'return=representation'
          },
          body: JSON.stringify(ingredientsToInsert)
        });

        if (!ingredientsResponse.ok) {
          const errorText = await ingredientsResponse.text();
          throw new Error(`HTTP ${ingredientsResponse.status}: ${errorText}`);
        }
      }

      return { success: true, data: recipeData as Recipe };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Update an existing recipe (admin only)
   */
  async updateRecipe(id: string, updates: RecipeUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      this.loading.set(true);

      // Get Supabase credentials
      const supabaseUrl = (this.supabase.client as any).supabaseUrl;
      const supabaseKey = (this.supabase.client as any).supabaseKey;
      
      // Get access token with timeout
      let accessToken = supabaseKey;
      try {
        const sessionPromise = this.supabase.client.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        accessToken = session?.access_token || supabaseKey;
      } catch (err) {
        // Use API key as fallback
      }

      // Update recipe using direct HTTP PATCH
      const recipeResponse = await fetch(`${supabaseUrl}/rest/v1/recipes?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: updates.title,
          description: updates.description,
          image_url: updates.image_url,
          prep_time: updates.prep_time,
          servings: updates.servings,
          difficulty: updates.difficulty,
          steps: updates.steps
        })
      });

      if (!recipeResponse.ok) {
        const errorText = await recipeResponse.text();
        throw new Error(`HTTP ${recipeResponse.status}: ${errorText}`);
      }

      // If ingredients are provided, update them
      if (updates.ingredients) {
        // Delete existing ingredients
        const deleteResponse = await fetch(`${supabaseUrl}/rest/v1/recipe_ingredients?recipe_id=eq.${id}`, {
          method: 'DELETE',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${accessToken}`
          }
        });

        if (!deleteResponse.ok) {
          const errorText = await deleteResponse.text();
          throw new Error(`Failed to delete ingredients: ${errorText}`);
        }

        // Insert new ingredients
        if (updates.ingredients.length > 0) {
          const ingredientsToInsert = updates.ingredients.map((ing: RecipeIngredientInput) => ({
            recipe_id: id,
            ingredient_id: ing.ingredient_id,
            quantity: ing.quantity,
            unit: ing.unit
          }));

          const insertResponse = await fetch(`${supabaseUrl}/rest/v1/recipe_ingredients`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': supabaseKey,
              'Authorization': `Bearer ${accessToken}`,
              'Prefer': 'return=representation'
            },
            body: JSON.stringify(ingredientsToInsert)
          });

          if (!insertResponse.ok) {
            const errorText = await insertResponse.text();
            throw new Error(`Failed to insert ingredients: ${errorText}`);
          }
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete a recipe (admin only)
   */
  async deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.loading.set(true);

      const { error } = await this.supabase.client
        .from('recipes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting recipe:', error);
      return { success: false, error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Search recipes by ingredients
   */
  async searchByIngredients(ingredientIds: string[]): Promise<Recipe[]> {
    try {
      this.loading.set(true);

      const { data, error } = await this.supabase.client
        .rpc('search_recipes_by_ingredients', { ingredient_ids: ingredientIds });

      if (error) throw error;

      return data as Recipe[];
    } catch (error) {
      console.error('Error searching recipes by ingredients:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Save recipe to favorites
   */
  async saveRecipe(recipeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.auth.currentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await this.supabaseHttp.post('saved_recipes', { 
        recipe_id: recipeId,
        user_id: currentUser.id
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error saving recipe:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Remove recipe from favorites
   */
  async unsaveRecipe(recipeId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = this.auth.currentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const params: Record<string, string> = {
        'recipe_id': `eq.${recipeId}`,
        'user_id': `eq.${currentUser.id}`
      };

      const { error } = await this.supabaseHttp.delete('saved_recipes', params);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unsaving recipe:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's saved recipes
   */
  async getSavedRecipes(): Promise<Recipe[]> {
    try {
      this.loading.set(true);

      const params: Record<string, string> = {
        'select': 'recipe_id,recipes(*)',
        'order': 'saved_at.desc'
      };

      const { data, error } = await this.supabaseHttp.get<any[]>('saved_recipes', params);

      if (error) throw error;

      return data ? data.map((item: any) => item.recipes) as Recipe[] : [];
    } catch (error) {
      console.error('Error fetching saved recipes:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Check if a recipe is saved by the current user
   */
  async isRecipeSaved(recipeId: string): Promise<boolean> {
    try {
      const currentUser = this.auth.currentUser();
      
      if (!currentUser) {
        return false;
      }

      const params: Record<string, string> = {
        'select': 'id',
        'user_id': `eq.${currentUser.id}`,
        'recipe_id': `eq.${recipeId}`
      };

      const { data, error } = await this.supabaseHttp.get<any[]>('saved_recipes', params);

      if (error) {
        console.error('Error checking if recipe is saved:', error);
        return false;
      }

      return !!(data && data.length > 0);
    } catch (error) {
      console.error('Error checking if recipe is saved:', error);
      return false;
    }
  }
}
