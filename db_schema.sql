-- ============================================================================
-- CookSmart Database Schema for Supabase Cloud (PostgreSQL)
-- ============================================================================
-- Version: 1.0
-- Date: 2025-12-25
-- Description: Complete database schema with tables, constraints, triggers,
--              RLS policies, and indexes for the CookSmart recipe application
-- ============================================================================

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: CUSTOM TYPES
-- ============================================================================

-- Enum for recipe difficulty levels
CREATE TYPE difficulty_level AS ENUM ('Easy', 'Medium', 'Hard');

-- Enum for user roles
CREATE TYPE user_role AS ENUM ('user', 'admin');

-- ============================================================================
-- SECTION 3: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: profiles
-- Description: User profile information linked to Supabase auth.users
-- RLS: Public read, users can update their own profile
-- ----------------------------------------------------------------------------
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Add index for role-based queries
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- Add comment
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON COLUMN profiles.role IS 'User role: user or admin';

-- ----------------------------------------------------------------------------
-- Table: ingredients
-- Description: Master list of ingredients (normalized)
-- RLS: Public read, admin-only write
-- ----------------------------------------------------------------------------
CREATE TABLE ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);

-- Add index for case-insensitive search
CREATE INDEX idx_ingredients_name_lower ON ingredients(LOWER(name));

COMMENT ON TABLE ingredients IS 'Master list of ingredient names';

-- ----------------------------------------------------------------------------
-- Table: recipes
-- Description: Recipe content and metadata
-- RLS: Public read, admin-only write
-- ----------------------------------------------------------------------------
CREATE TABLE recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    image_url TEXT,
    prep_time INTEGER NOT NULL,
    servings INTEGER NOT NULL DEFAULT 1,
    difficulty difficulty_level NOT NULL DEFAULT 'Medium',
    steps JSONB,
    author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT title_not_empty CHECK (LENGTH(TRIM(title)) > 0),
    CONSTRAINT slug_not_empty CHECK (LENGTH(TRIM(slug)) > 0),
    CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT prep_time_positive CHECK (prep_time > 0),
    CONSTRAINT servings_positive CHECK (servings > 0)
);

-- Add indexes for common queries
CREATE INDEX idx_recipes_slug ON recipes(slug);
CREATE INDEX idx_recipes_author_id ON recipes(author_id);
CREATE INDEX idx_recipes_difficulty ON recipes(difficulty);
CREATE INDEX idx_recipes_prep_time ON recipes(prep_time);
CREATE INDEX idx_recipes_created_at ON recipes(created_at DESC);

-- Add full-text search index on title and description
CREATE INDEX idx_recipes_search ON recipes USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(description, ''))
);

COMMENT ON TABLE recipes IS 'Recipe content and metadata';
COMMENT ON COLUMN recipes.slug IS 'URL-safe unique identifier (lowercase, hyphens)';
COMMENT ON COLUMN recipes.steps IS 'JSON array of cooking step strings';

-- ----------------------------------------------------------------------------
-- Table: recipe_ingredients
-- Description: Many-to-many relationship between recipes and ingredients
-- RLS: Public read, admin-only write
-- ----------------------------------------------------------------------------
CREATE TABLE recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity TEXT NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT quantity_not_empty CHECK (LENGTH(TRIM(quantity)) > 0),
    CONSTRAINT unit_not_empty CHECK (LENGTH(TRIM(unit)) > 0),
    CONSTRAINT unique_recipe_ingredient UNIQUE (recipe_id, ingredient_id)
);

-- Add indexes for ingredient-based search
CREATE INDEX idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);
CREATE INDEX idx_recipe_ingredients_composite ON recipe_ingredients(ingredient_id, recipe_id);

COMMENT ON TABLE recipe_ingredients IS 'Junction table linking recipes to ingredients with quantities';

-- ----------------------------------------------------------------------------
-- Table: saved_recipes
-- Description: User's saved/favorited recipes
-- RLS: Users can only CRUD their own saved recipes
-- ----------------------------------------------------------------------------
CREATE TABLE saved_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_user_recipe UNIQUE (user_id, recipe_id)
);

-- Add indexes for user's saved recipes queries
CREATE INDEX idx_saved_recipes_user_id ON saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_recipe_id ON saved_recipes(recipe_id);
CREATE INDEX idx_saved_recipes_saved_at ON saved_recipes(saved_at DESC);

