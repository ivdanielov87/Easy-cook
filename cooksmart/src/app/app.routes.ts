import { Routes } from '@angular/router';
import { MainLayout } from './layout/main-layout/main-layout';
import { Home } from './features/public/home/home';
import { RecipeList } from './features/public/recipe-list/recipe-list';
import { RecipeDetail } from './features/public/recipe-detail/recipe-detail';
import { Pantry } from './features/public/pantry/pantry';

export const routes: Routes = [
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
  }
];
