import { IngredientCategory } from './ingredient-category.enum';

export interface Ingredient {
  id: string;
  name_bg: string;
  name_en: string;
  category: IngredientCategory;
  created_at?: string;
}

export interface IngredientCreate {
  name_bg: string;
  name_en: string;
  category: IngredientCategory;
}

export interface IngredientUpdate {
  name_bg?: string;
  name_en?: string;
  category?: IngredientCategory;
}
