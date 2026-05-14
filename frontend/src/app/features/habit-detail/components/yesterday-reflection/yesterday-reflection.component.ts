import { Component, Input, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Habit } from '../../../../models/habit.model';
import { HabitService } from '../../../../services/habit.service';

@Component({
    selector: 'app-yesterday-reflection',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="bg-alabaster rounded-2xl shadow-gentle p-6 border border-taupe/10 mb-8">
        <div class="flex items-center justify-between mb-4">
            <h3 class="font-heading text-xl font-bold text-charcoal flex items-center gap-2">
                <span class="material-symbols-outlined text-primary">history</span>
                Yesterday's Reflection
            </h3>
            <button (click)="toggleReflection()"
                    class="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full transition-all"
                    [class.bg-primary/10]="showReflection()"
                    [class.text-primary]="showReflection()"
                    [class.bg-taupe/10]="!showReflection()"
                    [class.text-taupe]="!showReflection()">
                {{ showReflection() ? 'Collapse' : 'Review' }}
            </button>
        </div>

        @if (showReflection()) {
            <div class="space-y-4">
                @if (yesterdayData) {
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="bg-white rounded-lg p-4 border border-taupe/10">
                            <p class="text-xs font-bold uppercase tracking-wider text-taupe mb-1">Performance</p>
                            <p class="text-2xl font-bold text-charcoal">{{ yesterdayData.performance || 0 }}%</p>
                        </div>
                        <div class="bg-white rounded-lg p-4 border border-taupe/10">
                            <p class="text-xs font-bold uppercase tracking-wider text-taupe mb-1">Completed</p>
                            <p class="text-2xl font-bold text-sage">{{ yesterdayData.completed || 0 }}/{{ yesterdayData.total || 0 }}</p>
                        </div>
                        <div class="bg-white rounded-lg p-4 border border-taupe/10">
                            <p class="text-xs font-bold uppercase tracking-wider text-taupe mb-1">Streak Impact</p>
                            <p class="text-2xl font-bold" [class.text-sage]="yesterdayData.onTrack" [class.text-orange-500]="!yesterdayData.onTrack">
                                {{ yesterdayData.onTrack ? 'Maintained' : 'Penalized' }}
                            </p>
                        </div>
                    </div>
                } @else {
                    <p class="text-taupe italic">No data available for yesterday.</p>
                }

                <div>
                    <label class="block text-xs font-bold uppercase tracking-wider text-taupe mb-2">
                        Reflection Notes
                    </label>
                    <textarea [(ngModel)]="reflectionNotes"
                              rows="3"
                              placeholder="What went well? What could be improved?"
                              class="w-full px-4 py-3 text-sm border border-taupe/20 rounded-xl focus:outline-none focus:border-primary resize-none bg-white">
                    </textarea>
                </div>

                <div class="flex justify-end gap-3">
                    <button (click)="saveReflection()"
                            class="px-4 py-2 bg-primary text-white rounded-lg font-bold text-sm hover:bg-primary/90 transition-colors">
                        Save Reflection
                    </button>
                    <button (click)="openNextDaySeeder()"
                            class="px-4 py-2 bg-sage/10 text-sage rounded-lg font-bold text-sm hover:bg-sage/20 transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">add</span>
                        Seed Tomorrow
                    </button>
                </div>
            </div>
        }
    </div>

    <!-- Next-Day Seeder Modal -->
    @if (showSeeder()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" (click)="closeSeeder()">
            <div class="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" (click)="$event.stopPropagation()">
                <h4 class="font-heading text-lg font-bold text-charcoal mb-4">Add Next-Day Tasks</h4>
                <p class="text-sm text-taupe mb-4">Add tasks to tomorrow's planner directly from today's reflection.</p>

                <div class="space-y-3 mb-4">
                    <input type="text" [(ngModel)]="newTaskTitle" placeholder="Task title..."
                           class="w-full px-3 py-2 border border-taupe/20 rounded-lg focus:outline-none focus:border-primary">
                    <input type="text" [(ngModel)]="newTaskDescription" placeholder="Description (optional)..."
                           class="w-full px-3 py-2 border border-taupe/20 rounded-lg focus:outline-none focus:border-primary">
                </div>

                <div class="flex justify-end gap-2">
                    <button (click)="closeSeeder()" class="px-3 py-1 text-sm text-taupe hover:text-charcoal">Cancel</button>
                    <button (click)="addNextDayTask()" [disabled]="!newTaskTitle"
                            class="px-4 py-1 bg-primary text-white rounded-lg text-sm font-bold disabled:opacity-50">
                        Add to Tomorrow
                    </button>
                </div>
            </div>
        </div>
    }
    `,
    styles: [`
        :host { display: block; }
    `]
})
export class YesterdayReflectionComponent {
    @Input() habit!: Habit;
    @Input() yesterdayData: { performance: number; completed: number; total: number; onTrack: boolean } | null = null;

    habitService = inject(HabitService);
    showReflection = signal(false);
    showSeeder = signal(false);
    reflectionNotes = '';
    newTaskTitle = '';
    newTaskDescription = '';

    toggleReflection() {
        this.showReflection.update(v => !v);
    }

    openNextDaySeeder() {
        this.showSeeder.set(true);
    }

    closeSeeder() {
        this.showSeeder.set(false);
        this.newTaskTitle = '';
        this.newTaskDescription = '';
    }

    saveReflection() {
        // In a real implementation, this would save to a backend
        console.log('Saving reflection:', this.reflectionNotes);
    }

    addNextDayTask() {
        // In a real implementation, this would add to tomorrow's planner
        console.log('Adding task for tomorrow:', this.newTaskTitle, this.newTaskDescription);
        this.closeSeeder();
    }
}