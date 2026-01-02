import { IngredientUnit } from './ingredient-unit.enum';

export interface RecipeIngredient {
  id: string;
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: IngredientUnit;
  created_at?: string;
}

export interface RecipeIngredientCreate {
  recipe_id: string;
  ingredient_id: string;
  quantity: string;
  unit: IngredientUnit;
}
