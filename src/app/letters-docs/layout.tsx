'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, FileCode, FilePlus, Archive, X, Layers } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';

interface NavItem {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  requiredPermission?: boolean;
}

export default function LettersDocsLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, hasPermission, hasAnyPermission } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const perms = usePermission() as unknown as Record<string, any>;
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems: NavItem[] = useMemo(
    () => [
      {
        key: 'templates',
        label: 'Template Management',
        href: '/letters-docs/templates',
        icon: <FileCode size={18} />,
        color: '#3b82f6', // blue-500
        requiredPermission: Boolean(perms.canReadLetterTemplate),
      },
      {
        key: 'generate',
        label: 'Letter Generation',
        href: '/letters-docs/generate',
        icon: <FilePlus size={18} />,
        color: '#3b82f6', // blue-500
        requiredPermission: Boolean(perms.canGenerateLetter),
      },
      {
        key: 'repository',
        label: 'Generated Documents',
        href: '/letters-docs/repository',
        icon: <Archive size={18} />,
        color: '#3b82f6', // blue-500
        requiredPermission: Boolean(perms.canReadLetter),
      },
      {
        key: 'structures',
        label: 'Custom Structures',
        href: '/letters-docs/structures',
        icon: <Layers size={18} />,
        color: '#3b82f6', // blue-500
        requiredPermission: Boolean(perms.canReadLetterTemplate),
      },
    ],
    [perms.canReadLetterTemplate, perms.canGenerateLetter, perms.canReadLetter]
  );

  const visibleItems = useMemo(
    () => navItems.filter((item) => item.requiredPermission !== false),
    [navItems]
  );

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleOpenSidebar = () => setIsMobileOpen(true);
    window.addEventListener('open-letters-sidebar', handleOpenSidebar);
    return () => window.removeEventListener('open-letters-sidebar', handleOpenSidebar);
  }, []);

  useEffect(() => {
    if (!isLoading && !perms.canReadLetterTemplate && !perms.canReadLetter && !perms.canGenerateLetter) {
      router.push('/dashboard');
    }
  }, [isLoading, perms.canReadLetterTemplate, perms.canReadLetter, perms.canGenerateLetter, router]);

  return (
    <ProtectedRoute>
      <MainLayout>
        <div className="lv-shell">
          {isMobileOpen && (
            <div className="lv-sidebar-backdrop" onClick={() => setIsMobileOpen(false)} />
          )}

          <aside className={`lv-sidebar ${isMobileOpen ? 'is-open' : ''}`}>
            <div className="lv-side-head">
              <div className="lv-side-logo">
                <FileText size={24} strokeWidth={1.5} />
              </div>
              <div className="lv-side-head-text">
                <div className="lv-side-title">Letters & Docs</div>
                <div className="lv-side-subtitle">Templates · Generation</div>
              </div>
              <button className="lv-sidebar-close" onClick={() => setIsMobileOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="lv-side-scroll">
              <div className="lv-side-section-label">
                Modules
              </div>
              <div className="lv-side-list">
                {visibleItems.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      className={`lv-view-item ${active ? 'is-active' : ''}`}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <span
                        className="lv-view-icon"
                        style={{ color: active ? item.color : 'var(--text-slate-400)' }}
                      >
                        {item.icon}
                      </span>
                      <span className="lv-view-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div id="letters-docs-sidebar-filters"></div>
            </div>
          </aside>
          <main className="lv-main" style={{ flex: 1, minWidth: 0, minHeight: 0, height: '100%', background: 'var(--bg-pure-white)', overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            <div className="lv-content" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, minWidth: 0 }}>
              {children}
            </div>
          </main>
        </div>

        <style jsx global>{`
          .lv-shell {
            display: flex;
            margin: 0 -8px;
            height: calc(100vh - 64px);
            overflow: hidden;
            background: var(--bg-pure-white);
          }
          .lv-sidebar {
            width: 240px;
            flex-shrink: 0;
            border-right: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            display: flex;
            flex-direction: column;
            padding: 14px 14px 0;
            position: sticky;
            top: 0;
            height: calc(100vh - 64px);
          }
          .lv-side-head {
            display: flex; align-items: center; gap: 12px; padding: 2px 2px 14px; margin-bottom: 6px;
            border-bottom: 1px solid var(--border-slate-100);
          }
          .lv-side-logo {
            flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: var(--text-slate-900);
          }
          .lv-side-head-text { display: flex; flex-direction: column; min-width: 0; }
          .lv-side-title { font-size: 16px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.025em; line-height: 1.1; }
          .lv-side-subtitle {
            font-size: 10.5px; color: var(--text-slate-400); font-weight: 700; margin-top: 4px;
            text-transform: uppercase; letter-spacing: 0.07em;
          }
          .lv-sidebar-close {
            display: none; background: none; border: none; color: var(--text-slate-600); cursor: pointer; margin-left: auto;
          }
          .lv-side-scroll {
            flex: 1; overflow-y: auto; overflow-x: hidden; margin: 0 -5px; padding: 0 5px;
          }
          .lv-side-scroll::-webkit-scrollbar { width: 5px; }
          .lv-side-scroll::-webkit-scrollbar-thumb { background: var(--border-slate-200); border-radius: 3px; }
          .lv-side-section-label {
            font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em;
            color: var(--text-slate-400); padding: 0 8px; margin: 16px 0 6px;
          }
          .lv-side-scroll > .lv-side-section-label:first-child { margin-top: 6px; }
          .lv-side-list { display: flex; flex-direction: column; gap: 1px; }
          .lv-view-item {
            display: flex; align-items: center; gap: 10px; width: 100%;
            padding: 7px 10px; border-radius: 8px; border: none; background: transparent;
            cursor: pointer; transition: background .12s ease; text-align: left; text-decoration: none;
          }
          .lv-view-item:hover { background: var(--bg-slate-50); }
          .lv-view-item.is-active { background: var(--bg-blue-50); }
          .lv-view-item.is-active .lv-view-label { color: var(--text-slate-900); font-weight: 600; }
          .lv-view-icon { font-size: 14px; width: 16px; display: inline-flex; justify-content: center; }
          .lv-view-label { flex: 1; font-size: 13px; font-weight: 500; color: var(--text-slate-700); }
          @media (max-width: 1024px) {
            .lv-sidebar {
              position: fixed;
              left: -280px;
              top: 64px;
              height: calc(100vh - 64px);
              box-shadow: 4px 0 24px rgba(0, 0, 0, 0.1);
              transition: left 0.25s ease;
            }
            .lv-sidebar.is-open {
              left: 0;
            }
            .lv-sidebar-close {
              display: block;
            }
            .lv-sidebar-backdrop {
              position: fixed;
              inset: 64px 0 0 0;
              background: rgba(15, 23, 42, 0.4);
              z-index: 15;
            }
          }
          .lv-header {
            display: flex; align-items: center; justify-content: space-between; gap: 16px;
            padding: 12px 28px 14px 28px; border-bottom: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white);
            position: sticky; top: 0; z-index: 30;
          }
          .lv-header-about { display: flex; align-items: center; gap: 12px; min-width: 0; }
          .lv-header-icon {
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: rgba(59,130,246,0.10); color: #3b82f6;
            display: inline-flex; align-items: center; justify-content: center;
          }
          .lv-header-title { font-size: 17px; font-weight: 800; color: var(--text-slate-900); letter-spacing: -0.02em; line-height: 1.15; }
          .lv-header-sub { font-size: 12.5px; color: var(--text-slate-600); margin-top: 2px; }
          .lv-header-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
          .lv-ghost-btn {
            width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border-slate-200);
            background: var(--bg-slate-50); color: var(--text-slate-700); cursor: pointer; font-size: 14px;
            display: inline-flex; align-items: center; justify-content: center;
            margin-right: 8px;
            transition: all 0.2s;
          }
          .lv-ghost-btn:hover { color: #3b82f6; border-color: #bfdbfe; }
          .lv-mobile-menu-btn { display: none; }
          @media (max-width: 1024px) {
            .lv-mobile-menu-btn {
              display: inline-flex; align-items: center; justify-content: center;
              width: 36px; height: 36px; border-radius: 8px; border: 1px solid var(--border-slate-200);
              background: var(--bg-pure-white); color: var(--text-slate-700); cursor: pointer;
            }
          }

          /* Footer + pager for pagination */
          .pp-footer {
            display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
            padding: 0 14px; border-top: 1px solid var(--border-slate-200);
            height: 52px !important;
            box-sizing: border-box;
          }
          .pp-footer--sticky {
            position: sticky; bottom: 0; z-index: 30; margin: 0; padding: 0 28px;
            background: var(--bg-pure-white);
            box-shadow: 0 -4px 14px rgba(15,23,42,0.05);
            height: 52px !important;
            box-sizing: border-box;
          }
          .pp-footer-info { font-size: 12px; color: var(--text-slate-500); }
          .pp-footer-info strong { color: var(--text-slate-700); font-weight: 700; }
          .pp-footer-sel { color: #3b82f6; font-weight: 600; }
          .pp-pager { display: flex; align-items: center; gap: 3px; }
          .pp-pager-btn, .pp-pager-num {
            min-width: 28px; height: 28px; border-radius: 7px; border: 1px solid var(--border-slate-200);
            background: var(--bg-pure-white); color: var(--text-slate-600); cursor: pointer; font-size: 12.5px; font-weight: 600;
          }
          .pp-pager-btn:disabled { opacity: 0.4; cursor: not-allowed; }
          .pp-pager-num.is-active { background: #3b82f6; border-color: #3b82f6; color: #fff; }
          .pp-pagesize { margin-left: 5px; }
          .pp-pagesize .ant-select-selector { border-radius: 7px !important; height: 28px !important; }
        `}</style>
      </MainLayout>
    </ProtectedRoute>
  );
}
