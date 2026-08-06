import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  CheckSquare, 
  FileText, 
  Terminal, 
  Bug, 
  MessageSquare, 
  MessageCircle, 
  BookOpen, 
  Trophy, 
  User, 
  Zap, 
  ChevronRight,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  taskCount?: number;
  bugCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentPage, 
  onNavigate,
  taskCount = 6,
  bugCount = 2
}) => {
  const { role } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects Workspace', icon: Briefcase },
    { id: 'tasks', label: 'Tasks Management', icon: CheckSquare, badge: taskCount },
    { 
      id: 'manual-testing', 
      label: 'Manual Testing', 
      icon: FileSpreadsheet,
      subItems: ['Scenarios & Cases', 'RTM Matrix', 'Summary Reports']
    },
    { id: 'automation', label: 'Automation Hub', icon: Terminal },
    { id: 'bugs', label: 'Bug Tracker', icon: Bug, badge: bugCount, badgeColor: 'bg-rose-500' },
    { id: 'community', label: 'Community Feed', icon: MessageSquare },
    { id: 'chat', label: 'Mentor & Peer Chat', icon: MessageCircle, badge: 'Live' },
    { id: 'notes', label: 'Notes & Resources', icon: BookOpen },
    { id: 'leaderboard', label: 'Streaks & Rankings', icon: Trophy },
    { id: 'profile', label: 'My Profile', icon: User }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0 text-slate-300 transition-all select-none">
      
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/40">
        <div 
          onClick={() => onNavigate('dashboard')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <div className="font-extrabold text-lg text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
              TestVerse<span className="text-emerald-400">.io</span>
            </div>
            <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-0.5">
              QA Mentorship Platform
            </div>
          </div>
        </div>
      </div>

      {/* Role Badge Indicator */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/50 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Active Workspace</span>
        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
          role === 'MENTOR' 
            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' 
            : 'bg-indigo-950 text-indigo-400 border border-indigo-800/50'
        }`}>
          {role} mode
        </span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg font-medium text-sm transition-all group ${
                  isActive
                    ? 'bg-indigo-600/90 text-white shadow-md shadow-indigo-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-white' : 'text-slate-500 group-hover:text-indigo-400'
                  }`} />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {item.badge !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white ${
                      item.badgeColor || 'bg-indigo-500'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                  {item.subItems && (
                    <ChevronRight className={`w-3.5 h-3.5 text-slate-500 transition-transform ${
                      isActive ? 'rotate-90 text-white' : ''
                    }`} />
                  )}
                </div>
              </button>

              {/* Sub-items if active */}
              {item.subItems && isActive && (
                <div className="ml-8 mt-1 space-y-1 border-l border-slate-800 pl-3 py-1">
                  {item.subItems.map((sub, idx) => (
                    <div
                      key={idx}
                      className="text-xs text-slate-400 hover:text-indigo-400 cursor-pointer py-1 transition-colors"
                    >
                      • {sub}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Banner */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="bg-gradient-to-r from-indigo-950/70 to-slate-900 border border-indigo-800/40 rounded-xl p-3 text-xs">
          <div className="flex items-center space-x-2 text-indigo-400 font-bold mb-1">
            <Layers className="w-4 h-4" />
            <span>Need QA Mentorship?</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Schedule a 1-on-1 code review session with Senior QA Architects.
          </p>
        </div>
      </div>

    </aside>
  );
};
