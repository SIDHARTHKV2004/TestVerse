import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import ActiveTodayIndicator from './ActiveTodayIndicator';
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
        <header className="bg-white border-b border-[#E2E8F0] px-4 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
          {/* Left - Menu Button (Mobile) */}
          <button
              onClick={onMenuClick}
              className="lg:hidden text-[#64748B] hover:text-[#0F172A] p-1 rounded-md transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Center - Page Title (optional) */}
          <div className="flex-1 lg:flex-none">
            <h1 className="text-base font-bold text-[#0F172A] hidden lg:block tracking-tight">TestVerse</h1>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] border border-[#E2E8F0] transition-colors"
                title="Toggle Theme"
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            {/* Active Today Indicator */}
            <ActiveTodayIndicator />

            {/* Notifications */}
            <NotificationBell />

            {/* User Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg hover:bg-[#F8FAFC] border border-transparent hover:border-[#E2E8F0] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#0062E0] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {userInitial}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-[#0F172A]">{user?.name || 'User'}</p>
                  <p className="text-xs text-[#64748B] capitalize">{user?.role?.toLowerCase() || 'Role'}</p>
                </div>
                <ChevronDown
                    size={15}
                    className={`text-[#64748B] transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl py-1 z-50">
                    <div className="px-4 py-3 border-b border-[#F1F5F9]">
                      <p className="text-sm font-semibold text-[#0F172A]">{user?.name || 'User'}</p>
                      <p className="text-xs text-[#64748B] truncate">{user?.email || 'user@example.com'}</p>
                      <p className="text-xs font-medium text-[#0062E0] mt-1 capitalize">Role: {user?.role?.toLowerCase() || 'N/A'}</p>
                    </div>

                    <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/profile');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                    >
                      <User size={16} className="text-[#64748B]" />
                      <span>Profile</span>
                    </button>

                    <button
                        onClick={() => {
                          setIsDropdownOpen(false);
                          navigate('/settings');
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                    >
                      <Settings size={16} className="text-[#64748B]" />
                      <span>Settings</span>
                    </button>

                    <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                      <button
                          onClick={handleLogoutClick}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div className="text-center">
                  <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4 border border-red-100">
                    <LogOut size={28} className="text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-[#0F172A] mb-2">Confirm Logout</h3>
                  <p className="text-[#64748B] text-sm mb-6">
                    Are you sure you want to logout?
                  </p>
                  <div className="flex gap-3">
                    <button
                        onClick={handleCancelLogout}
                        className="flex-1 px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded-lg transition-colors border border-[#CBD5E1] font-medium text-sm"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={handleConfirmLogout}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  );
};