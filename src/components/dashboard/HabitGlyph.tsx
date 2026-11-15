'use client';

import {
  Smartphone, Gamepad2, Clapperboard, Pizza, Cigarette, Beer, CircleDot, UtensilsCrossed, FlaskConical, LucideIcon,
  Dumbbell, Footprints, GlassWater, BookOpen, Flower2, Moon, GraduationCap, Sprout,
} from 'lucide-react';
import { clsx } from 'clsx';
import { Habit } from '@/types';
import { usePrivacy } from '@/context/PrivacyContext';
import { useApp } from '@/context/AppContext';
import { brandColor, tint } from '@/utils/palette';

// One outline icon family for check-in tiles, instead of mixed colourful emoji. Built-in habits
// have their own icon; custom habits use their category's icon.
const BY_ID: Record<string, LucideIcon> = {
  'social-media': Smartphone,
  gaming: Gamepad2,
  'short-videos': Clapperboard,
  'junk-food': Pizza,
  smoking: Cigarette,
  alcohol: Beer,
};
const BY_CATEGORY: Record<Habit['category'], LucideIcon> = {
  digital: Smartphone,
  food: UtensilsCrossed,
  substance: FlaskConical,
  adult: CircleDot,
  wellness: Sprout,
  other: CircleDot,
};
// Good Habit Templates (habits keep their template's icon after being renamed).
export const TEMPLATE_ICONS: Record<string, LucideIcon> = {
  exercise: Dumbbell,
  walking: Footprints,
  water: GlassWater,
  reading: BookOpen,
  meditation: Flower2,
  sleep: Moon,
  study: GraduationCap,
};

/** Personal habits, and every habit in Hidden Mode, get the same neutral icon so nothing is revealed. */
export function HabitGlyph({ habit, size = 20, className }: { habit: Habit; size?: number; className?: string }) {
  const { masked } = usePrivacy();
  const Icon = masked || habit.category === 'adult'
    ? CircleDot
    : BY_ID[habit.id] ?? (habit.templateId ? TEMPLATE_ICONS[habit.templateId] : undefined) ?? BY_CATEGORY[habit.category] ?? CircleDot;
  return <Icon size={size} strokeWidth={1.75} className={clsx('shrink-0', className)} aria-hidden="true" />;
}

/** The outline icon for a habit known only by id (lists built from analytics). */
export function HabitIconById({ id, size = 18, className }: { id: string; size?: number; className?: string }) {
  const { habits } = useApp();
  const habit = habits.find(h => h.id === id);
  if (!habit) return <CircleDot size={size} strokeWidth={1.75} className={clsx('shrink-0', className)} aria-hidden="true" />;
  return <HabitGlyph habit={habit} size={size} className={className} />;
}

/** A habit's icon in a two-tone tile in its palette colour (neutral in Hidden Mode). */
export function HabitTile({ id, size = 'md', className }: { id: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { habits } = useApp();
  const { masked } = usePrivacy();
  const i = habits.findIndex(h => h.id === id);
  const color = brandColor(habits[i]?.color, Math.max(0, i));
  const box = size === 'lg' ? 'w-12 h-12 rounded-2xl' : size === 'sm' ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl';
  const icon = size === 'lg' ? 22 : size === 'sm' ? 16 : 19;
  return (
    <span className={clsx(box, 'shrink-0 flex items-center justify-center', masked ? 'bg-surface-2 text-ink-2' : 'tint', className)} style={masked ? undefined : tint(color)} aria-hidden="true">
      <HabitIconById id={id} size={icon} />
    </span>
  );
}
