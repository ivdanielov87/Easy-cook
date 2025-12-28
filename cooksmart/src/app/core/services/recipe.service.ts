import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Recipe, RecipeWithIngredients, RecipeCreate, RecipeUpdate, RecipeFilters } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  recipes = signal<Recipe[]>([]);
  loading = signal<boolean>(false);

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  /**
   * Fetch all recipes with optional filters
   */
  async getRecipes(filters?: RecipeFilters): Promise<Recipe[]> {
    console.log('[RecipeService] getRecipes() called with filters:', filters);
    try {
      this.loading.set(true);
      console.log('[RecipeService] Loading set to true');

      // Build query function for retry logic
      const buildAndExecuteQuery = async () => {
        console.log('[RecipeService] Building query...');
        let query = this.supabase.client
          .from('recipes')
          .select('*')
          .order('created_at', { ascending: false });

        // Apply filters
        if (filters?.difficulty) {
          query = query.eq('difficulty', filters.difficulty);
        }

        if (filters?.prepTime) {
          switch (filters.prepTime) {
            case 'less_than_15':
              query = query.lt('prep_time', 15);
              break;
            case '15_to_30':
              query = query.gte('prep_time', 15).lte('prep_time', 30);
              break;
            case '30_to_60':
              query = query.gte('prep_time', 30).lte('prep_time', 60);
              break;
            case 'more_than_60':
              query = query.gt('prep_time', 60);
              break;
          }
        }

        if (filters?.search) {
          query = query.ilike('title', `%${filters.search}%`);
        }

        return query;
      };

      // Execute query with retry logic to handle stale connections
      console.log('[RecipeService] Executing query with retry...');
      let data, error;
      
      try {
        const result = await this.supabase.withRetry(buildAndExecuteQuery, 2, 5000);
        console.log('[RecipeService] Query completed, result:', result);
        ({ data, error } = result as any);
      } catch (retryError: any) {
        console.error('[RecipeService] Query failed after retries:', retryError);
        throw new Error(retryError.message || 'Request failed after retries');
      }

      if (error) {
        console.error('[RecipeService] Query error:', error);
        throw error;
      }

      console.log('[RecipeService] Data received, count:', data?.length || 0);
      this.recipes.set(data as Recipe[]);
      return data as Recipe[];
    } catch (error: any) {
      console.error('[RecipeService] EXCEPTION in getRecipes:', error);
      console.error('[RecipeService] Error message:', error.message);
      console.error('[RecipeService] Error stack:', error.stack);
      
      // If timeout or connection error, show user-friendly message
      if (error.message?.includes('timeout') || error.message?.includes('stale')) {
        console.error('[RecipeService] Connection timeout - please refresh the page');
      }
      
      return [];
    } finally {
      console.log('[RecipeService] Finally block - setting loading to false');
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
      console.error('Error fetching recipe by ID:', error);
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

      // Use the get_recipe_with_ingredients RPC function
      const { data, error } = await this.supabase.client
        .rpc('get_recipe_with_ingredients', { recipe_slug: slug });

      if (error) throw error;

      // The RPC function returns {recipe: {...}, ingredients: [...]}
      // We need to combine them into the RecipeWithIngredients format
      if (data && typeof data === 'object' && 'recipe' in data && 'ingredients' in data) {
        const result = {
          ...data.recipe,
          ingredients: data.ingredients
        };
        return result as RecipeWithIngredients;
      }

      return data as RecipeWithIngredients;
    } catch (error) {
      console.error('Error fetching recipe by slug:', error);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get recipe by slug
   */
  async getRecipeBySlug(slug: string): Promise<RecipeWithIngredients | null> {
    try {
      this.loading.set(true);

      const { data, error } = await this.supabase.client
        .from('recipes')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;

      if (data) {
        return await this.getRecipeBySlugWithIngredients(data.slug);
      }

      return null;
    } catch (error) {
      console.error('Error fetching recipe by slug:', error);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new recipe (admin only)
   */
  async createRecipe(recipe: RecipeCreate): Promise<{ success: boolean; data?: Recipe; error?: string }> {
    try {
      console.log('[RecipeService] Starting recipe creation...');
      console.log('[RecipeService] Recipe data:', recipe);
      this.loading.set(true);

      // Get Supabase credentials and user session
      const supabaseUrl = (this.supabase.client as any).supabaseUrl;
      const supabaseKey = (this.supabase.client as any).supabaseKey;
      
      console.log('[RecipeService] Getting user ID from AuthService...');
      const currentUser = this.auth.currentUser();
      
      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }
      
      const userId = currentUser.id;
      console.log('[RecipeService] User ID:', userId);
      
      // Get access token with timeout
      let accessToken = supabaseKey;
      try {
        const sessionPromise = this.supabase.client.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session timeout')), 2000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        accessToken = session?.access_token || supabaseKey;
        console.log('[RecipeService] Got access token');
      } catch (err) {
        console.warn('[RecipeService] Session fetch timed out, using API key');
      }

      // Insert recipe using direct HTTP POST
      console.log('[RecipeService] Inserting recipe via HTTP POST...');
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

      console.log('[RecipeService] Recipe HTTP response status:', recipeResponse.status);

      if (!recipeResponse.ok) {
        const errorText = await recipeResponse.text();
        console.error('[RecipeService] Recipe HTTP error:', errorText);
        throw new Error(`HTTP ${recipeResponse.status}: ${errorText}`);
      }

      const recipeDataArray = await recipeResponse.json();
      const recipeData = Array.isArray(recipeDataArray) ? recipeDataArray[0] : recipeDataArray;
      
      console.log('[RecipeService] Recipe created successfully with ID:', recipeData.id);

      // Insert recipe ingredients
      if (recipe.ingredients && recipe.ingredients.length > 0) {
        console.log('[RecipeService] Inserting', recipe.ingredients.length, 'ingredients...');
        const ingredientsToInsert = recipe.ingredients.map(ing => ({
          recipe_id: recipeData.id,
          ingredient_id: ing.ingredient_id,
          quantity: ing.quantity,
          unit: ing.unit
        }));

        console.log('[RecipeService] Ingredients to insert:', ingredientsToInsert);

        // Insert recipe_ingredients using direct HTTP POST
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

        console.log('[RecipeService] Ingredients HTTP response status:', ingredientsResponse.status);

        if (!ingredientsResponse.ok) {
          const errorText = await ingredientsResponse.text();
          console.error('[RecipeService] Ingredients HTTP error:', errorText);
          throw new Error(`HTTP ${ingredientsResponse.status}: ${errorText}`);
        }

        console.log('[RecipeService] All ingredients inserted successfully');
      }

      console.log('[RecipeService] Recipe creation complete!');
      return { success: true, data: recipeData as Recipe };
    } catch (error: any) {
      console.error('[RecipeService] Exception during recipe creation:', error);
      return { success: false, error: error.message };
    } finally {
      console.log('[RecipeService] Setting loading to false');
      this.loading.set(false);
    }
  }

  /**
   * Update an existing recipe (admin only)
   */
  async updateRecipe(id: string, updates: RecipeUpdate): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[RecipeService] Starting recipe update...');
      console.log('[RecipeService] Recipe ID:', id);
      console.log('[RecipeService] Update data:', updates);
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
        console.log('[RecipeService] Got access token');
      } catch (err) {
        console.warn('[RecipeService] Session fetch timed out, using API key');
      }

      // Update recipe using direct HTTP PATCH
      console.log('[RecipeService] Updating recipe via HTTP PATCH...');
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

      console.log('[RecipeService] Recipe update HTTP response status:', recipeResponse.status);

      if (!recipeResponse.ok) {
        const errorText = await recipeResponse.text();
        console.error('[RecipeService] Recipe update HTTP error:', errorText);
        throw new Error(`HTTP ${recipeResponse.status}: ${errorText}`);
      }

      // If ingredients are provided, update them
      if (updates.ingredients) {
        console.log('[RecipeService] Updating ingredients...');
        
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
          console.error('[RecipeService] Delete ingredients HTTP error:', errorText);
          throw new Error(`Failed to delete ingredients: ${errorText}`);
        }

        // Insert new ingredients
        if (updates.ingredients.length > 0) {
          const ingredientsToInsert = updates.ingredients.map(ing => ({
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
            console.error('[RecipeService] Insert ingredients HTTP error:', errorText);
            throw new Error(`Failed to insert ingredients: ${errorText}`);
          }
        }
      }

      console.log('[RecipeService] Recipe updated successfully');
      return { success: true };
    } catch (error: any) {
      console.error('[RecipeService] Error updating recipe:', error);
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

      const { error } = await this.supabase.client
        .from('saved_recipes')
        .insert({ 
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

      const { error } = await this.supabase.client
        .from('saved_recipes')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('user_id', currentUser.id);

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

      const { data, error } = await this.supabase.client
        .from('saved_recipes')
        .select('recipe_id, recipes(*)')
        .order('saved_at', { ascending: false });

      if (error) throw error;

      return data.map((item: any) => item.recipes) as Recipe[];
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

      const { data, error } = await this.supabase.client
        .from('saved_recipes')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('recipe_id', recipeId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking if recipe is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if recipe is saved:', error);
      return false;
    }
  }
}
