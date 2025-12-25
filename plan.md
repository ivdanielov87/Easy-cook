# Implementation Plan: CookSmart Recipe & Pantry Assistant

**Version:** 1.0  
**Date:** 2025-12-25  
**Methodology:** Spec Kit Phase 1 → Incremental Implementation  
**Estimated Duration:** 8-10 days (single developer)

---

## Overview

This plan breaks down the CookSmart application into discrete, testable milestones. Each milestone produces a working, committable increment. The sequence prioritizes infrastructure → core features → admin features → polish.

**Key Principles:**
- One logical task = one commit
- Verify compilation before committing
- Test RLS policies with non-admin accounts
- Follow commit message format: `feat(scope): description`

---

## Phase 1: Foundation & Database Setup

### Milestone 1.1: Database Schema Deployment
**Duration:** 1 day  
**Goal:** Supabase database fully configured with tables, RLS policies, and triggers

#### Tasks
- [ ] **1.1.1** Execute `db_schema.sql` in Supabase SQL Editor
- [ ] **1.1.2** Verify all tables created: `profiles`, `recipes`, `ingredients`, `recipe_ingredients`, `saved_recipes`
- [ ] **1.1.3** Verify trigger creates profile on user registration
- [ ] **1.1.4** Test RLS policies:
  - Guest can read recipes (no auth)
  - User cannot insert recipe (should fail)
  - Manually promote test user to admin role
  - Admin can insert/update/delete recipes
- [ ] **1.1.5** Create Supabase Storage bucket `recipes` with public read access

**Validation:**
```sql
-- Test queries
SELECT * FROM profiles;
SELECT * FROM recipes;
-- Attempt insert as non-admin (should fail)
INSERT INTO recipes (title, slug) VALUES ('Test', 'test');
```

**Commit:** `chore(db): deploy initial database schema with RLS policies`

---

### Milestone 1.2: Angular Project Scaffolding
**Duration:** 1 day  
**Goal:** Angular project with correct folder structure and routing skeleton

#### Tasks
- [ ] **1.2.1** Create new Angular project with standalone components
  ```bash
  ng new cooksmart --standalone --routing --style=scss --strict
  ```
- [ ] **1.2.2** Create folder structure:
  ```
  src/app/
  ├── core/
  │   ├── models/
  │   ├── services/
  │   ├── guards/
  │   └── interceptors/
  ├── layout/
  │   ├── main-layout/
  │   └── admin-layout/
  ├── features/
  │   ├── public/
  │   │   ├── home/
  │   │   ├── recipe-list/
  │   │   └── recipe-detail/
  │   ├── profile/
  │   └── admin/
  │       ├── dashboard/
  │       └── recipe-management/
  └── shared/
      ├── components/
      ├── pipes/
      └── directives/
  ```
- [ ] **1.2.3** Create `_variables.scss` with color/font system
- [ ] **1.2.4** Configure `angular.json` to include global styles
- [ ] **1.2.5** Create environment files with Supabase placeholders
  ```typescript
  export const environment = {
    production: false,
    supabaseUrl: 'YOUR_SUPABASE_URL',
    supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
  };
  ```
- [ ] **1.2.6** Install dependencies:
  ```bash
  npm install @supabase/supabase-js
  npm install @angular/material (optional)
  ```

**Validation:** `ng build` succeeds without errors

**Commit:** `chore(setup): scaffold Angular project with folder structure`

---

### Milestone 1.3: Core Models & Interfaces
**Duration:** 0.5 days  
**Goal:** TypeScript interfaces for all domain entities

#### Tasks
- [ ] **1.3.1** Create `src/app/core/models/profile.model.ts`
  ```typescript
  export interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
  }
  ```
- [ ] **1.3.2** Create `src/app/core/models/recipe.model.ts`
  ```typescript
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
    steps?: string[]; // JSON array
  }
  ```
- [ ] **1.3.3** Create `src/app/core/models/ingredient.model.ts`
- [ ] **1.3.4** Create `src/app/core/models/recipe-ingredient.model.ts`
- [ ] **1.3.5** Create barrel export `src/app/core/models/index.ts`

**Validation:** No TypeScript errors, models importable

**Commit:** `feat(models): define core domain interfaces`

---

## Phase 2: Authentication & Core Services

### Milestone 2.1: Supabase Service & Auth
**Duration:** 1 day  
**Goal:** Working authentication with session management

#### Tasks
- [ ] **2.1.1** Create `src/app/core/services/supabase.service.ts`
  - Initialize Supabase client
  - Expose `auth`, `from()`, `storage` methods
