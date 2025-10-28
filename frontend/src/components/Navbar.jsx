import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Utensils, Dumbbell, TrendingUp, User, LogOut, Menu, X } from 'lucide-react';
import Button from './ui/Button';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/food', label: 'Food', icon: Utensils },
    { path: '/exercise', label: 'Exercise', icon: Dumbbell },
    { path: '/progress', label: 'Progress', icon: TrendingUp },
  ];

  const isActive = (path) => location.pathname === path;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="bg-white shadow-md border-b-2 border-primary-blue">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-pink to-primary-blue rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">F+</span>
            </div>
            <span className="text-2xl font-bold text-neutral-800">
              FitTrack<span className="text-primary-pink">+</span>
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
                      ? 'bg-primary-blue text-white'
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

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/profile"
              className="flex items-center space-x-2 px-4 py-2 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-all"
            >
              <User size={20} />
              <span className="font-medium">
                {user?.first_name || user?.email?.split('@')[0] || 'Profile'}
              </span>
            </Link>
            <Button variant="ghost" onClick={handleLogout} size="sm">
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-neutral-200">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center space-x-2 px-4 py-3 rounded-lg transition-all
                      ${isActive(item.path)
                        ? 'bg-primary-blue text-white'
                        : 'text-neutral-600 hover:bg-neutral-100'
                      }
                    `}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-2 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-all"
              >
                <User size={20} />
                <span className="font-medium">Profile</span>
              </Link>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center space-x-2 px-4 py-3 rounded-lg text-neutral-600 hover:bg-neutral-100 transition-all text-left"
              >
                <LogOut size={20} />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

