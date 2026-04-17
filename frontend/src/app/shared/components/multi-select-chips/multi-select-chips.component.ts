import { Component, Output, EventEmitter, signal, computed, HostListener, ElementRef, input } from '@angular/core';

import { FormsModule } from '@angular/forms';

export interface MultiSelectOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-multi-select-chips',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="multi-select-chips">
      <!-- Dropdown Toggle -->
      <div class="relative">
        <button 
          type="button"
          (click)="toggleDropdown()"
          class="w-full px-3 py-2 bg-white rigid-border-sm border-[2px] text-left flex items-center justify-between hover:bg-concrete-100 transition-colors"
        >
          <span class="text-[10px] font-black text-concrete-900 uppercase tracking-widest">
            {{ selectedOptions().length > 0 ? selectedOptions().length + ' selected' : placeholder() }}
          </span>
          <span class="material-symbols-outlined text-sm">
            {{ isOpen() ? 'expand_less' : 'expand_more' }}
          </span>
        </button>

        <!-- Dropdown Menu -->
        @if(isOpen()) {
          <div class="absolute z-20 w-full mt-1 bg-white rigid-border border-[2px] brutalist-shadow-md max-h-60 overflow-y-auto custom-scrollbar">
            @for(option of options(); track option.id) {
              <label class="flex items-center px-3 py-2 hover:bg-concrete-100 cursor-pointer transition-colors border-b border-concrete-200">
                <input 
                  type="checkbox"
                  [checked]="isSelected(option.id)"
                  (change)="toggleOption(option.id)"
                  class="w-4 h-4 rigid-border-sm border-[2px] mr-2 cursor-pointer accent-black"
                />
                <span class="text-sm font-mono text-black">{{ option.name }}</span>
              </label>
            }
            @empty {
              <div class="px-3 py-2 text-sm text-concrete-500 text-center">
                No options available
              </div>
            }
          </div>
        }
      </div>

      <!-- Selected Chips -->
      @if(selectedOptions().length > 0) {
        <div class="flex flex-wrap gap-2 mt-2">
          @for(option of selectedOptions(); track option.id) {
            <div class="inline-flex items-center gap-1 px-2 py-1 bg-black text-white rigid-border-sm border-[2px] text-xs font-mono uppercase">
              <span>{{ option.name }}</span>
              <button 
                type="button"
                (click)="removeOption(option.id)"
                class="hover:bg-white hover:text-black transition-colors p-0.5 rounded-sm"
              >
                <span class="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #e5e5e5; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: black; }
  `]
})
export class MultiSelectChipsComponent {
  options = input<MultiSelectOption[]>([]);
  selectedIds = input<string[]>([]);
  placeholder = input<string>('Select options');
  @Output() selectedIdsChange = new EventEmitter<string[]>();

  isOpen = signal(false);

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  selectedOptions = computed(() => {
    return this.options().filter(opt => this.selectedIds().includes(opt.id));
  });

  toggleDropdown() {
    this.isOpen.update(v => !v);
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleOption(id: string) {
    const currentIds = this.selectedIds();
    const newSelection = this.isSelected(id)
      ? currentIds.filter((sid: string) => sid !== id)
      : [...currentIds, id];
    
    this.selectedIdsChange.emit(newSelection);
  }

  removeOption(id: string) {
    const newSelection = this.selectedIds().filter((sid: string) => sid !== id);
    this.selectedIdsChange.emit(newSelection);
  }
}
