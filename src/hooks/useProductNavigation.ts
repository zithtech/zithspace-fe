"use client";

import { useMemo } from "react";
import { useProduct } from "@/context/ProductContext";
import { useAuth } from "@/context/AuthContext";
import {
  EXTRA_ROUTE_CAPABILITIES,
  ModuleConfig,
  NavItem,
  NAVIGATION_CONFIG,
  STANDALONE_PAGES,
  StandalonePage,
  standalonePagesFor,
} from "@/components/layout/navigationConfig";
import { Capability, effectiveCapabilities } from "@/lib/product";

export interface ProductNavigation {
  /** Modules and items reachable here, still subject to permission checks. */
  modules: ModuleConfig[];
  /** Standalone pages reachable here. */
  standalonePages: StandalonePage[];
  /** The effective capability set: surface ∩ tenant. */
  capabilities: ReadonlySet<Capability>;
  /**
   * Path prefixes that exist in the app but are NOT reachable on this surface.
   *
   * This is what makes URL access deny-by-default. Filtering a module out of
   * the nav previously made things MORE permissive, not less: the route guard
   * looked the path up in the filtered list, found nothing, and fell through as
   * allowed — so hiding Payroll removed its guard instead of enforcing it.
   * Listing the excluded prefixes explicitly means "not in the nav" can be
   * distinguished from "not a route at all".
   */
  deniedPrefixes: string[];
}

function isAllowed(capability: Capability | undefined, held: ReadonlySet<Capability>): boolean {
  return !capability || held.has(capability);
}

/** Drop items this surface cannot reach, and any group left empty as a result. */
function pruneItems(items: NavItem[], held: ReadonlySet<Capability>): NavItem[] {
  return items.reduce<NavItem[]>((kept, item) => {
    if (!isAllowed(item.requiredCapability, held)) return kept;

    if (item.children) {
      const children = pruneItems(item.children, held);
      // A group whose every child was removed would render as a heading that
      // expands to nothing.
      if (children.length === 0) return kept;
      kept.push({ ...item, children });
      return kept;
    }

    kept.push(item);
    return kept;
  }, []);
}

/** Every path a subtree can reach, for building the denied list. */
function collectPaths(items: NavItem[], into: string[]): void {
  for (const item of items) {
    if (item.path) into.push(item.path);
    if (item.children) collectPaths(item.children, into);
  }
}

/**
 * The nav, narrowed to what this surface and this tenant can actually reach.
 *
 * Every consumer — MainLayout's route guard, TopNav's chips, SideNav's items —
 * MUST go through this rather than importing NAVIGATION_CONFIG directly. If one
 * reads the raw config, that surface silently regains what was removed.
 *
 * TWO dimensions, both must pass:
 *   SURFACE   what this brand's door offers  (ProductManifest.capabilities)
 *   TENANT    what the customer bought       (user.capabilities from /auth/me)
 *
 * Permission checks run afterwards, in the consumers, and are a separate
 * question: capability is "did this company buy it", permission is "may this
 * person use it".
 */
export function useProductNavigation(): ProductNavigation {
  const { product } = useProduct();
  const { user } = useAuth();

  return useMemo(() => {
    const held = effectiveCapabilities(product, user?.capabilities);

    const modules: ModuleConfig[] = [];
    const deniedPrefixes: string[] = [];

    for (const module of NAVIGATION_CONFIG) {
      if (!isAllowed(module.requiredCapability, held)) {
        // Whole module unreachable — every prefix it owns is denied.
        deniedPrefixes.push(...module.pathPrefixes);
        continue;
      }

      const items = pruneItems(module.items, held);
      if (items.length === 0) {
        deniedPrefixes.push(...module.pathPrefixes);
        continue;
      }

      // Module is reachable, but some items inside it may not be. Deny exactly
      // the paths that were pruned — not the module's prefixes, which the
      // surviving items still need.
      const allPaths: string[] = [];
      const keptPaths: string[] = [];
      collectPaths(module.items, allPaths);
      collectPaths(items, keptPaths);
      const kept = new Set(keptPaths);
      deniedPrefixes.push(...allPaths.filter((p) => !kept.has(p)));

      modules.push({ ...module, items });
    }

    const standalone = standalonePagesFor(held);
    const keptStandalone = new Set(standalone.map((p) => p.path));
    deniedPrefixes.push(
      ...STANDALONE_PAGES.map((p) => p.path).filter((p) => !keptStandalone.has(p))
    );

    // Routes with no nav entry — nothing above would ever deny them.
    deniedPrefixes.push(
      ...EXTRA_ROUTE_CAPABILITIES.filter(([, cap]) => !held.has(cap)).map(([path]) => path)
    );

    return {
      modules,
      standalonePages: standalone,
      capabilities: held,
      // Longest first so the most specific denial is reported when several match.
      deniedPrefixes: [...new Set(deniedPrefixes)].sort((a, b) => b.length - a.length),
    };
  }, [product, user?.capabilities]);
}
