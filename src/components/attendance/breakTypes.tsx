import React from 'react';
import {
  Sunrise,
  Coffee,
  Utensils,
  Sunset,
  ShieldCheck,
  Moon,
  User,
  Users,
  MoreHorizontal,
} from 'lucide-react';

// Catalog of break reasons shown in the Pause picker. `value` is the stored
// machine string; `reasonHint` flags types that invite an optional note.
export interface BreakType {
  value: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  reasonHint?: boolean;
}

export const BREAK_TYPES: BreakType[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <Sunrise size={20} />, color: '#F59E0B' },
  { value: 'morning_tea', label: 'Morning Tea Break', icon: <Coffee size={20} />, color: '#10B981' },
  { value: 'lunch', label: 'Lunch', icon: <Utensils size={20} />, color: '#3B82F6' },
  { value: 'evening_tea', label: 'Evening Tea Break', icon: <Sunset size={20} />, color: '#8B5CF6' },
  { value: 'coffee', label: 'Coffee Break', icon: <Coffee size={20} />, color: '#14B8A6' },
  { value: 'prayer', label: 'Prayer Break', icon: <Moon size={20} />, color: '#6366F1' },
  { value: 'meeting', label: 'Meeting', icon: <Users size={20} />, color: '#EC4899' },
  { value: 'personal', label: 'Personal', icon: <User size={20} />, color: '#64748B' },
  { value: 'permission', label: 'Permission', icon: <ShieldCheck size={20} />, color: '#EF4444', reasonHint: true },
  { value: 'other', label: 'Other', icon: <MoreHorizontal size={20} />, color: '#94A3B8', reasonHint: true },
];

export function getBreakType(value?: string | null): BreakType | undefined {
  if (!value) return undefined;
  return BREAK_TYPES.find((b) => b.value === value);
}

/** Human label for a stored break value (falls back to a titleized string). */
export function breakLabel(value?: string | null): string {
  if (!value) return 'Break';
  const found = getBreakType(value);
  if (found) return found.label;
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** 10% tint of a hex colour for chip backgrounds. */
export const tintOf = (hex: string) => `${hex}1A`;