COMMENT ON TABLE saved_recipes IS 'User favorites/bookmarked recipes';

-- ============================================================================
-- SECTION 4: TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: Auto-create profile on user registration
-- Description: Automatically creates a profile row when a new user registers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, display_name, role)
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
        'user'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 'Auto-creates profile when user registers';

-- ----------------------------------------------------------------------------
-- Trigger: Update updated_at timestamp
-- Description: Automatically updates updated_at column on row modification
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to profiles table
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Apply to recipes table
CREATE TRIGGER set_updated_at_recipes
    BEFORE UPDATE ON recipes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

COMMENT ON FUNCTION public.handle_updated_at() IS 'Auto-updates updated_at timestamp';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS Policies: profiles
-- ----------------------------------------------------------------------------

-- Public read access to all profiles
CREATE POLICY "profiles_select_public"
    ON profiles
    FOR SELECT
    TO public
    USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
    ON profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Users can insert their own profile (for manual profile creation if needed)
CREATE POLICY "profiles_insert_own"
    ON profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

COMMENT ON POLICY "profiles_select_public" ON profiles IS 'Anyone can view profiles';
COMMENT ON POLICY "profiles_update_own" ON profiles IS 'Users can update their own profile';

-- ----------------------------------------------------------------------------
-- RLS Policies: ingredients
-- ----------------------------------------------------------------------------

-- Public read access to all ingredients
CREATE POLICY "ingredients_select_public"
    ON ingredients
    FOR SELECT
    TO public
    USING (true);

-- Only admins can insert ingredients
CREATE POLICY "ingredients_insert_admin"
    ON ingredients
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update ingredients
CREATE POLICY "ingredients_update_admin"
    ON ingredients
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete ingredients
CREATE POLICY "ingredients_delete_admin"
    ON ingredients
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON POLICY "ingredients_select_public" ON ingredients IS 'Anyone can view ingredients';
COMMENT ON POLICY "ingredients_insert_admin" ON ingredients IS 'Only admins can add ingredients';

-- ----------------------------------------------------------------------------
-- RLS Policies: recipes
-- ----------------------------------------------------------------------------

-- Public read access to all recipes
CREATE POLICY "recipes_select_public"
    ON recipes
    FOR SELECT
    TO public
    USING (true);

-- Only admins can insert recipes
CREATE POLICY "recipes_insert_admin"
    ON recipes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update recipes
CREATE POLICY "recipes_update_admin"
    ON recipes
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete recipes
CREATE POLICY "recipes_delete_admin"
    ON recipes
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON POLICY "recipes_select_public" ON recipes IS 'Anyone can view recipes';
COMMENT ON POLICY "recipes_insert_admin" ON recipes IS 'Only admins can create recipes';

-- ----------------------------------------------------------------------------
-- RLS Policies: recipe_ingredients
-- ----------------------------------------------------------------------------

-- Public read access to all recipe ingredients
CREATE POLICY "recipe_ingredients_select_public"
    ON recipe_ingredients
    FOR SELECT
    TO public
    USING (true);

-- Only admins can insert recipe ingredients
CREATE POLICY "recipe_ingredients_insert_admin"
    ON recipe_ingredients
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can update recipe ingredients
CREATE POLICY "recipe_ingredients_update_admin"
    ON recipe_ingredients
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Only admins can delete recipe ingredients
CREATE POLICY "recipe_ingredients_delete_admin"
    ON recipe_ingredients
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

COMMENT ON POLICY "recipe_ingredients_select_public" ON recipe_ingredients IS 'Anyone can view recipe ingredients';

-- ----------------------------------------------------------------------------
-- RLS Policies: saved_recipes
-- ----------------------------------------------------------------------------

-- Users can only view their own saved recipes
CREATE POLICY "saved_recipes_select_own"
    ON saved_recipes
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can only insert their own saved recipes
CREATE POLICY "saved_recipes_insert_own"
    ON saved_recipes
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own saved recipes
CREATE POLICY "saved_recipes_delete_own"
    ON saved_recipes
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

COMMENT ON POLICY "saved_recipes_select_own" ON saved_recipes IS 'Users can only view their own saved recipes';
COMMENT ON POLICY "saved_recipes_insert_own" ON saved_recipes IS 'Users can only save recipes for themselves';

