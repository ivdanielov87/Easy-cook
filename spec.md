# Technical Specification: CookSmart Recipe & Pantry Assistant

**Version:** 1.1  
**Date:** 2025-12-28  
**Status:** Phase 2 - Active Development

---

## 1. Problem Statement

Home cooks struggle to decide what to prepare with ingredients they already have, leading to food waste and repetitive meal choices. Existing recipe platforms focus on browsing by cuisine or meal type rather than matching available pantry items. CookSmart solves this by enabling ingredient-based recipe discovery while providing a curated content management system for administrators.

---

## 2. Users & Personas

### Primary Users

**Guest User**
- **Goals:** Browse recipes, search by ingredients without registration
- **Pain Points:** Cannot save favorites or manage pantry lists
- **Success Metric:** Time to find a matching recipe < 2 minutes

**Registered User**
- **Goals:** Save favorite recipes, maintain a persistent pantry list, personalize profile
- **Pain Points:** Needs quick access to saved content across sessions
- **Success Metric:** 80% of users save at least 3 recipes within first week

**Administrator**
- **Goals:** Manage recipe catalog, moderate content, view usage statistics
- **Pain Points:** Needs efficient bulk operations and image management
- **Success Metric:** Add/edit recipe in < 5 minutes including image upload

---

## 3. Scope & Boundaries

### In Scope (MVP)

#### Public Features
- Recipe browsing with grid/list views
- Ingredient-based smart search ("What can I cook now?")
- Recipe detail pages with ingredients, instructions, metadata
- Filter recipes by prep time, difficulty, servings
- Responsive design (mobile-first)

#### Authenticated User Features
- User registration and login (email/password via Supabase Auth)
- Google OAuth authentication for easy sign-in
- Email confirmation flow with user messaging
- Profile management (display name, avatar upload)
- Profile automatically created on registration via database trigger
- Save/unsave recipes (favorites)
- View saved recipes in profile page
- Personal pantry ingredient list
- Authentication guard for recipe detail pages

#### Admin Features
- Protected admin panel (`/admin` routes)
- Recipe CRUD operations
- Image upload to Supabase Storage
- Dynamic ingredient management per recipe
- User statistics dashboard (total users, total recipes)

#### Technical Requirements
- Angular standalone components with Signals
- Supabase Cloud (PostgreSQL, Auth, Storage)
- SCSS with design system variables
- Row Level Security (RLS) policies
- Lazy-loaded feature modules
- AuthGuard and AdminGuard route protection

### Out of Scope (Future Phases)

- Social features (comments, ratings, sharing)
- Meal planning calendar
- Grocery list generation
- Nutritional information
- Recipe recommendations via ML
- Mobile native apps
- Third-party recipe imports
- Video instructions

### Recently Completed (Phase 2)

- ✅ Multi-language support (Bulgarian/English with ngx-translate)
- ✅ Google OAuth authentication
- ✅ Email confirmation messaging
- ✅ Profile creation trigger with display_name support
- ✅ Saved recipes functionality
- ✅ Authentication guard for recipe details
- ✅ Modern design system with animations
- ✅ Mobile-first responsive design

---

## 4. Functional Requirements

### FR-1: Authentication & Authorization
- **FR-1.1:** ✅ Users can register with email/password
- **FR-1.2:** ✅ Users can log in and maintain session
- **FR-1.3:** ✅ System distinguishes between 'user' and 'admin' roles
- **FR-1.4:** ✅ Admin routes protected by both Angular guard and database RLS
- **FR-1.5:** ✅ Profile created automatically on user registration via trigger (includes display_name)
- **FR-1.6:** ✅ Google OAuth sign-in available on login and register pages
- **FR-1.7:** ✅ Email confirmation required with proper user messaging
- **FR-1.8:** ✅ Email not confirmed error handling on login

### FR-2: Recipe Discovery
- **FR-2.1:** ✅ Display recipes in grid layout with thumbnail, title, difficulty, prep time
- **FR-2.2:** ✅ Filter recipes by difficulty (Easy/Medium/Hard)
- **FR-2.3:** ✅ Filter recipes by prep time ranges (< 15min, 15-30min, 30-60min, > 60min)
- **FR-2.4:** ✅ Search recipes by title/description (text search)
- **FR-2.5:** ✅ Recipe detail page shows full ingredients list, instructions, metadata
- **FR-2.6:** ✅ Recipe detail page requires authentication (login prompt for guests)

