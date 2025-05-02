import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'posts',
    loadComponent: () => import('./posts/posts.component').then((M) => M.PostsComponent),
  },
  {
    path: 'post/:id',
    loadComponent: () => import('./post/post.component').then((M) => M.PostComponent)
  },
  {
    redirectTo: 'posts',
    path: '**',
    pathMatch: 'full',
  }
];
