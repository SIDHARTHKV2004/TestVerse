import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
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
    Bell,
    Search,
    Menu,
    Plus,
    UserCog,
    Users as UsersIcon
} from 'lucide-react';
import NotificationBell from './NotificationBell';

interface MainLayoutProps {
    children: React.ReactNode;
    currentPage: string;
    onNavigate: (page: string) => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, currentPage, onNavigate }) => {
    const { user, logout, isAdmin } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const allMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'tasks', label: 'Tasks', icon: ClipboardList },
        { id: 'projects', label: 'Projects', icon: FolderKanban },
        { id: 'bugs', label: 'Bug Tracker', icon: Bug },
        { id: 'automation', label: 'Automation Hub', icon: Rocket },
        { id: 'community', label: 'Community', icon: Users },
        { id: 'chat', label: 'Chat', icon: MessageSquare },
        { id: 'team', label: 'My Team', icon: UsersIcon, roles: ['TESTER', 'DEVELOPER'] },
        { id: 'users', label: 'Users', icon: UserCog, roles: ['ADMIN'] },
    ];

    const menuItems = allMenuItems.filter(item => {
        if (!item.roles) return true;
        return item.roles.includes(user?.role || '');
    });

    return (
        <div className="flex h-screen bg-black text-white">
            {/* Sidebar */}
            <div className={`${collapsed ? 'w-16' : 'w-64'} bg-black border-r border-[#1a1a1a] transition-all duration-300 flex flex-col`}>
                {/* Logo */}
                <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-[#ff6b00] rounded-lg flex items-center justify-center font-bold text-white text-sm">
                                TV
                            </div>
                            <span className="text-lg font-bold text-white">TestVerse</span>
                        </div>
                    )}
                    {collapsed && (
                        <div className="w-8 h-8 bg-[#ff6b00] rounded-lg flex items-center justify-center font-bold text-white text-sm mx-auto">
                            TV
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="text-[#666666] hover:text-white transition-colors"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentPage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                                    isActive
                                        ? 'bg-[#ff6b00] text-white'
                                        : 'text-[#666666] hover:bg-[#1a1a1a] hover:text-white'
                                }`}
                            >
                                <Icon size={20} />
                                {!collapsed && <span className="text-sm">{item.label}</span>}
                            </button>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="border-t border-[#1a1a1a] p-3">
                    <button
                        onClick={() => onNavigate('profile')}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-[#ff6b00] flex items-center justify-center text-white font-bold text-sm">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        {!collapsed && (
                            <div className="flex-1 text-left">
                                <div className="text-sm font-medium text-white">{user?.name}</div>
                                <div className="text-xs text-[#666666] capitalize">{user?.role?.toLowerCase()}</div>
                            </div>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden bg-black">
                {/* Top Bar */}
                <header className="bg-black border-b border-[#1a1a1a] px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                        <button className="lg:hidden text-[#666666] hover:text-white">
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-3 flex-1 max-w-md">
                            <Search size={18} className="text-[#666666]" />
                            <input
                                type="text"
                                placeholder="Search tasks, projects..."
                                className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00] w-full"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <NotificationBell />
                        <button className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors">
                            <Plus size={16} />
                            Add Task
                        </button>
                        <button
                            onClick={logout}
                            className="text-[#666666] hover:text-red-400 transition-colors text-sm px-3 py-1"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-black">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;