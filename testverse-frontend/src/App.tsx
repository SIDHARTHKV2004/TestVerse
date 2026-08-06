import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginPage } from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AutomationPage from './pages/AutomationPage';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import CommunityPage from './pages/CommunityPage';
import ProfilePage from './pages/ProfilePage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import BugTrackerPage from './pages/BugTrackerPage';
import ChatPage from './pages/ChatPage';
import TeamPage from './pages/TeamPage';
import AdminUsersPage from './pages/AdminUsersPage';
import MainLayout from './components/MainLayout';
import PendingApprovalPage from './pages/PendingApprovalPage';

const AppContent: React.FC = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const { isAuthenticated, isPending } = useAuth();

    // If not authenticated, show login/register/forgot pages
    if (!isAuthenticated) {
        // If account is pending approval, show pending page
        if (isPending) {
            return <PendingApprovalPage onNavigate={setCurrentPage} />;
        }

        // Show Register page
        if (currentPage === 'register') {
            return <RegisterPage onNavigate={setCurrentPage} />;
        }
        // Show Forgot Password page
        if (currentPage === 'forgot') {
            return <ForgotPasswordPage onNavigate={setCurrentPage} />;
        }
        // Default: Show Login page
        return (
            <LoginPage onNavigate={(page: string) => {
                if (page === 'register') setCurrentPage('register');
                else if (page === 'forgot') setCurrentPage('forgot');
                else setCurrentPage('login');
            }} />
        );
    }

    const getPageContent = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage onNavigate={setCurrentPage} />;
            case 'automation':
                return <AutomationPage />;
            case 'tasks':
                return <TasksPage />;
            case 'projects':
                return <ProjectsPage />;
            case 'community':
                return <CommunityPage />;
            case 'profile':
                return <ProfilePage />;
            case 'bugs':
                return <BugTrackerPage />;
            case 'chat':
                return <ChatPage />;
            case 'team':
                return <TeamPage />;
            case 'users':
                return <AdminUsersPage />;
            default:
                return <DashboardPage onNavigate={setCurrentPage} />;
        }
    };

    return (
        <MainLayout currentPage={currentPage} onNavigate={setCurrentPage}>
            {getPageContent()}
        </MainLayout>
    );
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;