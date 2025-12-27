-- Migration: Update get_recipe_with_ingredients function to use name_bg and name_en
-- Date: 2024-12-27
-- Description: Updates the RPC function to return name_bg and name_en instead of the old name column

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

COMMENT ON FUNCTION get_recipe_with_ingredients(TEXT) IS 'Get recipe with all ingredients including name_bg and name_en';