- [ ] **2.1.2** Create `src/app/core/services/auth.service.ts`
  - `signUp(email, password)`
  - `signIn(email, password)`
  - `signOut()`
  - `currentUser$` signal/observable
  - `isAdmin$` signal (checks profile.role)
- [ ] **2.1.3** Create `AuthGuard` (redirects to login if not authenticated)
- [ ] **2.1.4** Create `AdminGuard` (checks `isAdmin$`, redirects to home)
- [ ] **2.1.5** Test auth flow:
  - Register new user
  - Verify profile created in DB
  - Login and check session persists on reload

**Validation:**
- User can register and login
- Profile row created automatically
- Session persists after page refresh

**Commit:** `feat(auth): implement Supabase authentication service`

---

### Milestone 2.2: Layout Components
**Duration:** 1 day  
**Goal:** Main and Admin layouts with navigation

#### Tasks
- [ ] **2.2.1** Create `MainLayoutComponent` with:
  - Navbar (logo, search bar, Home/My Pantry links, user menu)
  - Router outlet
  - Footer
- [ ] **2.2.2** Create `AdminLayoutComponent` with:
  - Sidebar (Dashboard, Manage Recipes, Logout)
  - Router outlet for admin content
- [ ] **2.2.3** Style both layouts with SCSS using variables
- [ ] **2.2.4** Configure routes:
  ```typescript
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'recipes', component: RecipeListComponent },
      { path: 'recipes/:slug', component: RecipeDetailComponent },
      { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'recipes', component: AdminRecipeListComponent }
    ]
  }
  ```

**Validation:**
- Layouts render correctly
- Navigation works
- Guards block unauthorized access

**Commit:** `feat(layout): create main and admin layout components`

---

## Phase 3: Public Features

### Milestone 3.1: Recipe List & Detail Pages
**Duration:** 2 days  
**Goal:** Users can browse and view recipes

#### Tasks
- [ ] **3.1.1** Create `RecipeService` with methods:
  - `getRecipes(filters?: { difficulty?, prepTime? })`
  - `getRecipeBySlug(slug: string)`
  - `searchByIngredients(ingredientIds: string[])`
- [ ] **3.1.2** Create `RecipeListComponent`:
  - Grid layout with recipe cards
  - Filter dropdowns (difficulty, prep time)
  - Use Angular Signals for state
- [ ] **3.1.3** Create `RecipeCardComponent` (shared):
  - Display thumbnail, title, difficulty chip, prep time
  - Click navigates to detail page
- [ ] **3.1.4** Create `RecipeDetailComponent`:
  - Hero image
  - Metadata chips (time, servings, difficulty)
  - Ingredients list with checkboxes
  - Steps list
  - "Save to Favorites" button (if authenticated)
- [ ] **3.1.5** Style all components with SCSS

**Validation:**
- Recipe list loads from Supabase
- Filters work correctly
- Detail page displays all recipe data
- Routing via slug works

**Commit 1:** `feat(recipes): implement recipe list with filters`  
**Commit 2:** `feat(recipes): implement recipe detail page`

---

### Milestone 3.2: Smart Pantry Search
**Duration:** 1 day  
**Goal:** Ingredient-based recipe search

#### Tasks
- [ ] **3.2.1** Create `IngredientService`:
  - `getAllIngredients()` (for autocomplete)
  - `searchRecipesByIngredients(ingredientIds: string[])`
- [ ] **3.2.2** Create `PantrySearchComponent`:
  - Multi-select ingredient input (autocomplete)
  - "Find Recipes" button
  - Results grid (reuse `RecipeCardComponent`)
  - Display match count per recipe
- [ ] **3.2.3** Implement search query:
  ```sql
  SELECT r.*, COUNT(ri.ingredient_id) as match_count
  FROM recipes r
  JOIN recipe_ingredients ri ON r.id = ri.recipe_id
  WHERE ri.ingredient_id IN (selected_ids)
  GROUP BY r.id
  ORDER BY match_count DESC
  ```
- [ ] **3.2.4** Add route to main layout

**Validation:**
- User can select multiple ingredients
- Results show recipes with at least one matching ingredient
- Results sorted by match count

**Commit:** `feat(pantry): implement ingredient-based recipe search`

---

### Milestone 3.3: User Profile & Favorites
**Duration:** 1 day  
**Goal:** Users can manage profile and save recipes

#### Tasks
- [ ] **3.3.1** Create `ProfileService`:
  - `updateProfile(displayName, avatarFile?)`
  - `uploadAvatar(file)` (to Supabase Storage)
