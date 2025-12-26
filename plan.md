# Implementation Plan: CookSmart Recipe & Pantry Assistant

**Version:** 1.2  
**Date:** 2025-12-26  
**Methodology:** Spec Kit Phase 1 → Incremental Implementation  
**Estimated Duration:** 10-12 days (single developer)  
**Updated:** Added i18n (BG/EN), design system, and mobile-first responsive design

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
- [ ] **1.2.3** Create `_variables.scss` with color/font system and responsive breakpoints:
  ```scss
  // Responsive Breakpoints
  $breakpoint-mobile: 768px;
  $breakpoint-tablet: 1024px;
  
  // Colors, fonts, etc. (to be expanded in Milestone 1.5)
  ```
- [ ] **1.2.3b** Create `_mixins.scss` with mobile-first media query helpers:
  ```scss
  // Mobile-First Media Query Mixins
  @mixin tablet {
    @media (min-width: #{$breakpoint-mobile}) {
      @content;
    }
  }
  
  @mixin desktop {
    @media (min-width: #{$breakpoint-tablet}) {
      @content;
    }
  }
  
  // Usage example:
  // .container {
  //   width: 100%;           // Mobile (base)
  //   @include tablet {
  //     width: 90%;          // Tablet
  //   }
  //   @include desktop {
  //     max-width: 1200px;   // Desktop
  //   }
  // }
  ```
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
  npm install @ngx-translate/core @ngx-translate/http-loader
  ```

**Validation:** `ng build` succeeds without errors

**Commit:** `chore(setup): scaffold Angular project with folder structure`

---

### Milestone 1.4: Internationalization Setup (i18n)
**Duration:** 0.5 days  
**Goal:** Configure ngx-translate for Bulgarian/English language switching

#### Tasks
- [ ] **1.4.1** Configure `@ngx-translate/core` in `app.config.ts`:
  - Import `TranslateModule`, `TranslateLoader`, `TranslateHttpLoader`
  - Set default language to 'bg' (Bulgarian)
  - Set fallback language to 'en' (English)
  - Configure loader to read from `assets/i18n/{lang}.json`
- [ ] **1.4.2** Create translation directory structure:
  ```
  src/assets/i18n/
  ├── bg.json
  └── en.json
  ```
- [ ] **1.4.3** Create initial Bulgarian translation file (`bg.json`):
  ```json
  {
    "COMMON": {
      "HOME": "Начало",
      "MY_PANTRY": "Моят Килер",
      "LOGIN": "Вход",
      "LOGOUT": "Изход",
      "REGISTER": "Регистрация",
      "PROFILE": "Профил",
      "SEARCH": "Търсене",
      "SAVE": "Запази",
      "CANCEL": "Отказ",
      "DELETE": "Изтрий",
      "EDIT": "Редактирай"
    },
    "NAV": {
      "RECIPES": "Рецепти",
      "ADMIN": "Администрация"
    },
    "RECIPE": {
      "TITLE": "Заглавие",
      "DESCRIPTION": "Описание",
      "INGREDIENTS": "Съставки",
      "STEPS": "Стъпки",
      "PREP_TIME": "Време за приготвяне",
      "SERVINGS": "Порции",
      "DIFFICULTY": "Трудност",
      "EASY": "Лесна",
      "MEDIUM": "Средна",
      "HARD": "Трудна"
    },
    "AUTH": {
      "EMAIL": "Имейл",
      "PASSWORD": "Парола",
      "DISPLAY_NAME": "Име за показване",
      "LOGIN_TITLE": "Вход в системата",
      "REGISTER_TITLE": "Регистрация"
    },
    "ADMIN": {
      "DASHBOARD": "Табло",
      "MANAGE_RECIPES": "Управление на рецепти",
      "TOTAL_RECIPES": "Общо рецепти",
      "TOTAL_USERS": "Общо потребители"
    }
  }
  ```
- [ ] **1.4.4** Create initial English translation file (`en.json`):
  ```json
  {
    "COMMON": {
      "HOME": "Home",
      "MY_PANTRY": "My Pantry",
      "LOGIN": "Login",
      "LOGOUT": "Logout",
      "REGISTER": "Register",
      "PROFILE": "Profile",
      "SEARCH": "Search",
      "SAVE": "Save",
      "CANCEL": "Cancel",
      "DELETE": "Delete",
      "EDIT": "Edit"
    },
    "NAV": {
      "RECIPES": "Recipes",
      "ADMIN": "Administration"
    },
    "RECIPE": {
      "TITLE": "Title",
      "DESCRIPTION": "Description",
      "INGREDIENTS": "Ingredients",
      "STEPS": "Steps",
      "PREP_TIME": "Prep Time",
      "SERVINGS": "Servings",
      "DIFFICULTY": "Difficulty",
      "EASY": "Easy",
      "MEDIUM": "Medium",
      "HARD": "Hard"
    },
    "AUTH": {
      "EMAIL": "Email",
      "PASSWORD": "Password",
      "DISPLAY_NAME": "Display Name",
      "LOGIN_TITLE": "Login",
      "REGISTER_TITLE": "Register"
    },
    "ADMIN": {
      "DASHBOARD": "Dashboard",
      "MANAGE_RECIPES": "Manage Recipes",
      "TOTAL_RECIPES": "Total Recipes",
      "TOTAL_USERS": "Total Users"
    }
  }
  ```
- [ ] **1.4.5** Create `TranslateService` wrapper in `src/app/core/services/translate.service.ts`:
  - Method to switch language: `setLanguage(lang: 'bg' | 'en')`
  - Signal for current language: `currentLang$`
  - Store selected language in localStorage
  - Load saved language preference on app init
- [ ] **1.4.6** Test language switching:
  - Verify JSON files load correctly
  - Verify language persists after page reload
  - Verify all keys resolve properly

**Validation:**
- Translation files load without errors
- Language can be switched programmatically
- Default language is Bulgarian

**Commit:** `feat(i18n): setup ngx-translate with BG/EN translation files`

---

### Milestone 1.5: Design System & Animations Setup
**Duration:** 0.5 days  
**Goal:** Establish modern design system with Angular animations

#### Tasks
- [ ] **1.5.1** Import `BrowserAnimationsModule` in `app.config.ts`:
  ```typescript
  import { provideAnimations } from '@angular/platform-browser/animations';
  // Add to providers array
  ```
- [ ] **1.5.2** Enhance `_variables.scss` with modern design tokens:
  ```scss
  // Responsive Breakpoints (Mobile-First)
  $breakpoint-mobile: 768px;   // < 768px = Mobile (base styles)
  $breakpoint-tablet: 1024px;  // 768px - 1024px = Tablet
  // > 1024px = Desktop
  
  // Color Palette - Modern & Airy
  $primary-color: #6366f1;        // Indigo
  $primary-light: #818cf8;
  $primary-dark: #4f46e5;
  
  $secondary-color: #10b981;      // Emerald
  $accent-color: #f59e0b;         // Amber
  
  $background-light: #ffffff;
  $background-gray: #f9fafb;
  $surface: #ffffff;
  
  $text-primary: #111827;
  $text-secondary: #6b7280;
  $text-muted: #9ca3af;
  
  $border-color: #e5e7eb;
  $border-radius: 12px;           // Rounded corners
  $border-radius-sm: 8px;
  $border-radius-lg: 16px;
  
  // Shadows - Subtle & Premium
  $shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  $shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  $shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  $shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  // Spacing - Generous Whitespace
  $spacing-xs: 0.5rem;   // 8px
  $spacing-sm: 1rem;     // 16px
  $spacing-md: 1.5rem;   // 24px
  $spacing-lg: 2rem;     // 32px
  $spacing-xl: 3rem;     // 48px
  $spacing-2xl: 4rem;    // 64px
  
  // Typography
  $font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  $font-size-base: 16px;
  $font-weight-normal: 400;
  $font-weight-medium: 500;
  $font-weight-semibold: 600;
  $font-weight-bold: 700;
  
  // Transitions
  $transition-fast: 150ms ease-in-out;
  $transition-base: 250ms ease-in-out;
  $transition-slow: 350ms ease-in-out;
  
  // Container Max Width
  $container-max-width: 1200px;
  ```
- [ ] **1.5.3** Create reusable animation definitions in `src/app/shared/animations/`:
  - `fade.animation.ts` - Fade in/out for route transitions
  - `slide.animation.ts` - Slide in from bottom for lists
  - `scale.animation.ts` - Scale up for modals/dialogs
- [ ] **1.5.4** Create `fade.animation.ts`:
  ```typescript
  import { trigger, transition, style, animate } from '@angular/animations';
  
  export const fadeInOut = trigger('fadeInOut', [
    transition(':enter', [
      style({ opacity: 0 }),
      animate('250ms ease-in-out', style({ opacity: 1 }))
    ]),
    transition(':leave', [
      animate('250ms ease-in-out', style({ opacity: 0 }))
    ])
  ]);
  
  export const fadeIn = trigger('fadeIn', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(10px)' }),
      animate('350ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]);
  ```
- [ ] **1.5.5** Create `slide.animation.ts`:
  ```typescript
  import { trigger, transition, style, animate, query, stagger } from '@angular/animations';
  
  export const slideInUp = trigger('slideInUp', [
    transition(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
    ])
  ]);
  
  export const staggerList = trigger('staggerList', [
    transition('* => *', [
      query(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        stagger('50ms', [
          animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
        ])
      ], { optional: true })
    ])
  ]);
  ```
- [ ] **1.5.6** Create global styles in `src/styles.scss` with mobile-first approach:
  ```scss
  @import 'variables';
  @import 'mixins';
  
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: $font-family;
    font-size: $font-size-base;
    color: $text-primary;
    background-color: $background-gray;
    line-height: 1.6;
  }
  
  // Responsive Container
  .container {
    width: 100%;
    padding: 0 $spacing-md;
    margin: 0 auto;
    
    @include tablet {
      padding: 0 $spacing-lg;
    }
    
    @include desktop {
      max-width: $container-max-width;
    }
  }
  
  // Premium hover effects
  .card {
    background: $surface;
    border-radius: $border-radius;
    box-shadow: $shadow-sm;
    transition: all $transition-base;
    
    &:hover {
      box-shadow: $shadow-lg;
      transform: translateY(-2px);
    }
  }
  
  .btn {
    border-radius: $border-radius-sm;
    padding: $spacing-sm $spacing-md;
    font-weight: $font-weight-medium;
    transition: all $transition-fast;
    border: none;
    cursor: pointer;
    
    &:hover {
      transform: translateY(-1px);
      box-shadow: $shadow-md;
    }
    
    &:active {
      transform: translateY(0);
    }
  }
  ```
- [ ] **1.5.7** Add Google Fonts (Inter) to `index.html`:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  ```