### FR-3: Smart Pantry Search
- **FR-3.1:** User inputs multiple ingredients (comma-separated or multi-select)
- **FR-3.2:** System queries recipes containing ANY of the selected ingredients
- **FR-3.3:** Results ranked by number of matching ingredients (descending)
- **FR-3.4:** Display match percentage or ingredient overlap indicator

### FR-4: User Profile & Favorites
- **FR-4.1:** ✅ User can update display name and avatar
- **FR-4.2:** ✅ User can save recipes to favorites
- **FR-4.3:** ✅ User can view all saved recipes in profile page
- **FR-4.4:** ✅ User can remove recipes from favorites
- **FR-4.5:** ✅ Saved recipes displayed in grid layout on profile page

### FR-5: Admin Recipe Management
- **FR-5.1:** Admin can create new recipe with title, description, difficulty, prep time, servings
- **FR-5.2:** Admin can upload recipe image to Supabase Storage bucket 'recipes'
- **FR-5.3:** Admin can add/remove ingredients with quantity and unit
- **FR-5.4:** Admin can add/edit/reorder cooking steps
- **FR-5.5:** Admin can edit existing recipes
- **FR-5.6:** Admin can delete recipes (cascade delete related data)
- **FR-5.7:** Admin dashboard displays total recipes and total users

### FR-6: Data Integrity
- **FR-6.1:** Recipe slugs must be unique and URL-safe
- **FR-6.2:** Ingredient names must be unique (case-insensitive)
- **FR-6.3:** User roles restricted to 'user' or 'admin' via CHECK constraint
- **FR-6.4:** Cascade delete recipe_ingredients when recipe deleted
- **FR-6.5:** Cascade delete saved_recipes when user or recipe deleted

---

## 5. Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1:** Recipe list page loads in < 2 seconds
- **NFR-1.2:** Image uploads complete in < 5 seconds for files < 5MB
- **NFR-1.3:** Search results return in < 1 second for up to 10 ingredients

### NFR-2: Security
- **NFR-2.1:** All admin operations validated by RLS policies (not just UI guards)
- **NFR-2.2:** User passwords hashed by Supabase Auth
- **NFR-2.3:** Storage bucket 'recipes' configured for public read, admin-only write
- **NFR-2.4:** No sensitive data in client-side code or localStorage

### NFR-3: Code Quality
- **NFR-3.1:** Strict TypeScript (no `any` types)
- **NFR-3.2:** All data models defined as interfaces in `src/app/core/models`
- **NFR-3.3:** Component-scoped SCSS with ViewEncapsulation
- **NFR-3.4:** Separation of concerns (services for logic, components for UI)
- **NFR-3.5:** Error handling with user-friendly messages

### NFR-4: Maintainability
- **NFR-4.1:** Lazy loading for admin, profile, and recipe feature modules
- **NFR-4.2:** Shared components, pipes, directives in `src/app/shared`
- **NFR-4.3:** SCSS variables for colors, fonts, spacing in `_variables.scss`
- **NFR-4.4:** Conventional commit messages (`feat(scope):`, `fix(scope):`)

### NFR-5: Usability
- **NFR-5.1:** Responsive design (mobile, tablet, desktop breakpoints)
- **NFR-5.2:** Accessible forms with labels and ARIA attributes
- **NFR-5.3:** Loading states for async operations
- **NFR-5.4:** Confirmation dialogs for destructive actions (delete recipe)

---

## 6. Data Model Summary

### Core Entities

**Profile**
- Links to Supabase auth.users
- Stores role, display_name, avatar_url
- Public read, self-update

**Recipe**
- Core content entity
- Authored by admin users
- Contains metadata (difficulty, prep_time, servings)
- Unique slug for URL routing

**Ingredient**
- Master list of ingredient names
- Normalized to avoid duplicates

**RecipeIngredient** (Junction)
- Links Recipe ↔ Ingredient
- Stores quantity and unit

**SavedRecipe** (Junction)
- Links User ↔ Recipe
- Tracks user favorites

### Relationships
- Profile 1:N Recipe (author)
- Recipe N:M Ingredient (via recipe_ingredients)
- Profile N:M Recipe (via saved_recipes)

