import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Páginas que só fazem sentido com o cliente logado (ex.: /conta).
// Sem login, manda para /login.
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.estaLogado() ? true : router.createUrlTree(['/login']);
};
