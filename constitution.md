# Engineering Constitution

## 1. Tech Stack
* **Frontend:** Angular (Latest Stable Version).
    * Use **Standalone Components**.
    * Use **Angular Signals** for state management.
    * Use **RxJS** for complex async flows (http requests).
* **Internationalization (i18n):** Use `@ngx-translate/core` for runtime language switching (BG/EN).
    * Store translation JSON files in `src/assets/i18n/`.
* **UI/UX & Animations:**
    * **Design System:** Modern, minimalist, "Airy" look with ample whitespace.
    * **Animations:** Use `@angular/animations` for smooth transitions (fade-in on route change, slide-in for lists).
* **Responsive Design Strategy:**
    * **Mobile-First Approach:** Write base styles for mobile devices first, then use `@media (min-width: ...)` to override for Tablet and Desktop.
    * **Breakpoints:** Define and use standard SCSS mixins/variables:
        * `$mobile`: < 768px (1 column layout, hamburger menu).
        * `$tablet`: 768px - 1024px (2 column grids).
        * `$desktop`: > 1024px (Max width container, 3-4 column grids).
    * **Grid System:** Use CSS Grid or Flexbox for layouts. Avoid fixed pixel widths for containers (use `%`, `rem`, or `vw`).
* **Styling:** SCSS (Sass).
    * Use variable files (`_variables.scss`) for colors/fonts.
    * Use component-scoped styles (`ViewEncapsulation`).
    * Components should feel "premium" (subtle shadows, rounded corners, hover effects).
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

---

## 5. Lessons Learned & Critical Best Practices

### 5.1 Database & Backend

#### Email Confirmation Flow
**CRITICAL:** Supabase requires email confirmation by default. Users cannot login until they confirm.

**Mistake Made:**
- Not implementing user-facing error messages for `email_not_confirmed` errors
- Users were confused why they couldn't login after registration

**Solution:**
- Detect `email_not_confirmed` error code on login
- Show clear message: "Please confirm your email address before logging in"
- After registration, show success message with instructions to check email
- Remind users to check spam folder
- Provide "Go to Login" button after registration success

**Alternative for Development:**
- Disable email confirmation in Supabase Dashboard → Authentication → Email Auth
- Re-enable for production

### 5.3 Frontend Architecture

#### Service Return Types
**BEST PRACTICE:** Services should return consistent response objects with success/error states.

**Pattern:**
```typescript
async signUp(email: string, password: string, displayName: string): 
  Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await this.supabase.signUp(email, password, displayName);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err) {
    return { success: false, error: 'An unexpected error occurred' };
  }
}
```

**Why:** Allows components to handle success/error states consistently without try/catch blocks.

#### Translation Keys
**BEST PRACTICE:** Add translation keys for ALL user-facing text, including error messages.

- Add translation keys immediately when implementing features
- Use consistent naming: `AUTH.ERROR_TYPE`, `COMMON.ACTION`
- Update both `en.json` AND `bg.json` simultaneously
- Test language switching after adding new keys

#### Component State Management
**BEST PRACTICE:** Use signals for component state, especially for success/error messages.

**Pattern:**
```typescript
export class RegisterComponent {
  loading = signal<boolean>(false);
  error = signal<string>('');
  success = signal<string>('');  // Add success state
  registrationComplete = signal<boolean>(false);  // Add flow state
}
```

**Why:** Allows conditional rendering based on state (show form vs. show success message).

### 5.4 UI/UX Best Practices

#### Success States
**CRITICAL:** Always show success feedback after important actions.

**Mistake Made:**
- Registration redirected immediately without confirmation
- Users didn't know if registration succeeded
- No guidance about email confirmation

**Solution:**
- Show success message with checkmark icon
- Explain next steps (check email, confirm account)
- Provide navigation button ("Go to Login")
- Don't auto-redirect for critical actions

#### Error Messages
**CRITICAL:** Provide specific, actionable error messages.

**Examples:**
- "Login failed" → "Please confirm your email address before logging in"
- "Invalid email" → "Email address 'user@example.com' is invalid. Please use a real email domain."
- "Error" → "Registration successful! Check your email to confirm your account."

#### Mobile-First Design
**BEST PRACTICE:** Always design for mobile first, then enhance for larger screens.

**Pattern:**
```scss
// Base styles (mobile)
.container {
  width: 100%;
  padding: $spacing-md;
}

// Tablet enhancement
@include tablet {
  .container {
    padding: $spacing-lg;
  }
}

// Desktop enhancement
@include desktop {
  .container {
    max-width: $container-max-width;
  }
}
```

### 5.5 Testing & Validation

#### Test with Real Data
**CRITICAL:** Test authentication with real email addresses and actual OAuth providers.

**Testing Checklist:**
- Register with real Gmail/Outlook account
- Verify email confirmation email arrives
- Click confirmation link
- Login with confirmed account
- Test Google OAuth flow end-to-end
- Verify profile created in database with all fields
- Test on mobile device (not just browser DevTools)

#### Database Verification
**BEST PRACTICE:** Always verify database changes in Supabase dashboard.

**After Each Feature:**
1. Check table in Supabase Table Editor
2. Verify all columns populated correctly
3. Test RLS policies with non-admin account
4. Check trigger execution in database logs

### 5.6 Documentation

#### Keep Documentation Updated
**CRITICAL:** Update `spec.md` and `plan.md` after completing major features.

**Update Checklist:**
- Mark completed tasks with checkmarks
- Update version numbers
- Add "Recently Completed" sections
- Document any deviations from original plan
- Add lessons learned to constitution.md

#### SQL Scripts
**BEST PRACTICE:** Provide diagnostic and fix scripts for common issues.