**Validation:**
- Animations module imported without errors
- Design tokens accessible in all SCSS files
- Animation triggers compile successfully
- Google Fonts load correctly

**Commit 1:** `style(design): create modern design system with variables`  
**Commit 2:** `feat(animations): setup Angular animations with reusable triggers`

---

### Milestone 1.6: Core Models & Interfaces
**Duration:** 0.5 days  
**Goal:** TypeScript interfaces for all domain entities

#### Tasks
- [ ] **1.6.1** Create `src/app/core/models/profile.model.ts`
  ```typescript
  export interface Profile {
    id: string;
    email: string;
    display_name: string | null;
    avatar_url: string | null;
    role: 'user' | 'admin';
  }
  ```
- [ ] **1.6.2** Create `src/app/core/models/recipe.model.ts`
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
- [ ] **1.6.3** Create `src/app/core/models/ingredient.model.ts`
- [ ] **1.6.4** Create `src/app/core/models/recipe-ingredient.model.ts`
- [ ] **1.6.5** Create barrel export `src/app/core/models/index.ts`

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
**Duration:** 1.5 days  
**Goal:** Main and Admin layouts with navigation and language switcher

#### Tasks
- [ ] **2.2.1** Create `LanguageSwitcherComponent` (shared):
  - Dropdown with BG/EN flags/labels
  - Calls `TranslateService.setLanguage()`
  - Shows current language with visual indicator
  - Styled with premium hover effects
  - Responsive: Compact on mobile, full labels on desktop
