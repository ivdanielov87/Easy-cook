import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { AdminLayout } from './layout/admin-layout/admin-layout';
import { Home } from './features/public/home/home';
import { RecipeList } from './features/public/recipe-list/recipe-list';
import { RecipeDetail } from './features/public/recipe-detail/recipe-detail';
import { Pantry } from './features/public/pantry/pantry';
import { Login } from './features/auth/login/login';
import { Dashboard } from './features/admin/dashboard/dashboard';
import { RecipeManagement } from './features/admin/recipe-management/recipe-management';
import { RecipeForm } from './features/admin/recipe-form/recipe-form';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    component: Login
  },
  {
    path: '',
    component: MainLayout,
    children: [
      {
        path: '',
        component: Home
      },
      {
        path: 'recipes',
        component: RecipeList
      },
      {
        path: 'recipes/:slug',
        component: RecipeDetail
      },
      {
        path: 'pantry',
        component: Pantry
      }
    ]
  },
  {
    path: 'admin',
    component: AdminLayout,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        component: Dashboard
      },
      {
        path: 'recipes',
        component: RecipeManagement
      },
      {
        path: 'recipes/new',
        component: RecipeForm
      },
      {
        path: 'recipes/edit/:id',
        component: RecipeForm
      }
    ]
  }
];
