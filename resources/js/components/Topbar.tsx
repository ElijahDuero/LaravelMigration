import { Link, usePage } from '@inertiajs/react';
import { User } from '@/types';
import { useState, useEffect } from 'react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Topbar({ title = 'Dashboard', subtitle, onMenuToggle }: TopbarProps) {
  const { auth } = usePage<{ auth: { user: User } }>().props;
  const user = auth.user;

  const [theme, setTheme] = useState<'light' | 'dark' | 'blackorange'>('light');

  useEffect(() => {
    // Read theme from cookie or localStorage on mount
    const cookieMatch = document.cookie.match(/theme=([^;]+)/);
    const savedTheme = cookieMatch ? cookieMatch[1] : 'light';
    setTheme(savedTheme as 'light' | 'dark' | 'blackorange');
    applyTheme(savedTheme as 'light' | 'dark' | 'blackorange');
  }, []);

  const applyTheme = (newTheme: 'light' | 'dark' | 'blackorange') => {
    const root = document.documentElement;
    root.classList.remove('dark', 'blackorange');
    root.removeAttribute('data-theme');

    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else if (newTheme === 'blackorange') {
      root.classList.add('blackorange');
      root.setAttribute('data-theme', 'blackorange');
    } else {
      root.setAttribute('data-theme', 'light');
    }

    // Save to cookie
    document.cookie = `theme=${newTheme}; path=/; max-age=31536000`;
  };

  const cycleTheme = () => {
    const nextTheme =
      theme === 'light' ? 'dark' : theme === 'dark' ? 'blackorange' : 'light';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <header className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between flex-shrink-0 transition-colors">
      {/* Title Section — click to open sidebar */}
      <div className="flex items-center space-x-4">
        <button
          type="button"
          onClick={onMenuToggle}
          className="flex items-center gap-3 group select-none"
          title="Open navigation"
        >
          {/* Animated burger bars */}
          <div className="flex flex-col justify-center gap-[5px] w-5">
            <span className="block h-0.5 w-5 bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-200 group-hover:bg-blue-600" />
            <span className="block h-0.5 w-3.5 bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-200 group-hover:bg-blue-600 group-hover:w-5" />
            <span className="block h-0.5 w-5 bg-gray-600 dark:bg-gray-300 rounded-full transition-all duration-200 group-hover:bg-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">
            {title}
          </h2>
        </button>
        {subtitle && <span className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</span>}
      </div>

      {/* Actions Section */}
      <div className="flex items-center space-x-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search..."
            className="w-64 pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-gray-100 dark:placeholder-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"></i>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={cycleTheme}
          className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          title="Cycle theme"
        >
          {theme === 'light' && <i className="fas fa-sun text-lg"></i>}
          {theme === 'dark' && <i className="fas fa-moon text-lg"></i>}
          {theme === 'blackorange' && <i className="fas fa-fire text-lg"></i>}
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <i className="fas fa-bell text-lg"></i>
        </button>

        {/* Messages */}
        <button className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <i className="fas fa-envelope text-lg"></i>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300 dark:bg-slate-600 hidden sm:block"></div>

        {/* User Avatar */}
        <div className="flex items-center space-x-2">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3b82f6&color=fff`}
            alt="User"
            className="w-8 h-8 rounded-full"
          />
          <div className="text-sm hidden sm:block">
            <p className="font-medium text-gray-700 dark:text-gray-200">
              {user.name.split(' ')[0]}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Online</p>
          </div>
        </div>
      </div>
    </header>
  );
}
