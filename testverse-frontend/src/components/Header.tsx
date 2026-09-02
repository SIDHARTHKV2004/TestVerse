import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Moon,
  Sun,
  Menu
} from 'lucide-react';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { user, logout, theme, toggleTheme } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const userInitial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
      <>
        <header className="bg-[#0a0a0a] border-b border-[#1a1a1a] px-4 py-3 flex items-center justify-between">
          {/* Left - Menu Button (Mobile) */}
          <button
              onClick={onMenuClick}
              className="lg:hidden text-[#666666] hover:text-white transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Center - Page Title (optional) */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-lg font-semibold text-white hidden lg:block">TestVerse</h1>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#666666] hover:text-white transition-colors"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#ff6b00] flex items-center justify-center text-white font-bold text-sm">
                  {userInitial}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#666666]">{user?.role || 'Role'}</p>
                </div>
                <ChevronDown
                    size={16}
                    className={`text-[#666666] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#111111] border border-[#1a1a1a] rounded-lg shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-[#1a1a1a]">
                      <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#666666]">{user?.email || 'user@example.com'}</p>
                      <p className="text-xs text-[#666666] mt-1">Role: {user?.role || 'N/A'}</p>
                    </div>

                    <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-[#666666] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                    >
                      <User size={16} />
                      <span>Profile</span>
                    </button>

                    <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-[#666666] hover:bg-[#1a1a1a] hover:text-white transition-colors"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>

                    <div className="border-t border-[#1a1a1a] mt-1 pt-1">
                      <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center space-x-3 px-4 py-2.5 text-sm text-red-500 hover:bg-[#1a1a1a] hover:text-red-400 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
              )}
            </div>
          </div>
        </header>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-md w-full mx-4">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                    <LogOut size={32} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Confirm Logout</h3>
                  <p className="text-[#666666] text-sm mb-6">
                    Are you sure you want to logout? You will need to login again to access your account.
                  </p>
                  <div className="flex gap-3">
                    <button
                        onClick={handleCancelLogout}
                        className="flex-1 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors border border-[#2a2a2a]"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={handleConfirmLogout}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Yes, Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  );
};