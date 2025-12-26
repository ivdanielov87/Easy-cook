export interface Ingredient {
  id: string;
  name: string;
  created_at?: string;
}

export interface IngredientCreate {
  name: string;
}

export interface IngredientUpdate {
  name: string;
}
