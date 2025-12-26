export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
  created_at?: string;
}

export interface RecipeIngredientCreate {
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: string;
}