-- ============================================================================
-- SECTION 6: HELPER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: search_recipes_by_ingredients
-- Description: Find recipes containing specified ingredients, ranked by match count
-- Parameters: ingredient_ids UUID[] - Array of ingredient IDs to search for
-- Returns: Table with recipe details and match count
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_recipes_by_ingredients(ingredient_ids UUID[])
RETURNS TABLE (
    recipe_id UUID,
    title TEXT,
    slug TEXT,
    description TEXT,
    image_url TEXT,
    prep_time INTEGER,
    servings INTEGER,
    difficulty difficulty_level,
    match_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id AS recipe_id,
        r.title,
        r.slug,
        r.description,
        r.image_url,
        r.prep_time,
        r.servings,
        r.difficulty,
        COUNT(ri.ingredient_id) AS match_count
    FROM recipes r
    INNER JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE ri.ingredient_id = ANY(ingredient_ids)
    GROUP BY r.id, r.title, r.slug, r.description, r.image_url, r.prep_time, r.servings, r.difficulty
    ORDER BY match_count DESC, r.title ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_recipes_by_ingredients(UUID[]) IS 'Search recipes by ingredient IDs, ranked by match count';

-- ----------------------------------------------------------------------------
-- Function: get_recipe_with_ingredients
-- Description: Get complete recipe details including ingredients list
-- Parameters: recipe_slug TEXT - Recipe slug identifier
-- Returns: JSON object with recipe and ingredients
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION get_recipe_with_ingredients(recipe_slug TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'recipe', row_to_json(r.*),
        'ingredients', (
            SELECT json_agg(
                json_build_object(
                    'id', i.id,
                    'name_bg', i.name_bg,
                    'name_en', i.name_en,
                    'quantity', ri.quantity,
                    'unit', ri.unit
                )
            )
            FROM recipe_ingredients ri
            INNER JOIN ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = r.id
        )
    )
    INTO result
    FROM recipes r
    WHERE r.slug = recipe_slug;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_recipe_with_ingredients(TEXT) IS 'Get recipe with all ingredients in single query';

-- ============================================================================
-- SECTION 7: SAMPLE DATA (OPTIONAL - COMMENT OUT FOR PRODUCTION)
-- ============================================================================

-- Uncomment the following section to insert sample data for testing

/*
-- Sample ingredients
INSERT INTO ingredients (name) VALUES
    ('Eggs'),
    ('Flour'),
    ('Milk'),
    ('Sugar'),
    ('Butter'),
    ('Salt'),
    ('Chicken Breast'),
    ('Tomatoes'),
    ('Onion'),
    ('Garlic')
ON CONFLICT (name) DO NOTHING;

-- Note: To create sample recipes, you need an admin user first
-- Manually promote a user to admin after registration:
-- UPDATE profiles SET role = 'admin' WHERE email = 'your-admin@example.com';
*/

-- ============================================================================
-- SECTION 8: VERIFICATION QUERIES
-- ============================================================================

-- Run these queries after deployment to verify the schema

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check policies
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- Check triggers
-- SELECT trigger_name, event_manipulation, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_schema = 'public';

-- ============================================================================
-- DEPLOYMENT INSTRUCTIONS
-- ============================================================================

/*
1. Open Supabase Dashboard → SQL Editor
2. Create a new query
3. Copy and paste this entire file
4. Click "Run" to execute
5. Verify all tables created successfully
6. Create a test user via Supabase Auth UI
7. Verify profile was auto-created in profiles table
8. Manually promote test user to admin:
   UPDATE profiles SET role = 'admin' WHERE email = 'test@example.com';
9. Test RLS policies by attempting operations with different user roles
10. Configure Storage bucket 'recipes' with public read access

STORAGE BUCKET CONFIGURATION:
- Bucket name: recipes
- Public: true (for read access)
- File size limit: 5MB
- Allowed MIME types: image/jpeg, image/png, image/webp

RLS POLICY FOR STORAGE (run in SQL Editor):

-- Allow public read access to recipes bucket
CREATE POLICY "recipes_bucket_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'recipes');

-- Allow authenticated admins to upload to recipes bucket
CREATE POLICY "recipes_bucket_insert_admin"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'recipes' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Allow authenticated admins to delete from recipes bucket
CREATE POLICY "recipes_bucket_delete_admin"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'recipes' AND
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);
*/

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
