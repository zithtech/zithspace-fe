"use client";

/**
 * WorkspaceNotFoundGuard — says "this workspace does not exist" out loud.
 *
 * Before this, a host naming a workspace nobody owns fell through to the login
 * form. Nothing on that screen says the address is wrong, so the failure looks
 * like a password problem: people retype credentials that were always correct,
 * then email support. The tenant lookup has already failed by the time the form
 * paints — this turns that silent failure into the answer.
 *
 * It fires ONLY when the host actually names a workspace. A brand root
 * (zukvo.localhost:3005, app.zukvo.com) and a bare localhost legitimately carry
 * no tenant, and must keep rendering the login form — which is why the check
 * below asks tenantSlugFromHostname rather than looking at `error` alone. The
 * provider sets an error on those hosts too, and treating that as "not found"
 * would lock everyone out of the front door.
 */

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useTenant, tenantSlugFromHostname } from "@/context/TenantContext";
import { useProduct } from "@/context/ProductContext";
import { marketingUrlFor } from "@/lib/product";

export default function WorkspaceNotFoundGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading, tenantNotFound } = useTenant();
  const { manifest, brand, product } = useProduct();

  // Captured after mount, never read during render: this is a client component
  // but Next still renders it on the server, where `window` does not exist and
  // a direct read would hydrate against markup the server could not produce.
  const [host, setHost] = useState<{ full: string; slug: string | null } | null>(null);

  useEffect(() => {
    setHost({
      full: window.location.host,
      slug: tenantSlugFromHostname(window.location.hostname),
    });
  }, []);

  /**
   * Keyed on `tenantNotFound`, not on `error` and not on a null tenant.
   *
   * Not a null tenant: resolveTenant hands a retired slug back to its current
   * host with a `location.replace` and returns BEFORE setting it, so there is a
   * moment where loading is finished, the tenant is null and nothing is wrong —
   * this screen would flash at someone whose link worked perfectly.
   *
   * Not `error` either: a timeout or a 500 sets one too, and an API outage is
   * not the same claim as "your workspace does not exist".
   */
  const notFound = host?.slug != null && !isLoading && tenantNotFound;

  if (!notFound) return <>{children}</>;

  const marketing = marketingUrlFor(product);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12">
      <div className="w-full max-w-md text-center">
        <Image
          src={brand.mark}
          alt=""
          width={44}
          height={44}
          className="mx-auto mb-8 opacity-90"
        />

        <h1 className="text-2xl font-semibold text-gray-900">
          This workspace doesn&apos;t exist
        </h1>

        <p className="mt-3 text-[15px] leading-relaxed text-gray-600">
          There&apos;s no {manifest.name} workspace at{" "}
          <span className="font-medium text-gray-900 break-all">{host.full}</span>. The
          address may be misspelled, or the workspace may have been renamed.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={`${marketing}/signin?workspace=${encodeURIComponent(host.slug ?? "")}`}
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: brand.accent }}
          >
            Find your workspace
          </a>
          <a
            href={`${marketing}/signup`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-[14px] font-medium text-gray-800 transition-colors hover:border-gray-400"
          >
            Create a new workspace
          </a>
        </div>

        <p className="mt-8 text-[13px] text-gray-500">
          If your team already uses {manifest.name}, ask an admin for the address
          they sign in at.
        </p>
      </div>
    </div>
  );
}
