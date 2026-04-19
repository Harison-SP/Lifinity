import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, inject } from '@angular/core';
import { provideRouter, withViewTransitions, Router, isActive } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAteEditor } from '@flogeez/angular-tiptap-editor';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withViewTransitions({
      skipInitialTransition: true,
      onViewTransitionCreated: ({ transition }) => {
        const router = inject(Router);
        const currentNav = router.currentNavigation();
        if (!currentNav || !currentNav.finalUrl) return;
        
        const targetUrl = currentNav.finalUrl;
        const config: any = {
          paths: 'exact',
          matrixParams: 'exact',
          fragment: 'ignored',
          queryParams: 'ignored',
        };
        const isTargetRouteCurrent = isActive(targetUrl, router, config);
        
        if (isTargetRouteCurrent) {
          // Check if function or boolean (isActive might return boolean in older angular or function in newer)
          if (typeof isTargetRouteCurrent === 'function') {
            if ((isTargetRouteCurrent as any)()) {
              transition.skipTransition();
            }
          } else if (isTargetRouteCurrent) {
             transition.skipTransition();
          }
        }
      }
    })),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync(),
    provideAteEditor()
  ]
};