---

## 7. Assumptions & Constraints

### Assumptions
- **A-1:** Supabase Cloud free tier sufficient for MVP (< 500MB storage, < 50k rows)
- **A-2:** Admin users manually promoted via SQL (no self-service admin registration)
- **A-3:** Recipe instructions stored as JSON array of step strings
- **A-4:** Single language (English) for MVP
- **A-5:** Images optimized before upload (client-side or manual)
- **A-6:** Ingredient matching is case-insensitive and exact (no fuzzy matching)

### Constraints
- **C-1:** Must use Angular standalone components (no NgModules)
- **C-2:** Must use Angular Signals for state management
- **C-3:** RxJS only for HTTP requests and complex async flows
- **C-4:** No third-party UI libraries except Angular Material (optional)
- **C-5:** Database schema must be deployable via single SQL file
- **C-6:** Environment variables for Supabase URL and anon key

### Technical Debt Accepted
- **TD-1:** No server-side rendering (SSR) for SEO
- **TD-2:** No image optimization pipeline (manual pre-upload)
- **TD-3:** No automated testing in Phase 1
- **TD-4:** No CI/CD pipeline initially

---

## 8. Success Criteria

### Phase 1 Completion Criteria
- [x] Database schema deployed to Supabase Cloud
- [x] Angular project scaffolded with correct structure
- [x] Authentication flow working (register, login, logout)
- [x] Google OAuth authentication implemented
- [x] Email confirmation flow with user messaging
- [x] Public recipe browsing functional
- [ ] Ingredient-based search returns results
- [ ] Admin can CRUD recipes with image upload
- [x] RLS policies enforced (verified via direct API calls)
- [x] Application compiles without errors
- [x] All routes protected by appropriate guards
- [x] Profile creation trigger with display_name support
- [x] Saved recipes functionality implemented
- [x] Multi-language support (BG/EN) implemented
- [x] Modern design system with animations
- [x] Mobile-first responsive layouts

### User Acceptance
- Guest can find recipe by 3 ingredients in < 2 minutes
- Registered user can save recipe and retrieve from profile
- Admin can add new recipe with 5 ingredients in < 5 minutes

---

## 9. Open Questions & Risks

### Open Questions
- **Q-1:** Should recipe steps be plain text or support rich formatting (bold, links)?
  - **Decision Needed By:** Before implementing recipe form
  - **Recommendation:** Plain text for MVP, rich text in Phase 2

- **Q-2:** How to handle ingredient variations (e.g., "tomato" vs "tomatoes")?
  - **Decision Needed By:** Before ingredient search implementation
  - **Recommendation:** Admin enters canonical form, add aliases in Phase 2

- **Q-3:** Should deleted recipes remain in database (soft delete) or hard delete?
  - **Decision Needed By:** Before implementing delete functionality
  - **Recommendation:** Hard delete for MVP, soft delete if audit trail needed

### Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Supabase free tier limits exceeded | High | Low | Monitor usage, plan upgrade path |
| RLS policy misconfiguration exposing admin data | Critical | Medium | Test with non-admin accounts, peer review policies |
| Image upload failures due to size/format | Medium | Medium | Client-side validation, clear error messages |
| Ingredient search performance degrades with scale | Medium | Low | Add indexes on recipe_ingredients, consider full-text search later |
| Angular Signals learning curve delays development | Low | Medium | Allocate time for team training, fallback to RxJS if needed |

---

## 10. Dependencies

### External Services
- Supabase Cloud account (free tier)
- Supabase Storage bucket 'recipes' configured
- Node.js 18+ and npm/yarn

### Libraries & Frameworks
- Angular 17+ (standalone components, signals)
- RxJS 7+
- Angular Material (optional, for dialogs/forms)
- Supabase JS client library

### Development Tools
- Angular CLI
- TypeScript 5+
- SCSS compiler (built into Angular)

---

## 11. References

- **Constitution:** `constitution.md` - Engineering standards and workflow
- **Input Spec:** `input.md` - Original product requirements
- **Supabase Docs:** https://supabase.com/docs
- **Angular Docs:** https://angular.dev

---

**Next Steps:**
1. Review and approve this specification
2. Generate implementation plan (`plan.md`)
3. Create database schema (`db_schema.sql`)
4. Begin Phase 2: Implementation
