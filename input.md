# Product Specification: "CookSmart" - Recipe & Pantry Assistant

## 1. Overview & Goal
A smart cooking assistant built with Angular and Supabase that helps users find recipes based on ingredients they have at home. The app features a visually appealing interface for browsing recipes and a powerful backend for managing content.

## 2. App Structure (Layouts)
The application has two distinct layout modes to separate public access from administration:

1.  **Public Layout (`MainLayoutComponent`):**
    * **Navbar:** Logo, Smart Search Bar, Links (Home, My Pantry), User Menu (Login/Profile/Logout).
        * **Desktop:** Full horizontal menu with text links.
        * **Mobile/Tablet:** Collapsible "Hamburger" menu. Logo on the left, Cart/Profile icon on the right.
        * **Language Switcher:** In the navbar, there should be also a dropdown to switch between Bulgarian (BG) and English (EN) instantly. Default is BG.
        * **CRITICAL:** All navigation labels must use translation keys (translate pipe)
    * **Main Content:** The router outlet for public pages.
    * **Recipe Discovery (Grid Behavior):**
        * **Mobile:** 1 card per row (stacked).
        * **Tablet:** 2 cards per row.
        * **Desktop:** 3 or 4 cards per row.
    * **Footer:** Copyright, Social Links, Quick Links.
2.  **Admin Layout (`AdminLayoutComponent`):**
    * **Sidebar/TopBar:** Dashboard, Manage Recipes, Users, Logout.
    * **Content Area:** Tables and Forms for management.

## 3. User Roles & Authentication
* **Guest:** Can browse recipe list, but CANNOT view recipe details (must login first).
* **Registered User:** Can view recipe details, save favorites, manage their profile, use "My Pantry" features.
* **Admin:** Has all user rights + access to `/admin` routes.
    * *Implementation:* Role is stored in a public `profiles` table in Supabase, linked to `auth.users` via triggers.

### Authentication Requirements
* **Email/Password Authentication:**
    * Registration form must collect: email, password, display_name
    * Display name must be passed to Supabase as user metadata
    * Email confirmation is REQUIRED by default in Supabase
    * Show success message after registration with email confirmation instructions
    * Handle `email_not_confirmed` error on login with clear user messaging
* **Authentication Guards:**
    * Implement AuthGuard for protected routes (profile, saved recipes)
    * Implement AdminGuard for admin routes
    * Check authentication in components for protected content (recipe details)
    * Show login prompt with redirect buttons for unauthenticated users

## 4. Database Schema Requirements (Supabase Cloud)
**ACTION REQUIRED:** Please generate a `db_schema.sql` file that I can run in the Supabase SQL Editor. It must include the following tables and security policies:

### Tables
* **`profiles`**:
    * `id` (PK, references auth.users), `email`, `display_name`, `avatar_url`, `role` (text check: 'user' or 'admin').
    * **CRITICAL:** Profile creation trigger MUST extract `display_name` from `auth.users.raw_user_meta_data`:
    ```sql
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
    
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    ```
* **`recipes`**:
    * `id`, `title`, `slug` (unique), `description`, `image_url`, `prep_time` (mins), `servings`, `difficulty` (enum: 'Easy', 'Medium', 'Hard'), `author_id` (FK to profiles), `created_at`.
* **`ingredients`**:
    * `id`, `name` (unique).
* **`recipe_ingredients`** (Many-to-Many Link):
    * `recipe_id`, `ingredient_id`, `quantity`, `unit`.
* **`saved_recipes`**:
    * `user_id`, `recipe_id`, `saved_at`.

### Security (RLS Policies)
* **Recipes:** Public Read access. Insert/Update/Delete only for Admins (check `profiles.role`).
* **Profiles:** Users can update their own profile. Public read access.
* **Saved Recipes:** Users can only CRUD their own saved items.

## 5. Features by Module

