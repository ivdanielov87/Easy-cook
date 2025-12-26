-- Migration: Add bilingual support to ingredients table
-- This migration adds name_bg and name_en columns to replace the single name column

-- Step 1: Add new bilingual columns
ALTER TABLE ingredients 
ADD COLUMN IF NOT EXISTS name_bg TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT;

-- Step 2: Migrate existing data (copy name to both columns as fallback)
-- You should manually update these with proper translations after running this migration
UPDATE ingredients 
SET 
  name_bg = COALESCE(name_bg, name),
  name_en = COALESCE(name_en, name)
WHERE name_bg IS NULL OR name_en IS NULL;

-- Step 3: Make the new columns NOT NULL after data migration
ALTER TABLE ingredients 
ALTER COLUMN name_bg SET NOT NULL,
ALTER COLUMN name_en SET NOT NULL;

-- Step 4: Remove NOT NULL constraint from old name column (to allow new inserts)
ALTER TABLE ingredients 
ALTER COLUMN name DROP NOT NULL;

-- Step 5: Set a default value for the old name column (for backward compatibility)
ALTER TABLE ingredients 
ALTER COLUMN name SET DEFAULT '';

-- Step 6: Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_ingredients_name_bg ON ingredients(name_bg);
CREATE INDEX IF NOT EXISTS idx_ingredients_name_en ON ingredients(name_en);

-- Step 7: Update RLS policies if needed (they should still work with the new columns)
-- No changes needed to RLS policies as they don't reference the name column directly

-- Note: You can optionally drop the 'name' column later once you're sure everything works:
-- ALTER TABLE ingredients DROP COLUMN IF EXISTS name;
