export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Recipe {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string | null;
  prep_time: number;
  servings: number;
  difficulty: Difficulty;
  author_id: string;
  created_at: string;
  updated_at?: string;
  steps?: string[];
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredientDetail[];
}

export interface RecipeIngredientDetail {
  id: string;
  name_bg: string;
  name_en: string;
  quantity: string;
  unit: string;
}

export interface RecipeCreate {
  title: string;
  slug: string;
  description: string;
  image_url?: string | null;
  prep_time: number;
  servings: number;
  difficulty: Difficulty;
  steps?: string[];
  ingredients: RecipeIngredientInput[];
}

export interface RecipeUpdate {
  title?: string;
  slug?: string;
  description?: string;
  image_url?: string | null;
  prep_time?: number;
  servings?: number;
  difficulty?: Difficulty;
  steps?: string[];
  ingredients?: RecipeIngredientInput[];
}

export interface RecipeIngredientInput {
  ingredient_id: string;
  quantity: string;
  unit: string;
}

export interface RecipeFilters {
  difficulty?: Difficulty;
  prepTime?: 'less_than_15' | '15_to_30' | '30_to_60' | 'more_than_60';
  search?: string;
}
