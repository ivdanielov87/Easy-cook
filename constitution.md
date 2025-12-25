# Engineering Constitution

## 1. Tech Stack
* **Frontend:** Angular (Latest Stable Version).
    * Use **Standalone Components**.
    * Use **Angular Signals** for state management.
    * Use **RxJS** for complex async flows (http requests).
* **Styling:** SCSS (Sass).
    * Use variable files (`_variables.scss`) for colors/fonts.
    * Use component-scoped styles (`ViewEncapsulation`).
* **Backend:** Supabase Cloud (Hosted).
    * Database: PostgreSQL.
    * Auth: Supabase Auth.
    * Storage: Supabase Storage (Bucket: 'recipes').
* **Admin Panel:**
    * Use a dedicated layout for admin routes.
    * Protected by `AdminGuard` and Row Level Security (RLS) in DB.
* **UI Components:** Angular Material OR Custom SCSS components.

## 2. Architecture & Patterns
* **Routing:**
    * Lazy loading for all major features (Admin, Profile, Recipes).
    * **Guards:** Implement `AuthGuard` (for profile) and `AdminGuard` (strictly for admin panel).
* **Project Structure:**
    * `src/app/core`: Singleton services (AuthService), Guards, Interceptors.
    * `src/app/layout`: Global Layout components (Header, Footer, Sidebar for Admin).
    * `src/app/features/public`: Home, Search, Recipe Details.
    * `src/app/features/admin`: Dashboard, Recipe Management (CRUD).
    * `src/app/shared`: Reusable pipes, directives, and dump components.

## 3. Rules
* Never use `any`. Define interfaces in `src/app/core/models`.
* Handle errors gracefully (display user-friendly messages).
* Keep components small. Separation of concerns (Logic in Services, UI in Components).
* **SCSS Methodology:** Avoid deep nesting. Keep styles modular.
* **Typing:** Strict TypeScript. Define interfaces for `Recipe`, `Ingredient`, `UserProfile`.
* **Security:** Ensure Admin routes are protected not just by UI guards, but by RLS (Row Level Security) policies on the backend/Supabase side description.

## 4. Workflow & Git Strategy
* **Setup:** Since we use Supabase Cloud, generate a `db_schema.sql` file first.
* **Commit Policy:**
    * You MUST perform a `git commit` after completing each logical task or Step from the plan.
    * Never implement multiple huge features in a single commit.
    * **Commit Message Format:** `feat(scope): description` or `fix(scope): description`.
    * Example: `feat(auth): implement login guard`, `style(header): add scss variables`.
* **Testing:** Ensure components compile before committing.
* **Step-by-Step Execution:**
    * Read the `plan.md`.
    * Execute ONE step.
    * Verify it compiles/works.
    * Commit.
    * Move to the next step.