- [ ] **3.3.2** Create `SavedRecipesService`:
  - `saveRecipe(recipeId)`
  - `unsaveRecipe(recipeId)`
  - `getSavedRecipes()`
  - `isRecipeSaved(recipeId)` signal
- [ ] **3.3.3** Create `ProfileComponent`:
  - Form to edit display name
  - Avatar upload with preview
  - "My Saved Recipes" section (grid)
- [ ] **3.3.4** Add save/unsave button to `RecipeDetailComponent`
- [ ] **3.3.5** Test RLS: User can only CRUD their own saved_recipes

**Validation:**
- User can update profile
- Avatar uploads to Storage and URL saved to DB
- User can save/unsave recipes
- Saved recipes persist across sessions

**Commit 1:** `feat(profile): implement profile editing with avatar upload`  
**Commit 2:** `feat(favorites): implement save/unsave recipe functionality`

---

## Phase 4: Admin Panel

### Milestone 4.1: Admin Dashboard
**Duration:** 0.5 days  
**Goal:** Admin sees usage statistics

#### Tasks
- [ ] **4.1.1** Create `AdminService`:
  - `getStats()` → `{ totalRecipes, totalUsers }`
- [ ] **4.1.2** Create `AdminDashboardComponent`:
  - Stats cards (total recipes, total users)
  - Quick links to recipe management
- [ ] **4.1.3** Style dashboard with SCSS

**Validation:**
- Admin can access `/admin/dashboard`
- Stats display correctly
- Non-admin redirected to home

**Commit:** `feat(admin): implement admin dashboard with stats`

---

### Milestone 4.2: Recipe CRUD (Part 1: List & Delete)
**Duration:** 1 day  
**Goal:** Admin can view and delete recipes

#### Tasks
- [ ] **4.2.1** Create `AdminRecipeListComponent`:
  - Data table with columns: Title, Difficulty, Prep Time, Actions
  - Edit and Delete buttons per row
  - "Create New Recipe" button
- [ ] **4.2.2** Implement delete functionality:
  - Confirmation dialog
  - Call `RecipeService.deleteRecipe(id)`
  - Refresh list after delete
- [ ] **4.2.3** Test RLS: Non-admin cannot delete via API

**Validation:**
- Admin sees all recipes in table
- Delete works with confirmation
- RLS prevents non-admin delete

**Commit:** `feat(admin): implement recipe list and delete functionality`

---

### Milestone 4.3: Recipe CRUD (Part 2: Create & Edit Form)
**Duration:** 2 days  
**Goal:** Admin can create and edit recipes with ingredients

#### Tasks
- [ ] **4.3.1** Create `AdminRecipeFormComponent`:
  - Reactive form with fields: title, description, difficulty, prep_time, servings
  - Image upload zone (drag & drop or file picker)
  - Dynamic ingredients array (add/remove rows with ingredient, quantity, unit)
  - Dynamic steps array (add/remove text inputs)
- [ ] **4.3.2** Implement image upload:
  - Upload to Supabase Storage bucket `recipes`
  - Generate unique filename (e.g., `${recipeId}_${timestamp}.jpg`)
  - Save public URL to recipe.image_url
- [ ] **4.3.3** Implement slug generation:
  - Auto-generate from title (lowercase, hyphens, unique)
  - Allow manual override
- [ ] **4.3.4** Implement create/update logic:
  - Insert recipe row
  - Insert/update recipe_ingredients (delete old, insert new)
  - Handle steps as JSON array
- [ ] **4.3.5** Add routing:
  - `/admin/recipes/new` → create mode
  - `/admin/recipes/:id/edit` → edit mode
- [ ] **4.3.6** Test RLS: Non-admin cannot create/update via API

**Validation:**
- Admin can create recipe with image and ingredients
- Admin can edit existing recipe
- Image uploads successfully
- Ingredients saved correctly
- RLS enforced

**Commit 1:** `feat(admin): implement recipe create/edit form structure`  
**Commit 2:** `feat(admin): implement image upload to Supabase Storage`  
**Commit 3:** `feat(admin): implement ingredient and steps management`

---

## Phase 5: Polish & Testing

### Milestone 5.1: Error Handling & Loading States
**Duration:** 1 day  
**Goal:** Graceful error handling and UX improvements

#### Tasks
- [ ] **5.1.1** Create `ErrorService` for centralized error handling
- [ ] **5.1.2** Add loading spinners to all async operations
- [ ] **5.1.3** Add error messages for failed operations (toast/snackbar)
- [ ] **5.1.4** Add empty states (no recipes, no saved recipes)
- [ ] **5.1.5** Add form validation messages

**Validation:**
- Errors display user-friendly messages
- Loading states visible during API calls
- Empty states guide user actions

