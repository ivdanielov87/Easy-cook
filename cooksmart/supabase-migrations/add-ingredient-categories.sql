-- Migration: Add category field to ingredients table
-- This migration adds a category enum and updates the ingredients table to include category classification

-- Step 1: Create the ingredient_category enum type
CREATE TYPE ingredient_category AS ENUM (
  'vegetables',
  'fruits',
  'meat',
  'fish',
  'dairy',
  'grains',
  'legumes',
  'nuts_seeds',
  'herbs_spices',
  'oils_fats',
  'condiments',
  'baking',
  'beverages',
  'other'
);

-- Step 2: Add category column to ingredients table with default value
ALTER TABLE ingredients 
ADD COLUMN category ingredient_category NOT NULL DEFAULT 'other';

-- Step 3: Update existing ingredients with appropriate categories (examples)
-- You should manually categorize your existing ingredients based on your data
-- Here are some example updates:

-- Vegetables
UPDATE ingredients SET category = 'vegetables' 
WHERE name_en ILIKE ANY(ARRAY['%tomato%', '%onion%', '%garlic%', '%pepper%', '%carrot%', '%potato%', '%cucumber%', '%lettuce%', '%spinach%', '%broccoli%', '%cabbage%', '%zucchini%', '%eggplant%']);

-- Fruits
UPDATE ingredients SET category = 'fruits' 
WHERE name_en ILIKE ANY(ARRAY['%apple%', '%banana%', '%orange%', '%lemon%', '%lime%', '%berry%', '%grape%', '%melon%', '%peach%', '%pear%']);

-- Meat
UPDATE ingredients SET category = 'meat' 
WHERE name_en ILIKE ANY(ARRAY['%chicken%', '%beef%', '%pork%', '%lamb%', '%turkey%', '%bacon%', '%sausage%', '%ham%']);

-- Fish & Seafood
UPDATE ingredients SET category = 'fish' 
WHERE name_en ILIKE ANY(ARRAY['%fish%', '%salmon%', '%tuna%', '%shrimp%', '%prawn%', '%crab%', '%lobster%', '%mussel%', '%oyster%', '%squid%']);

-- Dairy & Eggs
UPDATE ingredients SET category = 'dairy' 
WHERE name_en ILIKE ANY(ARRAY['%milk%', '%cheese%', '%butter%', '%cream%', '%yogurt%', '%egg%']);

-- Grains & Pasta
UPDATE ingredients SET category = 'grains' 
WHERE name_en ILIKE ANY(ARRAY['%rice%', '%pasta%', '%bread%', '%flour%', '%noodle%', '%wheat%', '%oat%', '%quinoa%', '%couscous%']);

-- Legumes
UPDATE ingredients SET category = 'legumes' 
WHERE name_en ILIKE ANY(ARRAY['%bean%', '%lentil%', '%chickpea%', '%pea%', '%soy%', '%tofu%']);

-- Nuts & Seeds
UPDATE ingredients SET category = 'nuts_seeds' 
WHERE name_en ILIKE ANY(ARRAY['%nut%', '%almond%', '%walnut%', '%peanut%', '%cashew%', '%seed%', '%sesame%', '%sunflower%']);

-- Herbs & Spices
UPDATE ingredients SET category = 'herbs_spices' 
WHERE name_en ILIKE ANY(ARRAY['%basil%', '%oregano%', '%thyme%', '%rosemary%', '%parsley%', '%cilantro%', '%mint%', '%pepper%', '%salt%', '%cumin%', '%paprika%', '%cinnamon%', '%ginger%', '%turmeric%']);

-- Oils & Fats
UPDATE ingredients SET category = 'oils_fats' 
WHERE name_en ILIKE ANY(ARRAY['%oil%', '%olive oil%', '%vegetable oil%', '%coconut oil%', '%butter%']);

-- Condiments & Sauces
UPDATE ingredients SET category = 'condiments' 
WHERE name_en ILIKE ANY(ARRAY['%sauce%', '%ketchup%', '%mustard%', '%mayo%', '%vinegar%', '%soy sauce%', '%honey%', '%syrup%']);

-- Baking Supplies
UPDATE ingredients SET category = 'baking' 
WHERE name_en ILIKE ANY(ARRAY['%sugar%', '%baking powder%', '%baking soda%', '%yeast%', '%vanilla%', '%chocolate%']);

-- Beverages
UPDATE ingredients SET category = 'beverages' 
WHERE name_en ILIKE ANY(ARRAY['%water%', '%juice%', '%coffee%', '%tea%', '%wine%', '%beer%', '%broth%', '%stock%']);

-- Step 4: Create index on category for better query performance
CREATE INDEX idx_ingredients_category ON ingredients(category);

-- Step 5: Update RLS policies if needed (they should still work with the new column)
-- No changes needed to existing RLS policies

-- Verification query to check distribution
-- SELECT category, COUNT(*) as count 
-- FROM ingredients 
-- GROUP BY category 
-- ORDER BY count DESC;
