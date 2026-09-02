import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import MainLayout from './components/MainLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import BugTrackerPage from './pages/BugTrackerPage';
import AutomationPage from './pages/AutomationPage';
import CommunityPage from './pages/CommunityPage';
import ChatPage from './pages/ChatPage';
import TeamPage from './pages/TeamPage';
import UsersPage from './pages/AdminUsersPage';
import ProfilePage from './pages/ProfilePage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { ManualTestingPage } from './pages/ManualTestingPage';
import { NotesPage } from './pages/NotesPage';
import SearchPage from './pages/SearchPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PendingApprovalPage from './pages/PendingApprovalPage';

// ✅ Component to sync URL with sidebar
const RouteSync: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
    const location = useLocation();

    useEffect(() => {
        // Get the page name from URL path
        const path = location.pathname.replace('/', '');
        const page = path || 'dashboard';
        onNavigate(page);
    }, [location, onNavigate]);

    return null;
};

const AppContent: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [currentPage, setCurrentPage] = useState('dashboard');

    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/pending-approval" element={<PendingApprovalPage />} />
                <Route path="*" element={<Navigate to="/login" />} />
            </Routes>
        );
    }

    const handleNavigate = (page: string) => {
        setCurrentPage(page);
    };

    return (
        <MainLayout currentPage={currentPage} onNavigate={handleNavigate}>
            {/* ✅ Sync URL changes with sidebar */}
            <RouteSync onNavigate={handleNavigate} />
            <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/bugs" element={<BugTrackerPage />} />
                <Route path="/automation" element={<AutomationPage />} />
                <Route path="/community" element={<CommunityPage />} />
                <Route path="/chat" element={<ChatPage />} />
                <Route path="/team" element={<TeamPage />} />
                <Route path="/users" element={<UsersPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
                <Route path="/manual-testing" element={<ManualTestingPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/search" element={
                    <SearchPage
                        query=""
                        tasks={[]}
                        projects={[]}
                        bugs={[]}
                        users={[]}
                        onTaskClick={() => {}}
                        onProjectClick={() => {}}
                        onBugClick={() => {}}
                        onUserClick={() => {}}
                    />
                } />
                <Route path="/" element={<Navigate to="/dashboard" />} />
                <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
        </MainLayout>
    );
};

const App: React.FC = () => {
    return (
        <AuthProvider>
            <ThemeProvider>
                <Router>
                    <AppContent />
                </Router>
            </ThemeProvider>
        </AuthProvider>
    );
};

export default App;