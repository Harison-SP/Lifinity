import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationOverlayComponent } from "./components/navigation-overlay/navigation-overlay";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('todo');
}
