# CookSmart

A modern recipe management and discovery application built with Angular 19 and Supabase.

## Overview

CookSmart is a full-stack web application that allows users to browse recipes, search by ingredients, and manage their pantry. It features a public-facing recipe discovery interface and an admin panel for recipe management.

### Key Features

- 🍳 **Recipe Discovery**: Browse featured recipes and search with filters
- 🔍 **Smart Pantry**: Find recipes based on available ingredients
- 🌐 **Bilingual Support**: Bulgarian and English translations
- 📱 **Responsive Design**: Mobile-first design that works on all devices
- 🔐 **Authentication**: Secure user authentication with Supabase
- 👨‍💼 **Admin Panel**: Manage recipes with a dedicated admin interface
- 🎨 **Modern UI**: Smooth animations and premium design

## Tech Stack

- **Frontend**: Angular 19 (Standalone Components, Signals)
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Styling**: SCSS with design tokens and responsive mixins
- **i18n**: ngx-translate for internationalization
- **Animations**: Angular Animations API

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account and project

## Environment Setup

1. Create a `.env` file in the `cooksmart/src/environments/` directory:

```typescript
// environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'YOUR_SUPABASE_URL',
    anonKey: 'YOUR_SUPABASE_ANON_KEY'
  }
};
```

2. Replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with your Supabase project credentials.

## Installation

```bash
# Navigate to the project directory
cd cooksmart

# Install dependencies
npm install
```

## Development Server

To start a local development server:

```bash
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you modify source files.

## Building

To build the project for production:

```bash
ng build
```

Build artifacts will be stored in the `dist/` directory.

## Project Structure

```
cooksmart/
├── src/
│   ├── app/
│   │   ├── core/              # Core services, guards, models
│   │   │   ├── guards/        # Auth and admin guards
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   └── services/      # Business logic services
│   │   ├── features/          # Feature modules
│   │   │   ├── admin/         # Admin panel components
│   │   │   └── public/        # Public-facing components
│   │   ├── layout/            # Layout components
│   │   │   ├── admin-layout/  # Admin sidebar layout
│   │   │   └── main-layout/   # Public navbar layout
│   │   └── shared/            # Shared utilities and animations
│   ├── assets/
│   │   └── i18n/              # Translation files (bg.json, en.json)
│   ├── styles/                # Global SCSS files
│   │   ├── _variables.scss    # Design tokens
│   │   └── _mixins.scss       # Responsive mixins
│   └── environments/          # Environment configurations
└── README.md
```

## Routes

### Public Routes
- `/` - Home page with featured recipes
- `/recipes` - Recipe list with filters and search
- `/recipes/:slug` - Recipe detail page
- `/pantry` - Ingredient-based recipe discovery

### Admin Routes (Protected)
- `/admin` - Admin dashboard
- `/admin/recipes` - Recipe management (CRUD)

## Database Schema

The application uses Supabase PostgreSQL with the following tables:

- **profiles**: User profiles with display names and avatars
- **recipes**: Recipe information (title, description, difficulty, etc.)
- **ingredients**: Master ingredient list
- **recipe_ingredients**: Junction table linking recipes to ingredients
- **saved_recipes**: User's saved/favorited recipes

All tables are protected with Row Level Security (RLS) policies.

## Available Scripts

```bash
# Start development server
ng serve

# Build for production
ng build

# Generate new component
ng generate component component-name

# Run linter
ng lint

# Run tests
ng test
```

## Translation

The application supports Bulgarian (default) and English. Translation files are located in `src/assets/i18n/`:

- `bg.json` - Bulgarian translations
- `en.json` - English translations

To add a new language:
1. Create a new JSON file in `src/assets/i18n/`
2. Add the language to `SupportedLanguage` type in `translate.service.ts`
3. Update the language switcher in layout components

## Deployment

The application can be deployed to any static hosting service:

- **Netlify**: Connect your Git repository and deploy automatically
- **Vercel**: Import your project and deploy with zero configuration
- **Firebase Hosting**: Use Firebase CLI to deploy
- **GitHub Pages**: Build and deploy to gh-pages branch

Make sure to set environment variables for Supabase credentials in your hosting platform.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Additional Resources

- [Angular Documentation](https://angular.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [ngx-translate Documentation](https://github.com/ngx-translate/core)
- [Angular CLI Reference](https://angular.dev/tools/cli)
