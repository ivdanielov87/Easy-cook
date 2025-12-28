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

#### Profile Creation Trigger
**CRITICAL:** The database trigger for creating user profiles MUST extract metadata from `auth.users`.

**Mistake Made:**
```sql
-- WRONG: Missing display_name extraction
INSERT INTO public.profiles (id, email, role)
VALUES (NEW.id, NEW.email, 'user');
```

**Correct Implementation:**
```sql
-- CORRECT: Extract display_name from user metadata
INSERT INTO public.profiles (id, email, display_name, role)
VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    'user'
);
```

**Why:** When users register with `signUp(email, password, displayName)`, Supabase stores `displayName` in `raw_user_meta_data`. The trigger must extract it to populate the profile table.

#### Email Validation
**CRITICAL:** Supabase validates email domains and rejects fake/test domains.

**Mistake Made:**
- Using test emails like `user@example.com` during development
- These fail with `400 Bad Request: email_address_invalid`

**Solution:**
- Use real email domains (Gmail, Outlook, etc.) for testing
- Document this requirement in setup instructions
- For development, consider disabling email confirmation in Supabase settings

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

### 5.2 Authentication & OAuth

#### Google OAuth Implementation
**BEST PRACTICE:** Always provide OAuth options alongside email/password for better UX.

**Implementation Checklist:**
1. Add `signInWithGoogle()` method to SupabaseService
2. Add `signInWithGoogle()` method to AuthService
3. Add Google sign-in button to both login AND register pages
4. Use official Google branding (colors, logo)
5. Add "OR" divider between authentication methods
6. Configure Google OAuth in Supabase Dashboard
7. Add redirect URL to Google Cloud Console

**UI/UX:**
- Place Google button below email/password form
- Use white background with Google's official colors
- Add subtle hover effects
- Ensure button is accessible on mobile (min 44px height)

#### Authentication Guards
**CRITICAL:** Implement guards for protected content, not just routes.

**Mistake Made:**
- Recipe detail page was accessible to unauthenticated users
- Should have required login to view full recipe details

**Solution:**
- Check authentication in component `ngOnInit()`
- Show login prompt with redirect buttons for unauthenticated users
- Don't load sensitive data if user is not authenticated
- Provide clear call-to-action (Login/Register buttons)

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

**Mistake Made:**
- Hardcoded error messages in components
- Forgot to add translation keys for new features

**Solution:**
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