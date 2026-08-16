import { UserProfile } from '../types';

export const BADGE_DEFINITIONS = {
  'first_mastery': {
    id: 'first_mastery',
    name: 'First Mastery',
    icon: 'Star',
    color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    description: 'Mastered your first topic'
  },
  'perfect_score': {
    id: 'perfect_score',
    name: 'Perfect Score',
    icon: 'Target',
    color: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800/50',
    description: 'Got a perfect score in a Lightning Round'
  },
  'streak_3': {
    id: 'streak_3',
    name: '3-Day Streak',
    icon: 'Flame',
    color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/50',
    description: 'Maintained a 3-day study streak'
  },
  'streak_7': {
    id: 'streak_7',
    name: '7-Day Streak',
    icon: 'Zap',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800/50',
    description: 'Maintained a 7-day study streak'
  },
  'focus_master': {
    id: 'focus_master',
    name: 'Focus Master',
    icon: 'Timer',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50',
    description: 'Completed a Pomodoro focus session'
  }
} as const;

export type BadgeId = keyof typeof BADGE_DEFINITIONS;

export function getNewAchievements(
  currentBadges: string[],
  event: { type: 'streak', streakCount: number } | { type: 'mastery' } | { type: 'perfect_score' } | { type: 'focus' }
): string[] {
  const newBadges: string[] = [];
  const hasBadge = (id: string) => currentBadges.includes(id) || newBadges.includes(id);
  
  if (event.type === 'streak') {
    if (event.streakCount >= 3 && !hasBadge('streak_3')) newBadges.push('streak_3');
    if (event.streakCount >= 7 && !hasBadge('streak_7')) newBadges.push('streak_7');
  }
  
  if (event.type === 'mastery' && !hasBadge('first_mastery')) {
    newBadges.push('first_mastery');
  }
  
  if (event.type === 'perfect_score' && !hasBadge('perfect_score')) {
    newBadges.push('perfect_score');
  }

  if (event.type === 'focus' && !hasBadge('focus_master')) {
    newBadges.push('focus_master');
  }
  
  return newBadges;
}
