import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ClipboardList,
    FolderKanban,
    Users,
    MessageSquare,
    Bug,
    Rocket,
    ChevronLeft,
    ChevronRight,
    Search,
    Menu,
    Plus,
    UserCog,
    Users as UsersIcon,
    Trophy,
    BookOpen,
    FileSpreadsheet,
    CalendarCheck,
    LogOut,
    FolderGit2
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import ActiveTodayIndicator from './ActiveTodayIndicator';
import { useAttention } from '../context/AttentionContext';
import { AttentionDot } from './AttentionDot';

interface MainLayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (page: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, onNavigate }) => {
    const { user, logout, isAdmin } = useAuth();
    const { hasTaskAttention, hasChatAttention } = useAttention();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isDeveloper = user?.role === 'DEVELOPER';
    const isDevelopmentMentor =
        user?.role === 'MENTOR' &&
        (user?.department === 'DEVELOPMENT' ||
         user?.department?.toUpperCase() === 'DEVELOPMENT' ||
         user?.email?.toLowerCase().includes('devmentor') ||
         user?.name?.toLowerCase().includes('development'));

    const isDeveloperSide = isDeveloper || isDevelopmentMentor;
    const isTestingSide = user?.role === 'TESTER' || (user?.role === 'MENTOR' && !isDevelopmentMentor);
    const isAdministrator = isAdmin || user?.role === 'ADMIN';

    // Role-based Hub Visibility:
    // TESTER & TESTING MENTOR: AutomationHub
    // DEVELOPER & DEVELOPMENT MENTOR: Developer Hub
    // ADMIN: Both AutomationHub and Developer Hub (view/monitoring)
    const showAutomationHub = isAdministrator || isTestingSide;
    const showDeveloperHub = isAdministrator || isDeveloperSide;

    const allMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList, path: '/tasks' },
        { id: 'projects', label: 'Modules', icon: FolderKanban, path: '/projects' },
        { id: 'bugs', label: 'Bug Tracker', icon: Bug, path: '/bugs' },
        { id: 'manual-testing', label: 'Manual Testing', icon: FileSpreadsheet, path: '/manual-testing' },
        ...(showAutomationHub
            ? [{ id: 'automation', label: 'AutomationHub', icon: Rocket, path: '/automation' }]
            : []),
        ...(showDeveloperHub
            ? [{ id: 'developer-hub', label: 'Developer Hub', icon: FolderGit2, path: '/developer-hub' }]
            : []),
        { id: 'community', label: 'Community', icon: Users, path: '/community' },
        { id: 'chat', label: 'Chat', icon: MessageSquare, path: '/chat' },
        { id: 'notes', label: 'Notes & Resources', icon: BookOpen, path: '/notes' },
        { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, path: '/leaderboard' },
        { id: 'team', label: 'My Team', icon: UsersIcon, roles: ['TESTER', 'DEVELOPER'], path: '/team' },
        { id: 'users', label: 'Users', icon: UserCog, roles: ['ADMIN'], path: '/users' },
        { id: 'attendance', label: 'Attendance', icon: CalendarCheck, roles: ['ADMIN', 'MENTOR'], path: '/attendance' },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role || '');
    });

    // ✅ Navigation handler - updates sidebar AND navigates
    const handleNavigation = (page: string, path: string) => {
        onNavigate(page);  // Update sidebar highlight
        navigate(path);    // Navigate to the page
    };

    return (
        <div className="flex h-screen bg-[#F8FAFC] text-[#0F172A]">
            {/* Sidebar */}
            <div className={`${collapsed ? 'w-16' : 'w-64'} bg-white border-r border-[#E2E8F0] transition-all duration-300 flex flex-col shadow-sm`}>
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-[#E2E8F0]">
                    {!collapsed && (
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#0062E0] to-[#00B388] rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm">
                                TV
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-base font-bold text-[#0F172A] tracking-tight">TestVerse</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-[#00B388]" />
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#0062E0] to-[#00B388] rounded-lg flex items-center justify-center font-bold text-white text-xs mx-auto shadow-sm">
                            TV
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] p-1 rounded-md transition-colors"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        const showAttention =
                            (item.id === 'tasks' && hasTaskAttention) ||
                            (item.id === 'chat' && hasChatAttention);

                        return (
                            <button
                                key={item.id}
                                onClick={() => handleNavigation(item.id, item.path)}
                                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-[#EFF6FF] text-[#0062E0] font-semibold shadow-sm'
                                        : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                                }`}
                                title={item.label}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="relative flex items-center justify-center">
                                        <Icon size={19} className={isActive ? 'text-[#0062E0]' : 'text-[#64748B]'} />
                                        {collapsed && showAttention && (
                                            <span className="absolute -top-1 -right-1">
                                                <AttentionDot size="sm" />
                                            </span>
                                        )}
                                    </div>
                                    {!collapsed && <span className="text-sm truncate">{item.label}</span>}
                                </div>
                                {!collapsed && showAttention && (
                                    <AttentionDot />
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="border-t border-[#E2E8F0] p-3 bg-white">
                    <button
                        onClick={() => handleNavigation('profile', '/profile')}
                        className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#0062E0] flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-[#0F172A] truncate">{user?.name || 'User'}</div>
                                <div className="text-xs text-[#64748B] capitalize truncate">{user?.role?.toLowerCase() || 'guest'}</div>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
                {/* Top Bar */}
                <header className="bg-white border-b border-[#E2E8F0] px-6 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="lg:hidden text-[#64748B] hover:text-[#0F172A]">
                            <Menu size={22} />
                        </button>
                        <div className="flex items-center gap-2.5 flex-1 max-w-md">
                            <Search size={17} className="text-[#94A3B8]" />
                            <input
                                type="text"
                                placeholder="Search tasks, modules..."
                                className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0062E0] focus:bg-white w-full transition-colors"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <ActiveTodayIndicator />
                        <NotificationBell />
                        <button
                            onClick={() => handleNavigation('tasks', '/tasks')}
                            className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm shadow-blue-500/20 transition-all hover:shadow"
                        >
                            <Plus size={16} />
                            Add Task
                        </button>
                        <button
                            onClick={() => setShowLogoutConfirm(true)}
                            className="text-[#64748B] hover:text-red-600 transition-colors text-sm px-2.5 py-1 rounded-md hover:bg-red-50"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                    {children}
                </main>
            </div>

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
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="flex-1 px-4 py-2 bg-white hover:bg-[#F1F5F9] text-[#475569] rounded-lg transition-colors border border-[#CBD5E1] font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowLogoutConfirm(false);
                                        logout();
                                        navigate('/login');
                                    }}
                                    className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm shadow-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MainLayout;