export interface SavedRecipe {
  id: string;
  user_id: string;
  recipe_id: string;
  saved_at: string;
}

export interface SavedRecipeCreate {
  recipe_id: string;
}
