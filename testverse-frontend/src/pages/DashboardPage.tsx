import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  FolderKanban,
  Bell,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate?: (page: string) => void;
}

interface Stats {
  tasks: number;
  projects: number;
  notifications: number;
  posts: number;
  completedTasks: number;
  inProgressTasks: number;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    tasks: 0,
    projects: 0,
    notifications: 0,
    posts: 0,
    completedTasks: 0,
    inProgressTasks: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch real data from backend
      const [tasksRes, projectsRes] = await Promise.all([
        fetch('http://localhost:8080/tasks', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:8080/api/projects', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      let tasks = [];
      let projects = [];

      if (tasksRes.ok) {
        tasks = await tasksRes.json();
      }
      if (projectsRes.ok) {
        projects = await projectsRes.json();
      }

      const completed = tasks.filter((t: any) => t.status === 'Done' || t.status === 'Completed').length;
      const inProgress = tasks.filter((t: any) => t.status === 'In Progress' || t.status === 'InProgress').length;

      setStats({
        tasks: Array.isArray(tasks) ? tasks.length : 0,
        projects: Array.isArray(projects) ? projects.length : 0,
        notifications: 3,
        posts: 8,
        completedTasks: completed,
        inProgressTasks: inProgress,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-[#666666]">Loading dashboard...</div>
        </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-[#666666] text-sm mt-1">
              Here's what's happening with your projects today
            </p>
          </div>
          <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full bg-[#ff6b00]/20 text-[#ff6b00]">
            {user?.role || 'Student'}
          </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#ff6b00] transition-all hover:shadow-lg hover:shadow-[#ff6b00]/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666666] text-sm font-medium">Total Tasks</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.tasks}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 flex items-center justify-center">
                <ClipboardList size={20} className="text-[#ff6b00]" />
              </div>
            </div>
            <button
                onClick={() => onNavigate?.('tasks')}
                className="mt-3 text-xs text-[#ff6b00] hover:text-[#ff8c38] flex items-center gap-1 transition-colors"
            >
              View all tasks <ArrowRight size={12} />
            </button>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#ff6b00] transition-all hover:shadow-lg hover:shadow-[#ff6b00]/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666666] text-sm font-medium">Total Projects</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.projects}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 flex items-center justify-center">
                <FolderKanban size={20} className="text-[#ff6b00]" />
              </div>
            </div>
            <button
                onClick={() => onNavigate?.('projects')}
                className="mt-3 text-xs text-[#ff6b00] hover:text-[#ff8c38] flex items-center gap-1 transition-colors"
            >
              View all projects <ArrowRight size={12} />
            </button>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#ff6b00] transition-all hover:shadow-lg hover:shadow-[#ff6b00]/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666666] text-sm font-medium">In Progress</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.inProgressTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock size={20} className="text-yellow-500" />
              </div>
            </div>
            <div className="mt-3 text-xs text-[#666666] flex items-center gap-1">
              <span className="text-yellow-500">●</span> Active tasks
            </div>
          </div>

          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5 hover:border-[#ff6b00] transition-all hover:shadow-lg hover:shadow-[#ff6b00]/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#666666] text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-white mt-1">{stats.completedTasks}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle size={20} className="text-green-500" />
              </div>
            </div>
            <div className="mt-3 text-xs text-[#666666] flex items-center gap-1">
              <span className="text-green-500">●</span> Done tasks
            </div>
          </div>
        </div>

        {/* Quick Actions - Orange Themed */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
                onClick={() => onNavigate?.('automation')}
                className="bg-[#111111] border border-[#1a1a1a] p-5 rounded-xl text-left hover:border-[#ff6b00] hover:shadow-lg hover:shadow-[#ff6b00]/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 flex items-center justify-center group-hover:bg-[#ff6b00]/20 transition-all">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-[#ff6b00] transition-colors">Automation Hub</h3>
                  <p className="text-sm text-[#666666]">Manage your automation tests</p>
                </div>
              </div>
            </button>

            <button
                onClick={() => onNavigate?.('tasks')}
                className="bg-[#111111] border border-[#1a1a1a] p-5 rounded-xl text-left hover:border-[#ff6b00] hover:shadow-lg hover:shadow-[#ff6b00]/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 flex items-center justify-center group-hover:bg-[#ff6b00]/20 transition-all">
                  <span className="text-xl">📋</span>
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-[#ff6b00] transition-colors">My Tasks</h3>
                  <p className="text-sm text-[#666666]">View and manage tasks</p>
                </div>
              </div>
            </button>

            <button
                onClick={() => onNavigate?.('community')}
                className="bg-[#111111] border border-[#1a1a1a] p-5 rounded-xl text-left hover:border-[#ff6b00] hover:shadow-lg hover:shadow-[#ff6b00]/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 flex items-center justify-center group-hover:bg-[#ff6b00]/20 transition-all">
                  <span className="text-xl">💬</span>
                </div>
                <div>
                  <h3 className="font-medium text-white group-hover:text-[#ff6b00] transition-colors">Community</h3>
                  <p className="text-sm text-[#666666]">Connect with others</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
            <div className="space-y-4">
              <div className="flex items-start gap-3 pb-4 border-b border-[#1a1a1a]">
                <div className="w-2 h-2 rounded-full bg-[#ff6b00] mt-2"></div>
                <div>
                  <p className="text-sm text-white">You created a new task</p>
                  <p className="text-xs text-[#666666]">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-4 border-b border-[#1a1a1a]">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div>
                  <p className="text-sm text-white">Task "Login Page" was completed</p>
                  <p className="text-xs text-[#666666]">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                  <p className="text-sm text-white">New project "TestVerse Platform" created</p>
                  <p className="text-xs text-[#666666]">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default DashboardPage;