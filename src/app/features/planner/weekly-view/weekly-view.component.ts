import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, transferArrayItem, DragDropModule } from '@angular/cdk/drag-drop';

// Data Structures
interface WeeklyTask {
  id: string;
  text: string;
  completed: boolean;
}

interface WeekDay {
  date: Date;
  name: string;
  tasks: WeeklyTask[];
}

@Component({
  selector: 'app-weekly-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div class="h-full flex flex-col font-manrope p-4 gap-6">
      <!-- Header -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex items-center gap-2">
          <button (click)="changeWeek(-1)" class="p-2 hover:bg-black hover:text-white transition-colors rigid-border-sm border-[2px]">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h2 class="text-xl font-black text-black uppercase font-arvo text-center">
            {{ weekDateRange() }}
          </h2>
          <button (click)="changeWeek(1)" class="p-2 hover:bg-black hover:text-white transition-colors rigid-border-sm border-[2px]">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      <div class="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 overflow-hidden">
        <!-- Left Panel: Targets & Metrics -->
        <div class="lg:col-span-1 flex flex-col gap-6">
          <!-- Weekly Targets -->
          <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg flex-1 flex flex-col">
            <h3 class="text-lg font-black text-black uppercase font-arvo border-b-4 border-black pb-2 mb-4">Weekly Targets</h3>
            <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
              @for(target of weeklyTargets(); track target.id) {
                <div class="flex items-center gap-2 group">
                  <input type="checkbox" [checked]="target.completed" (change)="toggleTargetCompletion(target.id)" class="size-4 accent-black"/>
                  <input [(ngModel)]="target.text" (ngModelChange)="saveData()" class="flex-1 bg-transparent border-b-2 border-concrete-300 focus:border-black outline-none text-sm py-1 font-mono uppercase" [class.line-through]="target.completed">
                  <button (click)="deleteTarget(target.id)" class="opacity-0 group-hover:opacity-100 text-red-500">
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              }
            </div>
            <div class="flex gap-2 mt-4">
               <input [(ngModel)]="newTargetText" placeholder="New Target" (keyup.enter)="addTarget()" class="flex-1 px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none uppercase placeholder:text-concrete-300">
               <button (click)="addTarget()" class="px-4 py-2 bg-black text-white rigid-border-sm border-[2px] font-black uppercase text-xs">Add</button>
            </div>
          </div>

          <!-- Weekly Metrics -->
          <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg">
             <h3 class="text-lg font-black text-black uppercase font-arvo border-b-4 border-black pb-2 mb-4">Weekly Metrics</h3>
             <div class="space-y-3">
                <div class="flex justify-between items-center">
                    <span class="text-sm font-bold uppercase">Total Focus Hours</span>
                    <input type="number" [(ngModel)]="metrics().focusHours" (ngModelChange)="saveData()" class="w-20 text-center px-2 py-1 bg-white rigid-border-sm border-[2px] font-mono">
                </div>
                 <div class="flex justify-between items-center">
                    <span class="text-sm font-bold uppercase">Tasks Completed</span>
                    <span class="font-mono font-black text-lg">{{ tasksCompleted() }} / {{ totalTasks() }}</span>
                </div>
                 <div class="flex justify-between items-center">
                    <span class="text-sm font-bold uppercase">Consistency</span>
                    <span class="font-mono font-black text-lg">{{ consistencyScore() | number:'1.0-0' }}%</span>
                </div>
             </div>
          </div>
        </div>

        <!-- Right Panel: Task Distribution -->
        <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto custom-scrollbar" cdkDropListGroup>
           @for(day of weekDays(); track day.date) {
            <div class="bg-white rigid-border-sm border-[2px] p-4 flex flex-col gap-3">
              <h4 class="font-black uppercase text-center border-b-2 border-black pb-2">{{ day.name }} <span class="text-concrete-500 font-mono">{{ day.date | date:'d' }}</span></h4>
              <div class="flex-1 min-h-[150px] space-y-2 overflow-y-auto custom-scrollbar-sm"
                   cdkDropList
                   [cdkDropListData]="day.tasks"
                   (cdkDropListDropped)="drop($event)">
                 @for(task of day.tasks; track task.id) {
                    <div cdkDrag class="p-2 rigid-border border-2 border-black bg-concrete-100 cursor-grab active:cursor-grabbing flex justify-between items-center group">
                       <span class="font-mono text-xs uppercase">{{ task.text }}</span>
                       <button (click)="deleteTask(day, task.id)" class="opacity-0 group-hover:opacity-100 text-red-500">
                         <span class="material-symbols-outlined text-sm">close</span>
                       </button>
                    </div>
                 }
              </div>
              <input #taskInput (keyup.enter)="addTask(day, taskInput)" placeholder="Add task..." class="w-full mt-auto px-2 py-1 bg-white rigid-border-sm border-[2px] font-mono text-sm outline-none">
            </div>
           }
        </div>
      </div>
      
       <!-- Weekly Review Section -->
        <div class="bg-white rigid-border border-[4px] p-6 brutalist-shadow-lg">
          <h3 class="text-lg font-black text-black uppercase font-arvo border-b-4 border-black pb-2 mb-4">Weekly Review</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <textarea [(ngModel)]="review().achieved" (ngModelChange)="saveData()" placeholder="Achieved?" rows="3" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [(ngModel)]="review().missed" (ngModelChange)="saveData()" placeholder="Missed?" rows="3" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [(ngModel)]="review().why" (ngModelChange)="saveData()" placeholder="Why?" rows="3" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
             <textarea [(ngModel)]="review().carryForward" (ngModelChange)="saveData()" placeholder="Carry forward?" rows="3" class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] focus:bg-concrete-100 text-black font-mono text-sm outline-none resize-none uppercase placeholder:text-concrete-300"></textarea>
          </div>
        </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
    .custom-scrollbar-sm::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar-sm::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar-sm::-webkit-scrollbar-thumb { background: #ccc; }
    .cdk-drag-placeholder {
      opacity: 0.2;
      background: #eab308;
      border: 2px dashed black;
    }
    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }
  `]
})
export class WeeklyViewComponent implements OnInit {
  currentDate = signal(new Date());

  weekDays = signal<WeekDay[]>([]);
  weeklyTargets = signal<WeeklyTask[]>([]);
  review = signal({ achieved: '', missed: '', why: '', carryForward: '' });
  metrics = signal({ focusHours: 0 });

  newTargetText = '';

  private readonly DATA_KEY_PREFIX = 'weekly_data_';

  ngOnInit() {
    this.generateWeekDays(this.currentDate());
    this.loadData();
  }
  
  generateWeekDays(date: Date) {
      const startOfWeek = this.getStartOfWeek(date);
      const days: WeekDay[] = [];
      for (let i = 0; i < 7; i++) {
          const dayDate = new Date(startOfWeek);
          dayDate.setDate(dayDate.getDate() + i);
          days.push({
              date: dayDate,
              name: dayDate.toLocaleDateString('en-US', { weekday: 'long' }),
              tasks: []
          });
      }
      this.weekDays.set(days);
  }

  loadData() {
      const key = this.getStorageKey(this.weekDays()[0].date);
      const data = JSON.parse(localStorage.getItem(key) || '{}');
      
      this.weeklyTargets.set(data.targets || []);
      this.review.set(data.review || { achieved: '', missed: '', why: '', carryForward: '' });
      this.metrics.set(data.metrics || { focusHours: 0 });

      // Merge tasks into weekdays
      this.weekDays.update(days => {
          if (data.tasks) {
              return days.map((day, index) => ({
                  ...day,
                  tasks: data.tasks[index] || []
              }));
          }
          return days;
      });
  }

  saveData() {
      const key = this.getStorageKey(this.weekDays()[0].date);
      const data = {
          targets: this.weeklyTargets(),
          tasks: this.weekDays().map(d => d.tasks),
          review: this.review(),
          metrics: this.metrics()
      };
      localStorage.setItem(key, JSON.stringify(data));
  }

  getStartOfWeek(date: Date): Date {
      const d = new Date(date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to make Monday the first day
      return new Date(d.setDate(diff));
  }
  
  getStorageKey(date: Date): string {
    const d = this.getStartOfWeek(date);
    return `${this.DATA_KEY_PREFIX}${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  changeWeek(delta: number) {
      const newDate = new Date(this.currentDate());
      newDate.setDate(newDate.getDate() + (delta * 7));
      this.currentDate.set(newDate);
      this.generateWeekDays(newDate);
      this.loadData();
  }

  weekDateRange = computed(() => {
    const days = this.weekDays();
    if (days.length === 0) return '';
    const start = days[0].date;
    const end = days[days.length - 1].date;
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  });

  // Target Methods
  addTarget() {
      if (!this.newTargetText.trim()) return;
      this.weeklyTargets.update(t => [...t, {id: Date.now().toString(), text: this.newTargetText, completed: false}]);
      this.newTargetText = '';
      this.saveData();
  }

  toggleTargetCompletion(id: string) {
      this.weeklyTargets.update(targets => targets.map(t => t.id === id ? {...t, completed: !t.completed} : t));
      this.saveData();
  }
  
  deleteTarget(id: string) {
      this.weeklyTargets.update(targets => targets.filter(t => t.id !== id));
      this.saveData();
  }

  // Task Methods
  addTask(day: WeekDay, input: HTMLInputElement) {
      if (!input.value.trim()) return;
      day.tasks.push({ id: Date.now().toString(), text: input.value, completed: false });
      input.value = '';
      this.saveData();
  }
  
  deleteTask(day: WeekDay, taskId: string) {
    day.tasks = day.tasks.filter(t => t.id !== taskId);
    this.saveData();
  }

  drop(event: CdkDragDrop<WeeklyTask[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex,
      );
    }
    this.saveData();
  }

  // Computed Metrics
  tasksCompleted = computed(() => this.weekDays().reduce((sum, day) => sum + day.tasks.filter(t => t.completed).length, 0));
  totalTasks = computed(() => this.weekDays().reduce((sum, day) => sum + day.tasks.length, 0));
  consistencyScore = computed(() => {
      const total = this.totalTasks();
      return total === 0 ? 0 : (this.tasksCompleted() / total) * 100;
  });
}
