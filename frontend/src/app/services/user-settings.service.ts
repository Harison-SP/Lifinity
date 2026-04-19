import { Injectable, signal, effect } from '@angular/core';

export interface UserSettings {
  weekStartDay: 'Monday' | 'Sunday';
  defaultHabitView: 'daily' | 'weekly';
  showCompletedHabits: boolean;
  focusSessionLength: number;
  shortBreakLength: number;
  longBreakLength: number;
  aiSuggestionsEnabled: boolean;
  soundEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserSettingsService {
  private readonly settingsKey = 'user-settings';
  
  private defaultSettings: UserSettings = {
    weekStartDay: 'Monday',
    defaultHabitView: 'daily',
    showCompletedHabits: true,
    focusSessionLength: 25,
    shortBreakLength: 5,
    longBreakLength: 15,
    aiSuggestionsEnabled: true,
    soundEnabled: true
  };

  settings = signal<UserSettings>(this.loadSettings());

  constructor() {
    effect(() => {
      localStorage.setItem(this.settingsKey, JSON.stringify(this.settings()));
    });
  }

  private loadSettings(): UserSettings {
    const saved = localStorage.getItem(this.settingsKey);
    if (saved) {
      try {
        return { ...this.defaultSettings, ...JSON.parse(saved) };
      } catch (e) {
        return this.defaultSettings;
      }
    }
    return this.defaultSettings;
  }

  updateSettings(partialSettings: Partial<UserSettings>) {
    this.settings.update(current => ({ ...current, ...partialSettings }));
  }
}