- [ ] **2.2.2** Create `MainLayoutComponent` with responsive navbar:
  - **Mobile (< 768px):**
    - Logo on left, hamburger menu icon on right
    - Language switcher and user menu in collapsed menu
    - Full-width search bar below header (optional)
  - **Tablet/Desktop (≥ 768px):**
    - Horizontal navbar with logo, links (Home, My Pantry), search bar, language switcher, user menu
    - All navigation labels use `translate` pipe
  - Router outlet with fade animation
  - Footer with translated content (stacked on mobile, horizontal on desktop)
- [ ] **2.2.3** Create `AdminLayoutComponent` with:
  - Sidebar (Dashboard, Manage Recipes, Logout) - all translated
  - Language switcher in top bar
  - Router outlet for admin content
- [ ] **2.2.4** Style both layouts with mobile-first SCSS:
  - **Mobile base styles:** Compact spacing, stacked elements, hamburger menu
  - **Tablet (@include tablet):** 2-column grids where applicable
  - **Desktop (@include desktop):** Max-width container, horizontal menus, 3-4 column grids
  - Apply generous whitespace ($spacing-lg, $spacing-xl)
  - Use subtle shadows ($shadow-md)
  - Rounded corners ($border-radius)
  - Smooth transitions on hover states and menu animations
- [ ] **2.2.5** Configure routes with animations:
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
- Layouts render correctly with modern design
- **Mobile:** Hamburger menu toggles, 1-column layout
- **Tablet:** 2-column grids, horizontal nav
- **Desktop:** Max-width container, full navigation
- Navigation works with translations
- Language switcher changes UI language instantly
- Route transitions animate smoothly
- Guards block unauthorized access

