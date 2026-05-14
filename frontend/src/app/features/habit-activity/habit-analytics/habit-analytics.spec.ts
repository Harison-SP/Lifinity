import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HabitAnalytics } from './habit-analytics';

describe('HabitAnalytics', () => {
  let component: HabitAnalytics;
  let fixture: ComponentFixture<HabitAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HabitAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HabitAnalytics);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
