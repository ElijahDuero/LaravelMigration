import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { usePage } from '@inertiajs/react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { Head } from '@inertiajs/react';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export default function AppLayout({ children, title, subtitle }: AppLayoutProps) {
  const { url } = usePage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Hover-strip: open on mouse-enter left edge, close on mouse-leave sidebar
  const hoverTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onStripEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setSidebarOpen(true);
  }, []);

  const onSidebarLeave = useCallback(() => {
    hoverTimeout.current = setTimeout(() => setSidebarOpen(false), 120);
  }, []);

  const onSidebarEnter = useCallback(() => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
  }, []);

  useEffect(() => {
    // Apply theme on mount based on saved preference
    const cookieMatch = document.cookie.match(/theme=([^;]+)/);
    const savedTheme = cookieMatch ? cookieMatch[1] : 'light';
    const root = document.documentElement;

    root.classList.remove('dark', 'blackorange');
    root.removeAttribute('data-theme');

    if (savedTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (savedTheme === 'blackorange') {
      root.classList.add('blackorange');
      root.setAttribute('data-theme', 'blackorange');
    } else {
      root.setAttribute('data-theme', 'light');
    }
  }, []);

  return (
    <>
      <Head>
        <title>{title ? `${title} | CyberSec Portal` : 'CyberSec Portal'}</title>
        <link rel="icon" type="image/png" href="/shield.png" />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
        <link rel="stylesheet" href="/css/custom.css" />
      </Head>

      <div className="flex h-screen overflow-hidden">

        {/* ── Hover trigger strip — invisible 12 px zone on left edge ─── */}
        <div
          className="fixed top-0 left-0 h-full w-3 z-40 cursor-pointer"
          onMouseEnter={onStripEnter}
        />

        {/* ── Backdrop ──────────────────────────────────────────────────── */}
        <div
          onClick={() => setSidebarOpen(false)}
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
            sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* ── Sidebar overlay ───────────────────────────────────────────── */}
        <div
          onMouseEnter={onSidebarEnter}
          onMouseLeave={onSidebarLeave}
          style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
          className="fixed top-0 left-0 h-full h-[100dvh] max-w-[85vw] z-50 transition-transform duration-200 ease-out shadow-2xl flex"
        >
          <Sidebar currentPath={url} onClose={() => setSidebarOpen(false)} />
        </div>

        {/* ── Main content (full width — no permanent sidebar) ──────────── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar
            title={title}
            subtitle={subtitle}
            onMenuToggle={() => setSidebarOpen(prev => !prev)}
          />

          <main className="flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-slate-900 transition-colors">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

