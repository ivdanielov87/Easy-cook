import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Ingredient, IngredientCreate } from '../models';
import { TranslateService } from './translate.service';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  ingredients = signal<Ingredient[]>([]);
  loading = signal<boolean>(false);

  constructor(
    private supabase: SupabaseService,
    private translateService: TranslateService
  ) {}

  /**
   * Fetch all ingredients
   */
  async getIngredients(): Promise<Ingredient[]> {
    try {
      this.loading.set(true);

      const currentLang = this.translateService.getCurrentLanguage();
      const orderBy = currentLang === 'bg' ? 'name_bg' : 'name_en';
      
      // Build query function for retry logic
      const buildAndExecuteQuery = async () => {
        return this.supabase.client
          .from('ingredients')
          .select('*')
          .order(orderBy, { ascending: true });
      };

      // Execute query with retry logic to handle stale connections
      let data, error;
      try {
        const result = await this.supabase.withRetry(buildAndExecuteQuery, 2, 5000);
        ({ data, error } = result as any);
      } catch (retryError: any) {
        console.error('[IngredientService] Query failed after retries:', retryError);
        throw new Error(retryError.message || 'Request failed after retries');
      }

      if (error) throw error;

      this.ingredients.set(data as Ingredient[]);
      return data as Ingredient[];
    } catch (error: any) {
      console.error('[IngredientService] Error fetching ingredients:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get ingredient by ID
   */
  async getIngredientById(id: string): Promise<Ingredient | null> {
    try {
      // Build query function for retry logic
      const buildAndExecuteQuery = async () => {
        return this.supabase.client
          .from('ingredients')
          .select('*')
          .eq('id', id)
          .single();
      };

      // Execute query with retry logic
      let data, error;
      try {
        const result = await this.supabase.withRetry(buildAndExecuteQuery, 2, 5000);
        ({ data, error } = result as any);
      } catch (retryError: any) {
        console.error('[IngredientService] GetById failed after retries:', retryError);
        throw new Error(retryError.message || 'GetById failed after retries');
      }

      if (error) throw error;

      return data as Ingredient;
    } catch (error: any) {
      console.error('[IngredientService] Error fetching ingredient:', error);
      return null;
    }
  }

  /**
   * Create a new ingredient (admin only)
   */
  async createIngredient(ingredient: IngredientCreate): Promise<{ success: boolean; data?: Ingredient; error?: string }> {
    try {
      console.log('[IngredientService] Creating ingredient:', ingredient);
      this.loading.set(true);

      console.log('[IngredientService] Using direct HTTP POST to bypass Supabase client...');
      
      // Get the Supabase URL and key from environment
      const supabaseUrl = (this.supabase.client as any).supabaseUrl;
      const supabaseKey = (this.supabase.client as any).supabaseKey;
      
      // Get the user's session token for authentication
      const { data: { session } } = await this.supabase.client.auth.getSession();
      const accessToken = session?.access_token || supabaseKey;
      
      console.log('[IngredientService] Using access token for authentication');
      
      // Make direct HTTP request to bypass the hanging Supabase client
      const response = await fetch(`${supabaseUrl}/rest/v1/ingredients`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(ingredient)
      });

      console.log('[IngredientService] HTTP response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[IngredientService] HTTP error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[IngredientService] HTTP response data:', data);

      // The response should be an array with the inserted ingredient
      const createdIngredient = Array.isArray(data) ? data[0] : data;
      
      console.log('[IngredientService] Ingredient created successfully:', createdIngredient);
      
      return { success: true, data: createdIngredient as Ingredient };
    } catch (error: any) {
      console.error('[IngredientService] Exception creating ingredient:', error);
      return { success: false, error: error.message || 'Failed to create ingredient' };
    } finally {
      console.log('[IngredientService] Setting loading to false');
      this.loading.set(false);
    }
  }

  /**
   * Update an ingredient (admin only)
   */
  async updateIngredient(id: string, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.loading.set(true);

      const { error } = await this.supabase.client
        .from('ingredients')
        .update({ name })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error updating ingredient:', error);
      return { success: false, error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete an ingredient (admin only)
   */
  async deleteIngredient(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      this.loading.set(true);

      const { error } = await this.supabase.client
        .from('ingredients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deleting ingredient:', error);
      return { success: false, error: error.message };
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Search ingredients by name (searches both languages)
   */
  async searchIngredients(query: string): Promise<Ingredient[]> {
    try {
      this.loading.set(true);

      const currentLang = this.translateService.getCurrentLanguage();
      const orderBy = currentLang === 'bg' ? 'name_bg' : 'name_en';

      // Build query function for retry logic
      const buildAndExecuteQuery = async () => {
        return this.supabase.client
          .from('ingredients')
          .select('*')
          .or(`name_bg.ilike.%${query}%,name_en.ilike.%${query}%`)
          .order(orderBy, { ascending: true });
      };

      // Execute query with retry logic
      let data, error;
      try {
        const result = await this.supabase.withRetry(buildAndExecuteQuery, 2, 5000);
        ({ data, error } = result as any);
      } catch (retryError: any) {
        console.error('[IngredientService] Search failed after retries:', retryError);
        throw new Error(retryError.message || 'Search failed after retries');
      }

      if (error) throw error;

      return data as Ingredient[];
    } catch (error: any) {
      console.error('[IngredientService] Error searching ingredients:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get ingredient name in current language
   */
  getIngredientName(ingredient: Ingredient): string {
    const currentLang = this.translateService.getCurrentLanguage();
    return currentLang === 'bg' ? ingredient.name_bg : ingredient.name_en;
  }
}
