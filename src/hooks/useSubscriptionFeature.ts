import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

/**
 * Hook to check if current tenant's active subscription entitles a specific feature, page, or child action.
 *
 * @param featureKey The entitlement key (e.g. 'work_proposals_templates' or 'work_lead_bidiq')
 * @param options.exact If true, requires exact match. If false (default), upward/prefix matching is allowed.
 * @returns boolean true if tenant is entitled or unmanaged; false otherwise.
 */
export function useSubscriptionFeature(
  featureKey: string,
  options: { exact?: boolean } = { exact: false }
): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    const granted = user?.subscriptionFeatures ?? [];

    // Unmanaged tenants (no subscription assigned) retain full access
    if (granted.length === 0) {
      return true;
    }

    if (options.exact) {
      return granted.includes(featureKey);
    }

    return granted.some((f) => f === featureKey || f.startsWith(`${featureKey}_`));
  }, [user?.subscriptionFeatures, featureKey, options.exact]);
}

/**
 * Hook to check multiple features (any or all).
 */
export function useSubscriptionFeatures(
  featureKeys: string[],
  matchType: "any" | "all" = "any"
): boolean {
  const { user } = useAuth();

  return useMemo(() => {
    const granted = user?.subscriptionFeatures ?? [];
    if (granted.length === 0) return true;

    const check = (key: string) =>
      granted.some((f) => f === key || f.startsWith(`${key}_`));

    return matchType === "all"
      ? featureKeys.every(check)
      : featureKeys.some(check);
  }, [user?.subscriptionFeatures, featureKeys, matchType]);
}
