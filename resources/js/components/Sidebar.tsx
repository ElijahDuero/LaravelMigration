import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { User } from '@/types';

interface SidebarProps {
  currentPath: string;
  onClose?: () => void;
}

export default function Sidebar({ currentPath, onClose }: SidebarProps) {
  const { auth } = usePage<{ auth: { user: User } }>().props;
  const user = auth.user;

  // Asset submenu: auto-open when already on hardware/software, otherwise closed by default
  const assetSubDefault = currentPath.startsWith('/hardware') || currentPath.startsWith('/software');
  const [assetOpen, setAssetOpen] = useState(assetSubDefault);

  useEffect(() => {
    if (currentPath.startsWith('/hardware') || currentPath.startsWith('/software')) {
      setAssetOpen(true);
    }
  }, [currentPath]);

  const isActive = (path: string) => currentPath.startsWith(path);
  const navClass = (path: string) =>
    isActive(path)
      ? 'bg-blue-700 text-white border-l-4 border-blue-400'
      : 'text-gray-300 hover:bg-gray-700 hover:text-white';

  const go = () => onClose?.();

  const isSuperAdmin = user.role === 'super_admin';
  const isAdmin = ['super_admin', 'admin'].includes(user.role);
  const canViewAnalytics = ['super_admin', 'admin', 'cyber_security'].includes(user.role);
  const isAssignedRole = ['super_admin', 'admin', 'cyber_security', 'it'].includes(user.role);
  const isUnassigned = !user.role || user.role === 'unassigned';

  const roleLabel =
    {
      super_admin: 'Super Admin',
      admin: 'Admin',
      cyber_security: 'Cyber Security',
      it: 'IT',
      unassigned: 'Unassigned',
      '': 'Unassigned',
    }[user.role] || 'Unassigned';

  // Asset Overview is "active" when on /assets, /hardware, or /software
  const assetParentActive =
    isActive('/assets') || isActive('/hardware') || isActive('/software');

  return (
    <aside className="w-64 max-w-[85vw] h-full max-h-[100dvh] bg-gray-900 text-gray-100 flex flex-col flex-shrink-0 select-none overflow-hidden">
      {/* Logo Header */}
      <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-800 flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <i className="fas fa-shield-halved text-white text-lg sm:text-xl"></i>
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight truncate">CyberSec</h1>
            <p className="text-[11px] sm:text-xs text-gray-400 truncate">Security Portal</p>
          </div>
        </div>
        {isUnassigned && (
          <div className="mt-3 px-2 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded text-xs text-amber-400 text-center flex items-center justify-center">
            <i className="fas fa-lock mr-1.5"></i>Restricted Access
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {(isSuperAdmin || isAdmin || canViewAnalytics || isAssignedRole) && (
          <>
            <Link
              href="/dashboard"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/dashboard')}`}
            >
              <i className="fas fa-chart-pie w-5 h-5 mr-3"></i>
              Dashboard
            </Link>

            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Core Modules</p>
            </div>

            <Link
              href="/incidents"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/incidents')}`}
            >
              <i className="fas fa-triangle-exclamation w-5 h-5 mr-3"></i>
              Incident Reporting
            </Link>

            {/* ── Asset Management section ────────────────────────── */}
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Asset Management</p>
            </div>

            {/* Asset Overview — parent row with hover+click expand */}
            <div
              className="relative"
              onMouseEnter={() => setAssetOpen(true)}
              onMouseLeave={() => {
                // Only auto-close if not on a sub-page
                if (!currentPath.startsWith('/hardware') && !currentPath.startsWith('/software')) {
                  setAssetOpen(false);
                }
              }}
            >
              {/* Parent row: clicking navigates to /assets AND toggles submenu */}
              <div
                className={`flex items-center rounded-lg overflow-hidden transition-all duration-200 ${
                  assetParentActive
                    ? 'bg-blue-700 text-white border-l-4 border-blue-400'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Link
                  href="/assets"
                  onClick={go}
                  className="flex flex-1 items-center px-4 py-3 text-sm font-medium transition-colors"
                >
                  <i className="fas fa-layer-group w-5 h-5 mr-3"></i>
                  Asset Overview
                </Link>
                {/* Chevron toggle button / dropdown indicator */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setAssetOpen((o) => !o);
                  }}
                  className={`self-stretch flex items-center justify-center px-3.5 text-xs transition-colors ${
                    assetParentActive
                      ? 'text-white/80 hover:text-white hover:bg-blue-600'
                      : 'text-gray-400 hover:text-white hover:bg-gray-600'
                  }`}
                  aria-label="Toggle asset submenu"
                  title="Toggle submenu"
                >
                  <i
                    className={`fas fa-chevron-down transition-transform duration-200 ${
                      assetOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              </div>

              {/* Submenu — animates open/close */}
              <div
                className={`overflow-hidden transition-all duration-200 ease-in-out ${
                  assetOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="ml-3 mt-0.5 border-l-2 border-gray-700 pl-2 space-y-0.5">
                  <Link
                    href="/hardware"
                    onClick={go}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/hardware')}`}
                  >
                    <i className="fas fa-microchip w-4 h-4 mr-3 text-[13px]"></i>
                    Hardware Inventory
                  </Link>
                  <Link
                    href="/software"
                    onClick={go}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/software')}`}
                  >
                    <i className="fas fa-box w-4 h-4 mr-3 text-[13px]"></i>
                    Software Inventory
                  </Link>
                </div>
              </div>
            </div>
            {/* ── End Asset submenu ───────────────────────────────── */}

            <Link
              href="/risks"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/risks')}`}
            >
              <i className="fas fa-bullseye w-5 h-5 mr-3"></i>
              Risk Management
            </Link>

            <Link
              href="/branch-security"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/branch-security')}`}
            >
              <i className="fas fa-building-shield w-5 h-5 mr-3"></i>
              Branch Security
            </Link>

            <Link
              href="/threat-intel"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/threat-intel')}`}
            >
              <i className="fas fa-shield-virus w-5 h-5 mr-3"></i>
              Threat Intelligence
            </Link>

            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Management</p>
            </div>

            <Link
              href="/systems"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/systems')}`}
            >
              <i className="fas fa-layer-group w-5 h-5 mr-3"></i>
              Systems Registry
            </Link>

            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">System</p>
            </div>

            <Link
              href="/branches"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/branches')}`}
            >
              <i className="fas fa-building w-5 h-5 mr-3"></i>
              Branches
            </Link>

            {isSuperAdmin && (
              <Link
                href="/users"
                onClick={go}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/users')}`}
              >
                <i className="fas fa-users w-5 h-5 mr-3"></i>
                Users
              </Link>
            )}

            <Link
              href="/reports"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/reports')}`}
            >
              <i className="fas fa-file-lines w-5 h-5 mr-3"></i>
              Reports
            </Link>

            {isAssignedRole && (
              <Link
                href="/data-reports"
                onClick={go}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/data-reports')}`}
              >
                <i className="fas fa-table-list w-5 h-5 mr-3"></i>
                Data Reports
              </Link>
            )}

            {canViewAnalytics && (
              <Link
                href="/analytics"
                onClick={go}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/analytics')}`}
              >
                <i className="fas fa-chart-bar w-5 h-5 mr-3"></i>
                Analytics
              </Link>
            )}

            {isAssignedRole && (
              <Link
                href="/posture"
                onClick={go}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/posture')}`}
              >
                <i className="fas fa-shield-halved w-5 h-5 mr-3"></i>
                Security Posture
              </Link>
            )}

            {isSuperAdmin && (
              <Link
                href="/notifications"
                onClick={go}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/notifications')}`}
              >
                <i className="fas fa-bell w-5 h-5 mr-3"></i>
                Notifications
              </Link>
            )}

            {isAdmin && (
              <Link
                href="/settings"
                onClick={go}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentPath === '/settings' || currentPath.startsWith('/settings?')
                    ? 'bg-blue-700 text-white border-l-4 border-blue-400'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <i className="fas fa-gear w-5 h-5 mr-3"></i>
                Settings
              </Link>
            )}
          </>
        )}

        {isUnassigned && (
          <>
            <Link
              href="/dashboard"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/dashboard')}`}
            >
              <i className="fas fa-chart-pie w-5 h-5 mr-3"></i>
              Dashboard
            </Link>

            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</p>
            </div>

            <Link
              href="/incidents"
              onClick={go}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${navClass('/incidents')}`}
            >
              <i className="fas fa-triangle-exclamation w-5 h-5 mr-3"></i>
              Incident Reporting
            </Link>
          </>
        )}
      </nav>

      {/* User Footer */}
      <div className="px-4 py-3 sm:py-4 border-t border-gray-800 flex-shrink-0 bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
            alt="User"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-white truncate">{user.name}</p>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate">{roleLabel}</p>
          </div>
          <Link
            href="/logout"
            method="post"
            as="button"
            onClick={go}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-800 transition flex-shrink-0"
            title="Sign Out"
          >
            <i className="fas fa-right-from-bracket"></i>
          </Link>
        </div>
      </div>
    </aside>
  );
}
