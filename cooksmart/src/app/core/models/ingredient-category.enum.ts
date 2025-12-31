export enum IngredientCategory {
  VEGETABLES = 'vegetables',
  FRUITS = 'fruits',
  MEAT = 'meat',
  FISH = 'fish',
  DAIRY = 'dairy',
  GRAINS = 'grains',
  LEGUMES = 'legumes',
  NUTS_SEEDS = 'nuts_seeds',
  HERBS_SPICES = 'herbs_spices',
  OILS_FATS = 'oils_fats',
  CONDIMENTS = 'condiments',
  BAKING = 'baking',
  BEVERAGES = 'beverages',
  OTHER = 'other'
}

export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, { en: string; bg: string }> = {
  [IngredientCategory.VEGETABLES]: { en: 'Vegetables', bg: 'Зеленчуци' },
  [IngredientCategory.FRUITS]: { en: 'Fruits', bg: 'Плодове' },
  [IngredientCategory.MEAT]: { en: 'Meat', bg: 'Месо' },
  [IngredientCategory.FISH]: { en: 'Fish & Seafood', bg: 'Риба и морски дарове' },
  [IngredientCategory.DAIRY]: { en: 'Dairy & Eggs', bg: 'Млечни продукти и яйца' },
  [IngredientCategory.GRAINS]: { en: 'Grains & Pasta', bg: 'Зърнени храни и паста' },
  [IngredientCategory.LEGUMES]: { en: 'Legumes', bg: 'Бобови култури' },
  [IngredientCategory.NUTS_SEEDS]: { en: 'Nuts & Seeds', bg: 'Ядки и семена' },
  [IngredientCategory.HERBS_SPICES]: { en: 'Herbs & Spices', bg: 'Билки и подправки' },
  [IngredientCategory.OILS_FATS]: { en: 'Oils & Fats', bg: 'Масла и мазнини' },
  [IngredientCategory.CONDIMENTS]: { en: 'Condiments & Sauces', bg: 'Подправки и сосове' },
  [IngredientCategory.BAKING]: { en: 'Baking Supplies', bg: 'Продукти за печене' },
  [IngredientCategory.BEVERAGES]: { en: 'Beverages', bg: 'Напитки' },
  [IngredientCategory.OTHER]: { en: 'Other', bg: 'Други' }
};
