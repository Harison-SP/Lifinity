import { Component, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Habit, MicroHabit } from '../../../../models/habit.model';
import { HabitService } from '../../../../services/habit.service';

@Component({
    selector: 'app-subtask-matrix',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="bg-white rounded-2xl shadow-gentle p-8 border border-taupe/10">
        <div class="flex items-center justify-between mb-6">
            <h3 class="font-heading text-2xl font-bold text-charcoal flex items-center gap-2">
                <span class="material-symbols-outlined text-orange-500">grid_view</span>
                Subtask Matrix
            </h3>
            @if (habit().priority === 'high') {
                <span class="px-3 py-1 bg-orange-500/10 text-orange-600 text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                    <span class="material-symbols-outlined text-sm">warning</span>
                    Non-Negotiable Protocol
                </span>
            }
        </div>

        @if (subtasks().length === 0) {
            <div class="text-center py-12">
                <span class="material-symbols-outlined text-5xl text-taupe/20 mb-3 block">task_alt</span>
                <p class="text-taupe italic">No micro-habits defined. Add steps to break down this protocol.</p>
            </div>
        } @else {
            <div class="space-y-4">
                @for (subtask of subtasks(); track subtask.id) {
                    <div class="group relative bg-sand/30 hover:bg-sand/50 transition-all rounded-xl p-5 border border-taupe/10 hover:shadow-gentle"
                         [class.border-orange-500/30]="subtask.priority === 'high'"
                         [class.bg-orange-500/5]="subtask.priority === 'high' && subtask.completedToday">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-start gap-3 flex-1">
                                <button (click)="toggleSubtaskCompletion(subtask)"
                                        class="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all mt-0.5"
                                        [class.border-sage]="subtask.completedToday"
                                        [class.bg-sage]="subtask.completedToday"
                                        [class.border-taupe]="!subtask.completedToday"
                                        [class.hover:border-sage]="!subtask.completedToday"
                                        [class.border-orange-500]="subtask.priority === 'high' && subtask.completedToday"
                                        [class.bg-orange-500]="subtask.priority === 'high' && subtask.completedToday">
                                    @if (subtask.completedToday) {
                                        <span class="material-symbols-outlined text-white text-sm">check</span>
                                    }
                                </button>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-1">
                                        <h4 class="font-bold text-charcoal" [class.line-through]="subtask.completedToday" [class.opacity-70]="subtask.completedToday">
                                            {{ subtask.name }}
                                        </h4>
                                        <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full"
                                              [class.bg-sage/20]="subtask.priority === 'low'"
                                              [class.text-sage]="subtask.priority === 'low'"
                                              [class.bg-amber-500/20]="subtask.priority === 'medium'"
                                              [class.text-amber-600]="subtask.priority === 'medium'"
                                              [class.bg-orange-500/20]="subtask.priority === 'high'"
                                              [class.text-orange-600]="subtask.priority === 'high'">
                                            {{ subtask.priority }}
                                        </span>
                                        @if (subtask.priority === 'high') {
                                            <span class="material-symbols-outlined text-orange-500 text-xs">priority_high</span>
                                        }
                                    </div>
                                    @if (subtask.description) {
                                        <p class="text-sm text-taupe mb-2" [class.line-through]="subtask.completedToday" [class.opacity-60]="subtask.completedToday">
                                            {{ subtask.description }}
                                        </p>
                                    }
                                    <div class="flex items-center gap-4 text-xs text-taupe">
                                        @if (subtask.executionWindowStart) {
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-xs">schedule</span>
                                                {{ subtask.executionWindowStart }} - {{ subtask.executionWindowEnd || 'End' }}
                                            </span>
                                        }
                                        @if (subtask.reminderOffsetMinutes) {
                                            <span class="flex items-center gap-1">
                                                <span class="material-symbols-outlined text-xs">notifications</span>
                                                {{ subtask.reminderOffsetMinutes }}min before
                                            </span>
                                        }
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col items-end gap-1">
                                <span class="text-xs font-bold" [class.text-sage]="subtask.streak && subtask.streak > 3"
                                      [class.text-taupe]="!subtask.streak || subtask.streak <= 3">
                                    {{ subtask.streak }} day streak
                                </span>
                                @if (subtask.streak && subtask.streak >= 3) {
                                    <span class="material-symbols-outlined text-sage text-xs">local_fire_department</span>
                                }
                            </div>
                        </div>
                    </div>
                }
            </div>

            <!-- Subtask Summary -->
            <div class="mt-6 pt-6 border-t border-taupe/10">
                <div class="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p class="text-2xl font-bold text-charcoal">{{ completedCount() }}</p>
                        <p class="text-xs text-taupe uppercase tracking-wider">Completed</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-charcoal">{{ pendingCount() }}</p>
                        <p class="text-xs text-taupe uppercase tracking-wider">Pending</p>
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-sage">{{ subtaskCompletionRate() }}%</p>
                        <p class="text-xs text-taupe uppercase tracking-wider">Adherence</p>
                    </div>
                </div>
            </div>
        }
    </div>
    `,
    styles: [`
        :host { display: block; }
    `]
})
export class SubtaskMatrixComponent {
    habit = input.required<Habit>();
    date = input.required<string>();
    habitService = inject(HabitService);

    subtasks = computed(() => this.habit().subtasks ?? []);

    completedCount = computed(() => this.subtasks().filter(s => s.completedToday).length);
    pendingCount = computed(() => this.subtasks().length - this.completedCount());
    subtaskCompletionRate = computed(() => {
        const total = this.subtasks().length;
        if (total === 0) return 0;
        return Math.round((this.completedCount() / total) * 100);
    });

    toggleSubtaskCompletion(subtask: MicroHabit) {
        const habit = this.habit();
        if (!habit.subtasks) return;

        this.habitService.toggleSubtask(habit.id, subtask.id!, this.date()).subscribe({
            error: (err) => console.error('Failed to toggle subtask', err)
        });
    }
}