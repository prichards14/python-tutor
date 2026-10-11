import type { Lesson } from '../types';
import { day1 } from './lessons/day1';
import { day2 } from './lessons/day2';
import { day3 } from './lessons/day3';
import { day4 } from './lessons/day4';
import { day5 } from './lessons/day5';
import { day6 } from './lessons/day6';
import { day7 } from './lessons/day7';
import { day8 } from './lessons/day8';
import { day9 } from './lessons/day9';
import { day10 } from './lessons/day10';
import { day11 } from './lessons/day11';
import { day12 } from './lessons/day12';
import { day13 } from './lessons/day13';
import { day14 } from './lessons/day14';

export const allLessons: Lesson[] = [
  day1,
  day2,
  day3,
  day4,
  day5,
  day6,
  day7,
  day8,
  day9,
  day10,
  day11,
  day12,
  day13,
  day14,
];

export function getLessonByDay(day: number): Lesson | undefined {
  return allLessons.find((l) => l.day === day);
}

export function getAdjacentDays(currentDay: number): { prevDay: number | null; nextDay: number | null } {
  return {
    prevDay: currentDay > 1 ? currentDay - 1 : null,
    nextDay: currentDay < allLessons.length ? currentDay + 1 : null,
  };
}
