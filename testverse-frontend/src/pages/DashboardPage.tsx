import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  ClipboardList,
  Bug,
  Users,
  MessageSquare,
  Flame,
  Award,
  Activity,
  CheckCircle
} from 'lucide-react';

interface DashboardStats {
  totalModules: number;
  activeModules: number;
  completedModules: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalBugs: number;
  openBugs: number;
  resolvedBugs: number;
  teamMembers: number;
  totalCommunityPosts: number;
  points: number;
  streakDays: number;
  completionRate: number;
}

interface Activity {
  id: number | string;
  action: string;
  time: string;
  type: 'task' | 'module' | 'bug' | 'team';
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalModules: 0,
    activeModules: 0,
    completedModules: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    totalBugs: 0,
    openBugs: 0,
    resolvedBugs: 0,
    teamMembers: 0,
    totalCommunityPosts: 0,
    points: 0,
    streakDays: 0,
    completionRate: 0
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Navigation handler using react-router
  const handleCardClick = (page: string) => {
    navigate(`/${page}`);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');

        const [modulesRes, tasksRes, bugsRes, teamRes, communityRes] = await Promise.all([
          fetch('http://localhost:8080/api/projects', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8080/api/tasks', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8080/api/bugs', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:8080/api/team', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => ({ ok: false, json: () => [] })),
          fetch('http://localhost:8080/api/community/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).catch(() => ({ ok: false, json: () => [] }))
        ]);

        const modules = modulesRes.ok ? await modulesRes.json() : [];
        const tasks = tasksRes.ok ? await tasksRes.json() : [];
        const bugs = bugsRes.ok ? await bugsRes.json() : [];
        const team = teamRes.ok ? await teamRes.json() : [];
        const communityPosts = communityRes.ok ? await communityRes.json() : [];

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t: any) =>
            t.status === 'COMPLETED' || t.status === 'DONE' || t.status === 'Closed'
        ).length;
        const pendingTasks = totalTasks - completedTasks;

        const totalBugs = bugs.length;
        const openBugs = bugs.filter((b: any) =>
            b.status === 'OPEN' || b.status === 'IN_PROGRESS' || b.status === 'New'
        ).length;
        const resolvedBugs = bugs.filter((b: any) =>
            b.status === 'RESOLVED' || b.status === 'CLOSED' || b.status === 'Fixed'
        ).length;

        const totalModules = modules.length;
        const activeModules = modules.filter((p: any) =>
            p.status === 'ACTIVE' || p.status === 'Active' || p.status === 'IN_PROGRESS'
        ).length;
        const completedModules = modules.filter((p: any) =>
            p.status === 'COMPLETED' || p.status === 'Completed' || p.status === 'DONE'
        ).length;

        const teamMembers = team.length || 0;
        const totalCommunityPosts = communityPosts.length || 0;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        setStats({
          totalModules,
          activeModules,
          completedModules,
          totalTasks,
          completedTasks,
          pendingTasks,
          totalBugs,
          openBugs,
          resolvedBugs,
          teamMembers,
          totalCommunityPosts,
          points: user?.points || 0,
          streakDays: user?.streakDays || 0,
          completionRate
        });

        const activities: Activity[] = [];

        tasks.slice(0, 3).forEach((task: any) => {
          activities.push({
            id: task.id || `task-${Math.random()}`,
            action: `Task "${task.title}" ${task.status === 'COMPLETED' ? 'completed' : 'updated'}`,
            time: task.updatedAt ? new Date(task.updatedAt).toLocaleDateString() : 'Today',
            type: 'task'
          });
        });

        modules.slice(0, 2).forEach((moduleItem: any) => {
          activities.push({
            id: `m-${moduleItem.id || Math.random()}`,
            action: `Module "${moduleItem.name}" ${moduleItem.status === 'ACTIVE' ? 'activated' : 'updated'}`,
            time: moduleItem.updatedAt ? new Date(moduleItem.updatedAt).toLocaleDateString() : 'Today',
            type: 'module'
          });
        });

        bugs.slice(0, 2).forEach((bugItem: any) => {
          activities.push({
            id: `b-${bugItem.id || Math.random()}`,
            action: `Bug "${bugItem.title}" ${bugItem.status === 'RESOLVED' ? 'resolved' : 'reported'}`,
            time: bugItem.updatedAt ? new Date(bugItem.updatedAt).toLocaleDateString() : 'Today',
            type: 'bug'
          });
        });

        setRecentActivity(activities.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500 font-medium">Loading dashboard...</div>
        </div>
    );
  }

