import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Bug,
  Users,
  MessageSquare,
  Bell,
  Users2,
  Rocket,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Code2,
  BookOpen,
  Search,
  Award,
  StickyNote,
  User,
  ChevronDown,
  ChevronRight,
  Users as TeamIcon
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: ClipboardList },
    { path: '/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/bugs', label: 'Bug Tracker', icon: Bug },
    { path: '/team', label: 'Team', icon: TeamIcon }, // ✅ Added Team
    { path: '/community', label: 'Community', icon: Users2 },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    { path: '/automation', label: 'Automation', icon: Code2 },
    { path: '/manual-testing', label: 'Manual Testing', icon: BookOpen },
    { path: '/leaderboard', label: 'Leaderboard', icon: Award },
    { path: '/notes', label: 'Notes', icon: StickyNote },
    { path: '/search', label: 'Search', icon: Search },
  ];

  // ✅ Add Admin Users page only for admin
  if (isAdmin) {
    menuItems.push({ path: '/users', label: 'Users', icon: Users });
  }

  const isActive = (path: string) => location.pathname === path;

  const handleLogoutClick = () => {
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

  return (
      <>
        {/* Mobile Overlay */}
        {isOpen && (
            <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={onClose}
            />
        )}

        {/* Sidebar */}
        <aside
            className={`
          fixed top-0 left-0 h-full w-64 bg-[#0a0a0a] border-r border-[#1a1a1a] z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          flex flex-col
        `}
        >
          {/* Logo */}
          <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-[#ff6b00] rounded-lg flex items-center justify-center">
                <Rocket className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white">TestVerse</span>
            </div>
            <button onClick={onClose} className="lg:hidden text-[#666666] hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                  <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                      className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors
                  ${active
                          ? 'bg-[#ff6b00] text-white'
                          : 'text-[#666666] hover:bg-[#1a1a1a] hover:text-white'
                      }
                `}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </button>
              );
            })}
          </nav>

          {/* Bottom Section - Profile & Logout */}
          <div className="border-t border-[#1a1a1a] p-3 space-y-2">
            {/* Profile Button */}
            <button
                onClick={() => {
                  navigate('/profile');
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-[#666666] hover:text-white"
            >
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
                <User size={16} className="text-[#666666]" />
              </div>
              <span className="text-sm font-medium">Profile</span>
            </button>

            {/* Logout Button */}
            <button
                onClick={handleLogoutClick}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-[#1a1a1a] transition-colors text-red-500 hover:text-red-400"
            >
              <LogOut size={18} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

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