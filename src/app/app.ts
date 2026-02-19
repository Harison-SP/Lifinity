import { Component, signal, inject } from '@angular/core';
import { ThemeService } from './services/theme.service';
import { RouterOutlet } from '@angular/router';
import { NavigationOverlayComponent } from "./components/navigation-overlay/navigation-overlay";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private themeService = inject(ThemeService);
  protected readonly title = signal('todo');
}
