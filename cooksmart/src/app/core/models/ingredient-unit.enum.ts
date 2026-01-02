export enum IngredientUnit {
  // Weight units
  GRAM = 'g',
  KILOGRAM = 'kg',
  MILLIGRAM = 'mg',
  OUNCE = 'oz',
  POUND = 'lb',
  
  // Volume units
  MILLILITER = 'ml',
  LITER = 'l',
  TEASPOON = 'tsp',
  TABLESPOON = 'tbsp',
  CUP = 'cup',
  FLUID_OUNCE = 'fl oz',
  PINT = 'pint',
  QUART = 'quart',
  GALLON = 'gallon',
  
  // Piece/count units
  PIECE = 'piece',
  SLICE = 'slice',
  CLOVE = 'clove',
  BUNCH = 'bunch',
  HANDFUL = 'handful',
  PINCH = 'pinch',
  DASH = 'dash',
  
  // Container units
  CAN = 'can',
  JAR = 'jar',
  PACKAGE = 'package',
  BOX = 'box',
  BAG = 'bag',
  
  // Cooking-specific
  TO_TASTE = 'to taste',
  AS_NEEDED = 'as needed',
  WHOLE = 'whole',
  HALF = 'half',
  QUARTER = 'quarter'
}

export const INGREDIENT_UNIT_LABELS: Record<IngredientUnit, { en: string; bg: string }> = {
  // Weight units
  [IngredientUnit.GRAM]: { en: 'gram (g)', bg: 'грам (g)' },
  [IngredientUnit.KILOGRAM]: { en: 'kilogram (kg)', bg: 'килограм (kg)' },
  [IngredientUnit.MILLIGRAM]: { en: 'milligram (mg)', bg: 'милиграм (mg)' },
  [IngredientUnit.OUNCE]: { en: 'ounce (oz)', bg: 'унция (oz)' },
  [IngredientUnit.POUND]: { en: 'pound (lb)', bg: 'фунт (lb)' },
  
  // Volume units
  [IngredientUnit.MILLILITER]: { en: 'milliliter (ml)', bg: 'милилитър (ml)' },
  [IngredientUnit.LITER]: { en: 'liter (l)', bg: 'литър (l)' },
  [IngredientUnit.TEASPOON]: { en: 'teaspoon (tsp)', bg: 'чаена лъжичка (ч.л.)' },
  [IngredientUnit.TABLESPOON]: { en: 'tablespoon (tbsp)', bg: 'супена лъжица (с.л.)' },
  [IngredientUnit.CUP]: { en: 'cup', bg: 'чаша' },
  [IngredientUnit.FLUID_OUNCE]: { en: 'fluid ounce (fl oz)', bg: 'течна унция (fl oz)' },
  [IngredientUnit.PINT]: { en: 'pint', bg: 'пинта' },
  [IngredientUnit.QUART]: { en: 'quart', bg: 'кварта' },
  [IngredientUnit.GALLON]: { en: 'gallon', bg: 'галон' },
  
  // Piece/count units
  [IngredientUnit.PIECE]: { en: 'piece', bg: 'брой' },
  [IngredientUnit.SLICE]: { en: 'slice', bg: 'филия' },
  [IngredientUnit.CLOVE]: { en: 'clove', bg: 'скилидка' },
  [IngredientUnit.BUNCH]: { en: 'bunch', bg: 'връзка' },
  [IngredientUnit.HANDFUL]: { en: 'handful', bg: 'шепа' },
  [IngredientUnit.PINCH]: { en: 'pinch', bg: 'щипка' },
  [IngredientUnit.DASH]: { en: 'dash', bg: 'малко' },
  
  // Container units
  [IngredientUnit.CAN]: { en: 'can', bg: 'консерва' },
  [IngredientUnit.JAR]: { en: 'jar', bg: 'буркан' },
  [IngredientUnit.PACKAGE]: { en: 'package', bg: 'пакет' },
  [IngredientUnit.BOX]: { en: 'box', bg: 'кутия' },
  [IngredientUnit.BAG]: { en: 'bag', bg: 'торбичка' },
  
  // Cooking-specific
  [IngredientUnit.TO_TASTE]: { en: 'to taste', bg: 'на вкус' },
  [IngredientUnit.AS_NEEDED]: { en: 'as needed', bg: 'по необходимост' },
  [IngredientUnit.WHOLE]: { en: 'whole', bg: 'цяло' },
  [IngredientUnit.HALF]: { en: 'half', bg: 'половин' },
  [IngredientUnit.QUARTER]: { en: 'quarter', bg: 'четвърт' }
};