**Example:** Create `fix_profile_trigger.sql` that:
- Drops and recreates trigger
- Verifies trigger exists
- Shows users without profiles
- Creates missing profiles
- Reports final status

### 5.7 Code Quality & Safety

#### Null Safety
**CRITICAL:** Always check for null/undefined before accessing properties or methods.

**Mistake Made:**
- Accessing properties without null checks
- Assuming data always exists from API responses
- Not handling empty states

**Solution:**
```typescript
// ❌ WRONG: No null check
const userName = user.display_name.toUpperCase();

// ✅ CORRECT: Safe navigation and fallback
const userName = user?.display_name?.toUpperCase() ?? 'Guest';

// ✅ CORRECT: Explicit null check
if (user && user.display_name) {
  const userName = user.display_name.toUpperCase();
}

// ✅ CORRECT: In templates
@if (recipe) {
  <h1>{{ recipe.title }}</h1>
}

// ✅ CORRECT: With optional chaining
<p>{{ recipe?.description ?? 'No description available' }}</p>
```

**Best Practices:**
- Use optional chaining (`?.`) for property access
- Use nullish coalescing (`??`) for default values
- Use `@if` blocks in templates for conditional rendering
- Always handle loading and empty states
- Check array length before accessing elements

#### Clean Up Default Angular Files
**CRITICAL:** Remove default Angular scaffolding content before starting development.

**Mistake Made:**
- Left default `app.component.html` content from `ng new`
- Forgot to clean up example code and comments
- Default content interfered with actual application

**Solution - After `ng new`, immediately clean up:**

**`app.component.html`:**
```html
<!-- ❌ WRONG: Leave Angular default content -->
<div class="content" role="main">
  <span>Welcome to {{ title }}!</span>
  <!-- ... Angular default content ... -->
</div>

<!-- ✅ CORRECT: Clean slate -->
<router-outlet></router-outlet>
```

**`app.component.ts`:**
```typescript
// ❌ WRONG: Leave default title
export class AppComponent {
  title = 'cooksmart';
}

// ✅ CORRECT: Remove unused properties
export class AppComponent {
  // Clean component, logic in services
}
```

**Files to Clean/Remove:**
1. Clear `app.component.html` (leave only `<router-outlet>`)
2. Remove unused properties from `app.component.ts`
3. Clean up `app.component.scss` (remove default styles)
4. Delete `app.component.spec.ts` if not using tests in MVP
5. Remove default favicon and replace with project icon
6. Update `index.html` title and meta tags

### 5.8 Routing & Navigation

#### Verify Button Navigation
**CRITICAL:** Always verify that buttons and links navigate to the correct routes.

**Mistake Made:**
- Created buttons without implementing routes
- Buttons clicked but nothing happened
- Forgot to create corresponding components

**Solution - Navigation Verification Checklist:**

**1. Check if route exists:**
```typescript
// In app.routes.ts
export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent }, // ✅ Route exists
];
```

**2. Verify component exists:**
```bash
# Check if component file exists
ls src/app/features/auth/register/
# Should show: register.ts, register.html, register.scss
```

**3. Test navigation:**
```html
<!-- In template -->
<button routerLink="/register">Register</button>

<!-- Or programmatic -->
<button (click)="goToRegister()">Register</button>
```

```typescript
// In component
goToRegister() {
  this.router.navigate(['/register']);
}
```

**4. Check browser console for routing errors:**
- `Error: Cannot match any routes. URL Segment: 'register'` → Route not defined
- Component not found → Create the component

**Complete Flow When Adding Navigation:**
1. ✅ Create component: `ng generate component features/auth/register`
2. ✅ Add route to `app.routes.ts`
3. ✅ Implement component logic and template
4. ✅ Add navigation button/link
5. ✅ Test navigation works
6. ✅ Verify route guard if needed
7. ✅ Test back button behavior

#### Route Organization
**BEST PRACTICE:** Organize routes by feature and access level.

**Pattern:**
```typescript
export const routes: Routes = [
  // Public routes (no auth required)
  { path: '', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Protected routes (auth required)
  { 
    path: 'profile', 
    component: ProfileComponent, 
    canActivate: [AuthGuard] 
  },
  
  // Admin routes (admin role required)
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'recipes', component: AdminRecipeListComponent },
    ]
  },
  
  // Wildcard route (404)
  { path: '**', redirectTo: '' }
];
```

---

## 6. Common Pitfalls to Avoid

### Don't:
1. Use fake email domains (example.com) for testing
2. Forget to extract metadata in database triggers
3. Hardcode error messages instead of using translations
4. Auto-redirect after critical actions without user confirmation
5. Implement features without updating documentation
6. Test only in browser DevTools (test on real mobile devices)
7. Forget to add success states for user actions
8. Skip email confirmation messaging
9. Implement authentication without OAuth options
10. Forget to check authentication in component logic (not just routes)
11. Access properties without null/undefined checks
12. Leave default Angular scaffolding content in production code
13. Create navigation buttons without implementing routes first
14. Assume data always exists from API responses
15. Forget to test that buttons actually navigate correctly

### Do:
1. Use real email addresses for testing authentication
2. Extract all user metadata in profile creation triggers
3. Add translation keys for all user-facing text
4. Show success messages with clear next steps
5. Update spec.md and plan.md after major milestones
6. Test on actual mobile devices
7. Implement both success and error states
8. Provide clear email confirmation instructions
9. Offer multiple authentication methods (email + OAuth)
10. Implement authentication guards at component level
11. Use optional chaining (`?.`) and nullish coalescing (`??`)
12. Clean up default Angular files immediately after `ng new`
13. Create routes and components before adding navigation
14. Handle loading, empty, and error states for all data
15. Verify navigation works by clicking every button/link