  return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">
              Welcome back, {user?.name || 'User'}! 👋
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Here's your QA platform overview</p>
          </div>
          <div className="flex items-center gap-3">
            {stats.streakDays > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#FFFBEB] border border-[#FDE68A] rounded-lg">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-800">{stats.streakDays} day streak</span>
                </div>
            )}
            {stats.points > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#EFF6FF] border border-[#BFDBFE] rounded-lg">
                  <Award className="w-4 h-4 text-[#0062E0]" />
                  <span className="text-sm font-medium text-[#0062E0]">{stats.points} pts</span>
                </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

          {/* ✅ TOTAL TASKS */}
          <div
              onClick={() => handleCardClick('tasks')}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#0062E0] hover:shadow-md transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 group-hover:text-[#0062E0] transition-colors">Total Tasks</div>
                <div className="text-2xl font-bold text-[#0F172A] mt-1">{stats.totalTasks}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center group-hover:bg-[#DBEAFE] transition-colors">
                <ClipboardList className="w-5 h-5 text-[#0062E0]" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-emerald-600 font-medium">{stats.completedTasks} completed</span>
              <span className="text-slate-300">•</span>
              <span className="text-amber-600 font-medium">{stats.pendingTasks} pending</span>
            </div>
          </div>

          {/* ✅ TOTAL MODULES */}
          <div
              onClick={() => handleCardClick('projects')}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-[#00B388] hover:shadow-md transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 group-hover:text-[#00B388] transition-colors">Total Modules</div>
                <div className="text-2xl font-bold text-[#0F172A] mt-1">{stats.totalModules}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#E6F9F4] flex items-center justify-center group-hover:bg-[#CCF2E9] transition-colors">
                <FolderKanban className="w-5 h-5 text-[#00B388]" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1.5 text-xs">
              <span className="text-emerald-600 font-medium">{stats.activeModules} active</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#0062E0] font-medium">{stats.completedModules} completed</span>
            </div>
          </div>

          {/* ✅ Bug Tracker */}
          <div
              onClick={() => handleCardClick('bugs')}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-red-400 hover:shadow-md transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 group-hover:text-red-500 transition-colors">Bug Tracker</div>
                <div className="text-2xl font-bold text-[#0F172A] mt-1">{stats.totalBugs}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#FEF2F2] flex items-center justify-center group-hover:bg-[#FEE2E2] transition-colors">
                <Bug className="w-5 h-5 text-red-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-red-500 font-medium">{stats.openBugs} open</span>
              <span className="text-slate-300">•</span>
              <span className="text-emerald-600 font-medium">{stats.resolvedBugs} resolved</span>
            </div>
          </div>

          {/* ✅ Team Members */}
          <div
              onClick={() => handleCardClick('team')}
              className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-500 group-hover:text-purple-600 transition-colors">Team Members</div>
                <div className="text-2xl font-bold text-[#0F172A] mt-1">{stats.teamMembers}</div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs">
              <span className="text-slate-500">Active team members</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#E6F9F4] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[#00B388]" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Completion Rate</div>
                <div className="text-xl font-bold text-[#0F172A]">{stats.completionRate}%</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#0062E0]" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Community Posts</div>
                <div className="text-xl font-bold text-[#0F172A]">{stats.totalCommunityPosts}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#FFFBEB] flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-500">Active Modules</div>
                <div className="text-xl font-bold text-[#0F172A]">{stats.activeModules}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#0F172A] font-semibold text-base">Recent Activity</h3>
            <button
                onClick={() => window.location.reload()}
                className="text-sm font-medium text-[#0062E0] hover:text-[#0050B8] transition-colors"
            >
              Refresh
            </button>
          </div>
          {recentActivity.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                <p className="text-sm">No recent activity</p>
              </div>
          ) : (
              <div className="space-y-3">
                {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 py-2 border-b border-[#F1F5F9] last:border-0">
                      <div className={`w-2 h-2 rounded-full ${
                          activity.type === 'task' ? 'bg-[#0062E0]' :
                              activity.type === 'module' ? 'bg-[#00B388]' :
                                  activity.type === 'bug' ? 'bg-red-500' :
                                      'bg-emerald-500'
                      }`} />
                      <span className="text-sm text-slate-700 flex-1">{activity.action}</span>
                      <span className="text-xs text-slate-400">{activity.time}</span>
                    </div>
                ))}
              </div>
          )}
        </div>
      </div>
  );
};

export default DashboardPage;