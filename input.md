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
* **Guest:** Can view recipes, search by ingredients.
* **Registered User:** Can save favorites, manage their profile, use "My Pantry" features.
* **Admin:** Has all user rights + access to `/admin` routes.
    * *Implementation:* Role is stored in a public `profiles` table in Supabase, linked to `auth.users` via triggers.

## 4. Database Schema Requirements (Supabase Cloud)
**ACTION REQUIRED:** Please generate a `db_schema.sql` file that I can run in the Supabase SQL Editor. It must include the following tables and security policies:

### Tables
* **`profiles`**:
    * `id` (PK, references auth.users), `email`, `display_name`, `avatar_url`, `role` (text check: 'user' or 'admin').
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
    * Header with high-res photo.
    * Info chips (Time, Servings).
    * Ingredients list (with checkboxes for tracking while cooking).
    * Step-by-step instructions.
* **Smart Pantry:**
    * User inputs ingredients (e.g., "Eggs, Flour, Milk").
    * **Algorithm:** Query the database to find recipes containing these ingredients.
    * *Logic Hint:* `SELECT * FROM recipes WHERE id IN (SELECT recipe_id FROM recipe_ingredients WHERE ingredient_id IN (user_selected_ids))`.

### B. User Profile (Private)
* **My Profile:** Form to edit Name/Avatar.
* **Saved Recipes:** A grid list of bookmarked recipes.

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