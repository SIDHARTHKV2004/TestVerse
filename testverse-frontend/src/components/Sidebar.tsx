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
  Users as TeamIcon,
  CalendarCheck,
  FolderGit2
} from 'lucide-react';

import { useAttention } from '../context/AttentionContext';
import { AttentionDot } from './AttentionDot';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, isAdmin, isMentor, isDeveloper, user } = useAuth();
  const { hasTaskAttention, hasChatAttention } = useAttention();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Check if current user is a DEVELOPER or development MENTOR
  const isDeveloperUser = isDeveloper || user?.role === 'DEVELOPER';
  const isDevelopmentMentor =
    (isMentor || user?.role === 'MENTOR') &&
    Boolean(
      user?.department === 'DEVELOPMENT' ||
      user?.department?.toUpperCase() === 'DEVELOPMENT' ||
      user?.department?.toLowerCase().includes('dev') ||
      user?.email?.toLowerCase().includes('devmentor') ||
      user?.name?.toLowerCase().includes('development') ||
      (user as any)?.track?.toUpperCase() === 'DEVELOPMENT' ||
      (user as any)?.mentorType?.toUpperCase() === 'DEVELOPMENT'
    );
  const isDeveloperSide = isDeveloperUser || isDevelopmentMentor;
  const isTestingSide = user?.role === 'TESTER' || (user?.role === 'MENTOR' && !isDevelopmentMentor);
  const isAdministrator = isAdmin || user?.role === 'ADMIN';

  const showAutomationHub = isAdministrator || isTestingSide;
  const showDeveloperHub = isAdministrator || isDeveloperSide;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/projects', label: 'Projects', icon: ClipboardList },
    { path: '/tasks', label: 'Tasks', icon: ClipboardList },
    { path: '/bugs', label: 'Bug Tracker', icon: Bug },
    { path: '/team', label: 'Team', icon: TeamIcon }, // ✅ Added Team
    { path: '/community', label: 'Community', icon: Users2 },
    { path: '/chat', label: 'Chat', icon: MessageSquare },
    ...(showAutomationHub
      ? [{ path: '/automation', label: 'AutomationHub', icon: Code2 }]
      : []),
    ...(showDeveloperHub
      ? [{ path: '/developer-hub', label: 'Developer Hub', icon: FolderGit2 }]
      : []),
    { path: '/manual-testing', label: 'Manual Testing', icon: BookOpen },
    { path: '/leaderboard', label: 'Leaderboard', icon: Award },
    { path: '/notes', label: 'Notes', icon: StickyNote },
    { path: '/search', label: 'Search', icon: Search },
  ];

  // ✅ Add Attendance page for Admin and Mentor
  if (isAdmin || isMentor) {
    menuItems.push({ path: '/attendance', label: 'Attendance', icon: CalendarCheck });
  }

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
          fixed top-0 left-0 h-full w-64 bg-white border-r border-[#E2E8F0] z-50 shadow-sm
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
          flex flex-col
        `}
        >
          {/* Logo */}
          <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-[#0062E0] to-[#00B388] rounded-lg flex items-center justify-center shadow-sm">
                <Rocket className="w-4 h-4 text-white" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold text-[#0F172A] tracking-tight">TestVerse</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#00B388]" />
              </div>
            </div>
            <button onClick={onClose} className="lg:hidden text-[#64748B] hover:text-[#0F172A] p-1 rounded-md">
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              const showAttention =
                (item.path === '/tasks' && hasTaskAttention) ||
                (item.path === '/chat' && hasChatAttention);

              return (
                  <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path);
                        onClose();
                      }}
                      className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all
                  ${active
                          ? 'bg-[#EFF6FF] text-[#0062E0] font-semibold shadow-sm'
                          : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                      }
                `}
                      title={item.label}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <Icon size={18} className={active ? 'text-[#0062E0]' : 'text-[#64748B]'} />
                      <span className="text-sm font-medium truncate">{item.label}</span>
                    </div>
                    {showAttention && <AttentionDot />}
                  </button>
              );
            })}
          </nav>

          {/* Bottom Section - Profile & Logout */}
          <div className="border-t border-[#E2E8F0] p-3 space-y-1 bg-white">
            {/* Profile Button */}
            <button
                onClick={() => {
                  navigate('/profile');
                  onClose();
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-[#F1F5F9] transition-colors text-[#475569] hover:text-[#0F172A]"
            >
              <div className="w-8 h-8 rounded-full bg-[#EFF6FF] text-[#0062E0] flex items-center justify-center font-bold text-xs">
                <User size={16} />
              </div>
              <span className="text-sm font-medium">Profile</span>
            </button>

            {/* Logout Button */}
            <button
                onClick={handleLogoutClick}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-red-600 hover:text-red-700"
            >
              <LogOut size={17} />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </aside>

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