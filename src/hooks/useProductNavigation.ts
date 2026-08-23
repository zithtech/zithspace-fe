"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  EXTRA_ROUTE_FEATURES,
  ModuleConfig,
  NavItem,
  NAVIGATION_CONFIG,
  STANDALONE_PAGES,
  StandalonePage,
} from "@/components/layout/navigationConfig";

export interface ProductNavigation {
  /** Modules and items this tenant's plan includes, before permission checks. */
  modules: ModuleConfig[];
  /** Standalone pages this tenant's plan includes. */
  standalonePages: StandalonePage[];
  /**
   * Path prefixes that exist in the app but are NOT included in this plan.
   *
   * This is what makes URL access deny-by-default. Filtering a module out of
   * the nav would otherwise make things MORE permissive, not less: the route
   * guard looks the path up in the filtered list, finds nothing, and falls
   * through as allowed — so hiding Payroll would remove its guard instead of
   * enforcing it. Listing the excluded prefixes explicitly is what lets "not in
   * the nav" be told apart from "not a route at all".
   */
  deniedPrefixes: string[];
}

/**
 * Does the granted set satisfy this requirement?
 *
 * UPWARD ONLY: an exact match, or a granted DESCENDANT. Holding
 * hrms_leaves_v2 satisfies a requirement of hrms.
 *
 * Deliberately NOT the reverse. A product holds CORE rows (work, admin, home)
 * purely as nav containers while selling only some modules beneath them, so
 * treating a container as a grant showed Testiez every Work item it does not
 * sell — Proposals, Leads, BidIq, Squads, Timesheet, Daily Updates.
 *
 * Mirrors satisfies() on the API. Safe for existing plans: Zukvo plans grant
 * only leaf FEATURE rows, never parents, so this direction never fired for
 * them — verified identical across all seven.
 */
function satisfies(granted: readonly string[], required: readonly string[]): boolean {
  return required.some((r) =>
    granted.some((f) => f === r || f.startsWith(`${r}_`)),
  );
}

/** Drop items the plan does not include, and any group left empty as a result. */
function pruneItems(items: NavItem[], granted: readonly string[]): NavItem[] {
  return items.reduce<NavItem[]>((kept, item) => {
    if (item.requiredSubscriptionFeature && !satisfies(granted, item.requiredSubscriptionFeature)) {
      return kept;
    }

    if (item.children) {
      const children = pruneItems(item.children, granted);
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
 * The nav, narrowed to what this tenant's plan actually includes.
 *
 * Every consumer — MainLayout's route guard, TopNav's chips, SideNav's items —
 * MUST go through this rather than importing NAVIGATION_CONFIG directly. If one
 * reads the raw config, that surface silently regains what was removed.
 *
 * ONE SOURCE, NOT TWO. Membership comes from `subscriptionFeatures`, resolved
 * by the admin control plane and already scoped to the product this request
 * came through. There is deliberately no second, hand-written product→feature
 * map on the client: that is data somebody edits in the admin, not something
 * to redeploy.
 *
 * WHICH BRAND DOOR a tenant may enter is a separate question, answered earlier
 * and elsewhere — the tenant-resolve endpoints 404 a tenant that does not hold
 * the product for the host it arrived on, so the app never loads at all.
 *
 * NO FEATURES MEANS UNMANAGED, NOT ENTITLED TO NOTHING. A tenant with no
 * subscription, or a session predating this, sees everything — the same rule
 * the API applies, so the nav and the API cannot disagree. Permission checks
 * still run afterwards in the consumers.
 */
export function useProductNavigation(): ProductNavigation {
  const { user } = useAuth();

  return useMemo(() => {
    const granted = user?.subscriptionFeatures ?? [];
    const unmanaged = granted.length === 0;

    const modules: ModuleConfig[] = [];
    const deniedPrefixes: string[] = [];

    for (const module of NAVIGATION_CONFIG) {
      const moduleAllowed =
        unmanaged ||
        !module.requiredSubscriptionFeature ||
        satisfies(granted, module.requiredSubscriptionFeature);

      if (!moduleAllowed) {
        deniedPrefixes.push(...module.pathPrefixes);
        continue;
      }

      const items = unmanaged ? module.items : pruneItems(module.items, granted);
      if (items.length === 0) {
        deniedPrefixes.push(...module.pathPrefixes);
        continue;
      }

      // Module is included, but some items inside it may not be. Deny exactly
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

    const standalonePages = unmanaged
      ? STANDALONE_PAGES
      : STANDALONE_PAGES.filter(
          (p) => !p.requiredSubscriptionFeature || satisfies(granted, p.requiredSubscriptionFeature),
        );
    const keptStandalone = new Set(standalonePages.map((p) => p.path));
    deniedPrefixes.push(
      ...STANDALONE_PAGES.map((p) => p.path).filter((p) => !keptStandalone.has(p)),
    );

    // Routes with no nav entry — nothing above would ever deny them.
    if (!unmanaged) {
      deniedPrefixes.push(
        ...EXTRA_ROUTE_FEATURES.filter(([, feature]) => !satisfies(granted, [feature])).map(
          ([path]) => path,
        ),
      );
    }

    return {
      modules,
      standalonePages,
      // Longest first so the most specific denial is reported when several match.
      deniedPrefixes: [...new Set(deniedPrefixes)].sort((a, b) => b.length - a.length),
    };
  }, [user?.subscriptionFeatures]);
}
