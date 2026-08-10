'use client';

import { useCallback, useEffect, useState } from 'react';
import HotspotCirculationService, {
  BUILT_IN_CATEGORIES,
  CirculationCategoryItem,
} from '@/services/hotspotCirculationService';

/**
 * The circulation category catalog: the six built-ins plus whatever this tenant
 * has added, each with its live post count.
 *
 * Owned by the board and passed down, so the feed's filter chips and the
 * composer's picker are always the same list — a category created in the
 * composer shows up as a filter without a second round trip.
 *
 * It starts from the built-ins rather than an empty array: the picker is usable
 * on first paint, and a failed fetch degrades to "you can still post under a
 * built-in category" instead of a category-less form.
 */
const FALLBACK: CirculationCategoryItem[] = BUILT_IN_CATEGORIES.map((key) => ({
  key,
  label: key,
  isBuiltIn: true,
  id: null,
  postCount: 0,
}));

export function useCirculationCategories() {
  const [categories, setCategories] = useState<CirculationCategoryItem[]>(FALLBACK);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const items = await HotspotCirculationService.listCategories();
      if (items.length) setCategories(items);
    } catch {
      // Keep the built-ins already in state — the composer stays usable.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { categories, loading, reload };
}
