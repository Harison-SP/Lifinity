import { Component, inject } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavigationOverlayComponent } from "./components/navigation-overlay/navigation-overlay";
import { ToastContainerComponent } from './components/toast-container/toast-container.component';
import { AuthService } from './core/auth/auth.service';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationOverlayComponent, ToastContainerComponent, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private themeService = inject(ThemeService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated$ = this.authService.isAuthenticated$;
  
  // Track if current route is the login page
  isLoginPage$ = this.router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map((event: NavigationEnd) => event.urlAfterRedirects?.startsWith('/login'))
  );

  // Show nav only when authenticated AND not on login page
  showNav$ = this.isAuthenticated$.pipe(
    map(isAuth => isAuth)
  );
}
