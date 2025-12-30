export interface Ingredient {
  id: string;
  name_bg: string;
  name_en: string;
  created_at?: string;
}

export interface IngredientCreate {
  name_bg: string;
  name_en: string;
}

export interface IngredientUpdate {
  name_bg?: string;
  name_en?: string;
}