**Commit 1:** `feat(i18n): create language switcher component`  
**Commit 2:** `feat(layout): create main and admin layouts with translations`  
**Commit 3:** `style(layout): apply modern design system to layouts`

---

## Phase 3: Public Features

### Milestone 3.1: Recipe List & Detail Pages
**Duration:** 2.5 days  
**Goal:** Users can browse and view recipes with modern UI and animations

#### Tasks
- [ ] **3.1.1** Create `RecipeService` with methods:
  - `getRecipes(filters?: { difficulty?, prepTime? })`
  - `getRecipeBySlug(slug: string)`
  - `searchByIngredients(ingredientIds: string[])`
- [ ] **3.1.2** Create `RecipeListComponent` with responsive grid:
  - **Mobile:** 1 card per row (100% width)
  - **Tablet:** 2 cards per row (CSS Grid: `grid-template-columns: repeat(2, 1fr)`)
  - **Desktop:** 3-4 cards per row (CSS Grid: `repeat(auto-fill, minmax(280px, 1fr))`)
  - Filter dropdowns (difficulty, prep time) - all translated
  - Filters stack vertically on mobile, horizontal on desktop
  - Use Angular Signals for state
  - Apply `staggerList` animation to recipe grid
  - Add loading skeleton with fade animation
- [ ] **3.1.3** Create `RecipeCardComponent` (shared) with responsive design:
  - Display thumbnail, title, difficulty chip, prep time
  - Premium card styling (shadow, rounded corners, hover lift effect)
  - **Mobile:** Full-width card, larger touch targets
  - **Desktop:** Fixed aspect ratio, hover effects
  - Click navigates to detail page
  - Apply `fadeIn` animation on load
  - All labels translated (difficulty, time units)
- [ ] **3.1.4** Create `RecipeDetailComponent` with responsive layout:
  - Hero image with subtle overlay (full-width on mobile, contained on desktop)
  - **Mobile:** Stacked layout (image → metadata → ingredients → steps)
  - **Desktop:** 2-column layout (ingredients sidebar, steps main column)
  - Metadata chips (time, servings, difficulty) - translated
  - Ingredients list with animated checkboxes
  - Steps list with numbered badges
  - "Save to Favorites" button with icon (if authenticated) - translated
  - Apply `fadeIn` animation to sections
- [ ] **3.1.5** Style all components with modern design system:
  - Ample whitespace between sections
  - Subtle shadows on cards
  - Smooth transitions on interactive elements
  - Rounded corners on all containers
  - Premium hover effects

**Validation:**
- Recipe list loads from Supabase with stagger animation
- **Mobile:** 1 card per row, stacked filters, hamburger menu works
- **Tablet:** 2 cards per row, horizontal filters
- **Desktop:** 3-4 cards per row, full navigation
- Filters work correctly with translated labels
- Detail page displays all recipe data with animations
- Routing via slug works
- UI feels premium and airy on all screen sizes
- All text displays in selected language
- Touch targets are adequate on mobile (min 44px)

**Commit 1:** `feat(recipes): implement recipe list with filters and animations`  
**Commit 2:** `feat(recipes): implement recipe detail page with modern design`  
**Commit 3:** `style(recipes): apply premium design system to recipe components`

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

### Milestone 5.2: Responsive Design Testing & Accessibility
**Duration:** 1 day  
**Goal:** Verify mobile-first responsive design and accessibility

#### Tasks
- [ ] **5.2.1** Test all pages on multiple viewports:
  - Mobile (375px, 414px - iPhone sizes)
  - Tablet (768px, 1024px - iPad sizes)
  - Desktop (1280px, 1920px)
- [ ] **5.2.2** Verify responsive breakpoints work correctly:
  - Hamburger menu appears/disappears at correct breakpoint
  - Grid columns adjust (1 → 2 → 3-4)
  - Text sizes and spacing scale appropriately
- [ ] **5.2.3** Test touch interactions on mobile:
  - Buttons have min 44px touch targets
  - Swipe gestures work (if applicable)
  - No hover-only interactions
- [ ] **5.2.4** Ensure forms have proper labels and ARIA attributes
- [ ] **5.2.5** Test keyboard navigation
- [ ] **5.2.6** Add focus styles (visible focus indicators)
- [ ] **5.2.7** Test with browser DevTools responsive mode and real devices

**Validation:**
- App usable on mobile (320px - 768px width)
- Tablet layout works (768px - 1024px)
- Desktop layout works (> 1024px)
- No horizontal scroll on any viewport
- Forms accessible via keyboard
- Screen reader compatible (basic)
- Touch targets meet accessibility standards (44px min)

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
