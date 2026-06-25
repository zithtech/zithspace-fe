'use client';

import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { UserRoundCog } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { ONBOARDING_NAV_ITEMS, canAccessOnboardingItem } from '@/components/onboarding/navItems';

// Shared master-detail shell for every /onboarding/* route. The left rail is
// rendered here once; sub-route pages render into {children}. Active state is
// derived from the URL (not local state), and items are filtered by permission.
// Mirrors the Leaves 2.0 layout.
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;

  const visibleItems = useMemo(
    () => ONBOARDING_NAV_ITEMS.filter((item) => canAccessOnboardingItem(perms, item)),
    [perms]
  );

  // Base guard: must be able to read or create onboarding at all.
  useEffect(() => {
    if (!isLoading && !perms.canReadOnboarding && !perms.canCreateOnboarding) {
      router.push('/dashboard');
    }
  }, [isLoading, perms.canReadOnboarding, perms.canCreateOnboarding, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="ob-shell">
          {/* ============================ SIDEBAR ============================ */}
          <aside className="ob-sidebar">
            <div className="ob-side-head">
              <div className="ob-side-logo"><UserRoundCog size={22} /></div>
              <div className="ob-side-head-text">
                <div className="ob-side-title">Onboarding</div>
                <div className="ob-side-subtitle">Employees · setup</div>
              </div>
            </div>

            <div className="ob-side-scroll">
              <div className="ob-side-section-label">Pages</div>
              <div className="ob-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`ob-view-item ${active ? 'is-active' : ''}`}
                    >
                      <span
                        className="ob-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="ob-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* ============================ MAIN ============================ */}
          <main className="ob-main">
            <div className="ob-content">{children}</div>
          </main>
        </div>

        <style jsx global>{`
          .ob-shell {
            display: flex;
            margin: 0 -8px;
            min-height: calc(100vh - 64px);
            background: var(--bg-pure-white);
          }
          /* ---------------- Sidebar ---------------- */
          .ob-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 14px 14px 0;
            position: sticky;
            top: 0;
            height: calc(100vh - 54px);
          }
          .ob-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .ob-side-logo { flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900); }
          .ob-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .ob-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .ob-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .ob-side-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px; }
          .ob-side-scroll::-webkit-scrollbar { width: 5px; }
          .ob-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .ob-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .ob-side-scroll > .ob-side-section-label:first-child { margin-top: 6px; }
          .ob-side-list { display: flex; flex-direction: column; gap: 1px; }
          .ob-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 8px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left;
            text-decoration: none;
          }
          .ob-view-item:hover { background: var(--bg-slate-50); }
          .ob-view-item.is-active { background: var(--bg-blue-50); }
          .ob-view-item.is-active .ob-view-label { color: var(--text-slate-900); font-weight: 600; }
          .ob-view-icon { width: 16px; display: inline-flex; justify-content: center; align-items: center; }
          .ob-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          /* ---------------- Main ---------------- */
          .ob-main { flex: 1; min-width: 0; padding: 8px 18px 0; display: flex; flex-direction: column; }
          .ob-content { flex: 1; min-height: 0; padding: 4px 4px 0; display: flex; flex-direction: column; }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
