import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly themeKey = 'app-theme';
  currentTheme = signal<'light' | 'dark'>(this.getInitialTheme());

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem(this.themeKey, theme);
    });
  }

  private getInitialTheme(): 'light' | 'dark' {
    const savedTheme = localStorage.getItem(this.themeKey);
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme;
    }
    // Default to system preference if no theme is saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  toggleTheme() {
    this.currentTheme.update(theme => (theme === 'light' ? 'dark' : 'light'));
  }
}
