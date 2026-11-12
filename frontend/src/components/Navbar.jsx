import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Plus, TrendingUp, User, LogOut } from 'lucide-react';
import Button from './ui/Button';

const navItems = [
  { path: '/', label: 'Today', icon: Home },
  { path: '/food', label: 'Add', icon: Plus },
  { path: '/progress', label: 'Progress', icon: TrendingUp },
  { path: '/profile', label: 'Profile', icon: User },
];

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <nav className="bg-white shadow-md border-b border-neutral-200">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <svg viewBox="0 0 32 32" aria-hidden="true" className="h-9 w-9">
                <rect width="32" height="32" rx="8" className="fill-brand-600" />
                <path d="M9 12v8M23 12v8M6 14v4M26 14v4M9 16h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </svg>
              <span className="text-title text-neutral-800">
                Fit Boo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`
                      flex items-center space-x-2 px-4 py-2 rounded-lg transition-all
                      ${isActive(item.path)
                        ? 'bg-brand-100 text-brand-700'
                        : 'text-neutral-600 hover:bg-neutral-100'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Desktop user menu */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="font-medium text-neutral-600">
                {user?.first_name || user?.email?.split('@')[0] || ''}
              </span>
              <Button variant="ghost" onClick={handleLogout} size="sm">
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile: logout only; navigation is the bottom bar */}
            <button
              type="button"
              aria-label="Logout"
              onClick={handleLogout}
              className="md:hidden flex h-11 w-11 items-center justify-center rounded-lg text-neutral-600 hover:bg-neutral-100"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile bottom navigation: 4 items */}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              aria-current={isActive(item.path) ? 'page' : undefined}
              className={`flex min-h-[56px] min-w-[64px] flex-1 flex-col items-center justify-center gap-1 text-caption ${
                isActive(item.path) ? 'text-brand-700 font-semibold' : 'text-neutral-600'
              }`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default Navbar;
