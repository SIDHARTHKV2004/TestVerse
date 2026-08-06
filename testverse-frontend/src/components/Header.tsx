import React, { useState } from 'react';
import {
  Search,
  Bell,
  Moon,
  Sun,
  UserCheck,
  Flame,
  Award,
  ChevronDown,
  LogOut,
  Shield,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import {
  Task,
  Project,
  CommunityPost,
  BugReport,
  NotificationItem,
  ChatMessage,
  User
} from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onSearch: (query: string) => void;
  onNavigate: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, onNavigate }) => {
  const { user, role, switchRole, logout } = useAuth();
  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    );
  }
  const { isDark, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [bugs, setBugs] = useState<BugReport[]>([]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    onSearch(val);
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#0d131f]/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between transition-colors">

      {/* Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Global search (Tasks, Bugs, Scenarios, Posts, Files)..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100 placeholder-slate-400"
          />
        </div>
      </div>

      {/* Right Action Icons & Role Switcher */}
      <div className="flex items-center space-x-3">

        {/* Role Switcher Pill */}
        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full p-1 text-xs font-medium">
          <button
            onClick={() => switchRole('STUDENT')}
            className={`px-3 py-1 rounded-full flex items-center space-x-1.5 transition-all ${role === 'STUDENT'
              ? 'bg-indigo-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Student View</span>
          </button>
          <button
            onClick={() => switchRole('MENTOR')}
            className={`px-3 py-1 rounded-full flex items-center space-x-1.5 transition-all ${role === 'MENTOR'
              ? 'bg-emerald-600 text-white shadow-sm font-semibold'
              : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Mentor View</span>
          </button>
        </div>

        {/* Student Streak Counter */}
        {role === 'STUDENT' && (
          <div className="flex items-center space-x-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-500 dark:text-amber-400 rounded-full text-xs font-semibold">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{user?.streakDays ?? 12} Days Streak</span>
          </div>
        )}

        {/* Points Badge */}
        <div className="hidden lg:flex items-center space-x-1 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-semibold">
          <Award className="w-4 h-4" />
          <span>{user?.points ?? 1940} pts</span>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Dark / Light Theme"
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-[#0d131f]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center space-x-2">
                  <Bell className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-500/20 text-indigo-400 text-xs px-2 py-0.5 rounded-full font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <button
                  onClick={markAllRead}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map(n => (
                  <div
                    key={n.id}
                    className={`p-3 text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!n.isRead ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                      }`}
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{n.title}</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">{n.message}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{n.createdAt}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={user.avatar}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/50"
            />
            <div className="hidden md:block text-left">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user.name}</div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold capitalize">{user.role}</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 p-2 text-xs">
              <div className="p-2 border-b border-slate-200 dark:border-slate-800 mb-1">
                <div className="font-bold text-slate-800 dark:text-slate-100">{user.name}</div>
                <div className="text-slate-400 truncate">{user.email}</div>
              </div>

              <button
                onClick={() => {
                  onNavigate('profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <UserCheck className="w-4 h-4 text-indigo-500" />
                <span>View Profile</span>
              </button>

              <button
                onClick={() => {
                  const dummyStudent: User = {
                    id: 'student-1',
                    username: 'student',
                    email: 'student@example.com',
                    name: 'Student User',
                    avatar: '',
                    role: 'STUDENT',
                    points: 0,
                    streakDays: 0,
                    bio: ''
                  };
                  const dummyMentor: User = {
                    id: 'mentor-1',
                    username: 'mentor',
                    email: 'mentor@example.com',
                    name: 'Mentor User',
                    avatar: '',
                    role: 'MENTOR',
                    points: 0,
                    streakDays: 0,
                    bio: ''
                  };
                  const activePeer: User = role === 'MENTOR' ? dummyStudent : dummyMentor;
                  switchRole(role === 'MENTOR' ? 'STUDENT' : 'MENTOR');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Switch to {role === 'MENTOR' ? 'Student' : 'Mentor'} Role</span>
              </button>

              <div className="border-t border-slate-200 dark:border-slate-800 my-1"></div>

              <button
                onClick={() => {
                  logout();
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center space-x-2 p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>

    </header>
  );
};
