import { Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Ingredient, IngredientCreate } from '../models';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {
  ingredients = signal<Ingredient[]>([]);
  loading = signal<boolean>(false);

  constructor(private supabase: SupabaseService) {}

  /**
   * Fetch all ingredients
   */
  async getIngredients(): Promise<Ingredient[]> {
    try {
      this.loading.set(true);

      const { data, error } = await this.supabase.client
        .from('ingredients')
        .select('*')
        .order('name', { ascending: true });

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
      this.loading.set(true);

      const { data, error } = await this.supabase.client
        .from('ingredients')
        .insert(ingredient)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as Ingredient };
    } catch (error: any) {
      console.error('Error creating ingredient:', error);
      return { success: false, error: error.message };
    } finally {
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
   * Search ingredients by name
   */
  async searchIngredients(query: string): Promise<Ingredient[]> {
    try {
      this.loading.set(true);

      const { data, error } = await this.supabase.client
        .from('ingredients')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('name', { ascending: true });

      if (error) throw error;

      return data as Ingredient[];
    } catch (error) {
      console.error('Error searching ingredients:', error);
      return [];
    } finally {
      this.loading.set(false);
    }
  }
}
