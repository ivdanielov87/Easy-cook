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
      
      const { data, error } = await this.supabase.client
        .from('ingredients')
        .select('*')
        .order(orderBy, { ascending: true });

      if (error) throw error;

      this.ingredients.set(data as Ingredient[]);
      return data as Ingredient[];
    } catch (error) {
      console.error('Error fetching ingredients:', error);
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
      const { data, error } = await this.supabase.client
        .from('ingredients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return data as Ingredient;
    } catch (error) {
      console.error('Error fetching ingredient:', error);
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

      console.log('[IngredientService] Calling Supabase insert...');
      
      // Try simpler insert without select
      const insertResult = await this.supabase.client
        .from('ingredients')
        .insert(ingredient);

      console.log('[IngredientService] Insert response received:', insertResult);

      if (insertResult.error) {
        console.error('[IngredientService] Insert error:', insertResult.error);
        throw insertResult.error;
      }

      console.log('[IngredientService] Insert successful, now fetching the created ingredient...');
      
      // Fetch the created ingredient separately
      const { data, error } = await this.supabase.client
        .from('ingredients')
        .select()
        .eq('name_bg', ingredient.name_bg)
        .eq('name_en', ingredient.name_en)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('[IngredientService] Fetch result:', { data, error });

      if (error) {
        console.error('[IngredientService] Fetch error:', error);
        // Return success anyway since insert worked
        return { success: true, data: { id: '', ...ingredient, created_at: new Date().toISOString() } as Ingredient };
      }

      console.log('[IngredientService] Ingredient created successfully:', data);
      
      return { success: true, data: data as Ingredient };
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

      const { data, error } = await this.supabase.client
        .from('ingredients')
        .select('*')
        .or(`name_bg.ilike.%${query}%,name_en.ilike.%${query}%`)
        .order(orderBy, { ascending: true });

      if (error) throw error;

      return data as Ingredient[];
    } catch (error) {
      console.error('Error searching ingredients:', error);
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