**Commit:** `feat(ux): add error handling and loading states`

---

### Milestone 5.2: Responsive Design & Accessibility
**Duration:** 1 day  
**Goal:** Mobile-friendly and accessible

#### Tasks
- [ ] **5.2.1** Test all pages on mobile viewport
- [ ] **5.2.2** Add responsive breakpoints in SCSS
- [ ] **5.2.3** Ensure forms have proper labels and ARIA attributes
- [ ] **5.2.4** Test keyboard navigation
- [ ] **5.2.5** Add focus styles

**Validation:**
- App usable on mobile (320px width)
- Forms accessible via keyboard
- Screen reader compatible (basic)

**Commit:** `style(responsive): implement mobile-friendly layouts`

---

### Milestone 5.3: Final Testing & Documentation
**Duration:** 1 day  
**Goal:** Production-ready application

#### Tasks
- [ ] **5.3.1** Manual testing checklist:
  - [ ] Guest can browse recipes
  - [ ] User can register, login, logout
  - [ ] User can save recipes
  - [ ] User can search by ingredients
  - [ ] Admin can CRUD recipes
  - [ ] RLS policies enforced
- [ ] **5.3.2** Update README.md with:
  - Setup instructions
  - Environment variable configuration
  - Database deployment steps
  - Development server commands
- [ ] **5.3.3** Create `.env.example` file
- [ ] **5.3.4** Final build test: `ng build --configuration production`

**Validation:**
- All features working end-to-end
- Documentation complete
- Production build succeeds

**Commit:** `docs(readme): add setup and deployment instructions`

---

## Risk Mitigation Strategies

### Risk: RLS Policy Misconfiguration
**Mitigation:**
- Test each policy with Supabase API directly (bypass Angular)
- Create test accounts for each role
- Peer review `db_schema.sql` before deployment

### Risk: Image Upload Failures
**Mitigation:**
- Client-side validation (file size < 5MB, types: jpg/png/webp)
- Display clear error messages
- Fallback to placeholder image if upload fails

### Risk: Ingredient Search Performance
**Mitigation:**
- Add indexes on `recipe_ingredients(ingredient_id, recipe_id)`
- Limit search to 10 ingredients max
- Consider pagination if result set > 50 recipes

### Risk: Angular Signals Learning Curve
**Mitigation:**
- Start with simple signals (primitive values)
- Use computed signals for derived state
- Fallback to RxJS BehaviorSubject if team struggles

---

## Dependencies & Blockers

### External Dependencies
- Supabase Cloud account active
- Storage bucket `recipes` configured
- At least one admin user promoted manually

### Internal Dependencies
- Database schema must be deployed before any API calls
- Auth service must be complete before protected routes
- Recipe service must be complete before admin CRUD

### Potential Blockers
- Supabase free tier limits (monitor usage)
- Angular Material setup (optional, can use custom SCSS)
- Image optimization (manual process for MVP)

---

## Success Metrics

### Technical Metrics
- Zero TypeScript `any` types
- All routes protected by guards
- All admin operations protected by RLS
- Build completes without warnings
- No console errors in production build

### Functional Metrics
- Guest can find recipe in < 2 minutes
- User can save recipe in < 3 clicks
- Admin can add recipe with 5 ingredients in < 5 minutes

---

## Post-MVP Enhancements (Phase 2)

### High Priority
- Recipe ratings and reviews
- Advanced search (full-text, filters)
- Meal planning calendar
- Grocery list generation

### Medium Priority
- Social sharing
- Recipe collections/categories
- Nutritional information
- Recipe import from URL

### Low Priority
- Multi-language support
- Mobile native apps
- Video instructions
- AI-powered recommendations

---

## Commit Strategy Summary

**Commit After Each:**
- Database schema deployment
- Project scaffolding
- Model definitions
- Service implementation
- Component implementation (one feature per commit)
- Major bug fix
- Style/responsive updates

**Commit Message Format:**
- `feat(scope): description` - New feature
- `fix(scope): description` - Bug fix
- `style(scope): description` - CSS/SCSS changes
- `refactor(scope): description` - Code restructuring
- `chore(scope): description` - Build/config changes
- `docs(scope): description` - Documentation

**Example Commits:**
```
feat(auth): implement Supabase authentication service
feat(recipes): add recipe list with filters
fix(admin): correct RLS policy for recipe deletion
style(layout): improve mobile navigation menu
chore(db): deploy initial database schema
docs(readme): add Supabase setup instructions
```

---

**Next Action:** Execute Milestone 1.1 - Deploy `db_schema.sql` to Supabase