### A. Core / Public (Guest & Users)
* **Home Page:** Featured recipes grid, "What can I cook now?" CTA.
* **Recipe Discovery:** List view with filters (Prep Time, Difficulty).
* **Recipe Details:**
    * **CRITICAL:** Requires authentication - show login prompt for guests
    * Header with high-res photo.
    * Info chips (Time, Servings, Difficulty).
    * Ingredients list (with checkboxes for tracking while cooking).
    * Step-by-step instructions.
    * "Save to Favorites" button (if authenticated).
* **Smart Pantry:**
    * User inputs ingredients (e.g., "Eggs, Flour, Milk").
    * **Algorithm:** Query the database to find recipes containing these ingredients.
    * *Logic Hint:* `SELECT * FROM recipes WHERE id IN (SELECT recipe_id FROM recipe_ingredients WHERE ingredient_id IN (user_selected_ids))`.

### B. User Profile (Private)
* **My Profile:** Form to edit Name/Avatar.
* **Saved Recipes:** A grid list of bookmarked recipes displayed directly on profile page.
    * **Mobile:** 1 card per row
    * **Tablet:** 2 cards per row
    * **Desktop:** 3-4 cards per row
    * Each card shows recipe thumbnail, title, difficulty, prep time
    * Click card to navigate to recipe detail

### C. Admin Panel (Protected Route)
* **Access:** Protected by `AdminGuard` (Angular) and RLS (Database).
* **Dashboard:** Quick stats cards (Total Recipes, Total Users).
* **Recipe Management (CRUD):**
    * **List:** Data table of all recipes with Edit/Delete actions.
    * **Create/Edit Form:**
        * Standard inputs: Title, Description, Difficulty.
        * **Image Upload:** Drag & drop zone. Uploads file to Supabase Storage bucket named 'recipes', retrieves public URL, and saves to DB.
        * **Dynamic Ingredients:** Ability to add/remove rows (Ingredient Name + Quantity).
        * **Steps Editor:** Dynamic list for adding cooking steps.

## 6. Environment Setup
* Create an `environment.ts` (and `prod`) template where I can paste my `supabaseUrl` and `supabaseKey`.

## 7. Testing Requirements

### Authentication Testing
**CRITICAL:** Do NOT use fake email domains for testing.

**Valid Test Emails:**
- Use real email domains: Gmail, Outlook, Yahoo, etc.
- Do NOT use: `user@example.com`, `test@test.com`, etc.
- **Why:** Supabase validates email domains and rejects fake domains with `400 Bad Request: email_address_invalid`

**Email Confirmation:**
- For development: Consider disabling email confirmation in Supabase Dashboard → Authentication → Email Auth
- For production: Keep enabled and ensure proper user messaging is implemented

**Testing Checklist:**
1. Register with real email address
2. Check email for confirmation link
3. Click confirmation link
4. Login with confirmed account
5. Test on actual mobile device (not just DevTools)
6. Verify saved recipes functionality
7. Test authentication guards (try accessing recipe detail as guest)
8. Test language switching (BG/EN)

## 8. UI/UX Requirements

### Success States
**CRITICAL:** Always show success feedback for important actions.

**Registration Success:**
- Show success card with checkmark icon
- Message: "Registration Successful!"
- Instructions: "Please check your email to confirm your account"
- Reminder: "Check spam folder if you don't see the email"
- Action button: "Go to Login"
- Do NOT auto-redirect

### Error Messages
**CRITICAL:** Provide specific, actionable error messages.

**Examples:**
- Email not confirmed: "Please confirm your email address before logging in. Check your inbox for the confirmation email."
- Invalid email domain: "Email address is invalid. Please use a real email domain (Gmail, Outlook, etc.)"
- Generic errors: Provide specific guidance on how to resolve

### Translation Keys
**CRITICAL:** Add translation keys for ALL user-facing text.

**Required Keys:**
- All navigation labels
- All form labels and placeholders
- All button text
- All error messages
- All success messages
- All authentication flow messages
- Update BOTH `en.json` AND `bg.json` simultaneously