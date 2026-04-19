import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  // Add token to headers if it exists
  if (token && req.url.includes(authService['apiUrl']) === false || req.url.includes('/me')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  } else if (token) {
     req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If 401 Unauthorized and not already refreshing
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        return authService.refreshToken().pipe(
          switchMap(tokenResponse => {
            if (tokenResponse) {
              const newReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${tokenResponse.access_token}`
                }
              });
              return next(newReq);
            }
            return throwError(() => error);
          }),
          catchError(refreshErr => {
            authService.logout();
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
