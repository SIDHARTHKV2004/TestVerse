import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Users,
    UserPlus,
    Trash2,
    User,
    Plus,
    X,
    MessageSquare,
    Send,
    Shield,
    AlertCircle,
    CheckCircle,
    Clock,
    RefreshCw
} from 'lucide-react';
import { API_BASE_URL } from '../services/api';

interface Team {
    id: number;
    name: string;
    description: string;
    teamType?: 'DEVELOPERS_ONLY' | 'TESTERS_ONLY' | 'MIXED';
    members?: User[];
    admin?: User;
    createdBy?: {
        id: number;
        name: string;
        role: string;
        department?: string;
    };
    isCreator?: boolean;
    isAdmin?: boolean;
    memberCount?: number;
    createdAt?: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    role: string;
    status: string;
    department?: string;
    currentTeamCount?: number;
    atMaxTeams?: boolean;
    joinedAt?: string;
}

interface TeamMessage {
    id: number;
    content: string;
    createdAt: string;
    messageType: string;
    sender: {
        id: number;
        name: string;
        role?: string;
    };
}

const TeamPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const isMentor = user?.role === 'MENTOR';
    const canManageTeams = isAdmin || isMentor;

    const token = localStorage.getItem('token');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [joining, setJoining] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Create Team Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        teamType: 'MIXED' as 'DEVELOPERS_ONLY' | 'TESTERS_ONLY' | 'MIXED',
    });
    const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);
    const [createLoading, setCreateLoading] = useState(false);

    // Team Chat State
    const [showChatModal, setShowChatModal] = useState(false);
    const [teamMessages, setTeamMessages] = useState<TeamMessage[]>([]);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatSending, setChatSending] = useState(false);
    const [newChatMessage, setNewChatMessage] = useState('');
    const [chatError, setChatError] = useState<string | null>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
        if (canManageTeams) {
            fetchManageableUsers();
        }
    }, [isAdmin, isMentor]);

    useEffect(() => {
        if (showChatModal && selectedTeam) {
            fetchTeamMessages(selectedTeam.id);
        }
    }, [showChatModal, selectedTeam?.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [teamMessages]);

    const formatISTTime = (timeStr?: string | null): string => {
        if (!timeStr) return '';
        try {
            const d = new Date(timeStr);
            if (isNaN(d.getTime())) return '';
            return d.toLocaleTimeString('en-US', {
                timeZone: 'Asia/Kolkata',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            });
        } catch {
            return '';
        }
    };

    const fetchData = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            let loadedTeams: Team[] = [];

            if (isAdmin) {
                // Admin gets all teams or admin-team
                const response = await fetch(`${API_BASE_URL}/api/teams`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    loadedTeams = Array.isArray(data) ? data : (data ? [data] : []);
                } else {
                    // Fallback to my-teams
                    const fallback = await fetch(`${API_BASE_URL}/api/teams/my-teams`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (fallback.ok) {
                        loadedTeams = await fallback.json();
                    }
                }
            } else {
                // Mentors and members get my-teams
                const response = await fetch(`${API_BASE_URL}/api/teams/my-teams`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    loadedTeams = Array.isArray(data) ? data : [];
                }

                // If regular developer/tester, also load available teams to join
                if (!isMentor) {
                    const availResp = await fetch(`${API_BASE_URL}/api/teams/available`, {
                        headers: { 'Authorization': `Bearer ${token}` },
                    });
                    if (availResp.ok) {
                        const availData = await availResp.json();
                        setAvailableTeams(Array.isArray(availData) ? availData : []);
                    }
                }
            }

            setTeams(loadedTeams);

            if (loadedTeams.length > 0) {
                // Select current team if still valid, otherwise first team
                const currentId = selectedTeam?.id || loadedTeams[0].id;
                await selectTeamDetails(currentId);
            } else {
                setSelectedTeam(null);
            }
        } catch (err) {
            console.error('❌ Error fetching team data:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const selectTeamDetails = async (teamId: number): Promise<void> => {
        try {
            const resp = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (resp.ok) {
                const teamDetail = await resp.json();
                setSelectedTeam(teamDetail);
            }
        } catch (err) {
            console.error('Error fetching team detail:', err);
        }
    };

    const fetchManageableUsers = async (): Promise<void> => {
        try {
            if (isMentor) {
                // Mentors load their assigned mentees with team count limit info
                const response = await fetch(`${API_BASE_URL}/api/teams/mentor/eligible-members`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllUsers(Array.isArray(data) ? data : []);
                }
            } else if (isAdmin) {
                // Admin can load all active users
                const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setAllUsers(Array.isArray(data) ? data : []);
                }
            }
        } catch (err) {
            console.error('Error fetching manageable users:', err);
        }
    };

    const handleTeamTypeChange = (newType: 'DEVELOPERS_ONLY' | 'TESTERS_ONLY' | 'MIXED') => {
        setFormData(prev => ({ ...prev, teamType: newType }));
        // Deselect any members who are no longer valid for the newly selected team type
        setSelectedMemberIds(prev => prev.filter(id => {
            const candidate = allUsers.find(u => u.id === id);
            if (!candidate) return false;
            if (newType === 'DEVELOPERS_ONLY') return candidate.role === 'DEVELOPER';
            if (newType === 'TESTERS_ONLY') return candidate.role === 'TESTER';
            return candidate.role === 'DEVELOPER' || candidate.role === 'TESTER';
        }));
    };

    const getCreateTeamEligibleMembers = (): User[] => {
        return allUsers.filter(u => {
            if (u.id === user?.id) return false;
            if (formData.teamType === 'DEVELOPERS_ONLY' && u.role !== 'DEVELOPER') return false;
            if (formData.teamType === 'TESTERS_ONLY' && u.role !== 'TESTER') return false;
            if (formData.teamType === 'MIXED' && u.role !== 'DEVELOPER' && u.role !== 'TESTER') return false;
            return true;
        });
    };

    const handleCreateTeam = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    memberIds: selectedMemberIds,
                }),
            });

            if (response.ok) {
                alert('✅ Team created successfully!');
                setShowModal(false);
                setFormData({ name: '', description: '', teamType: 'MIXED' });
                setSelectedMemberIds([]);
                await fetchData();
                await fetchManageableUsers();
            } else {
                const errorData = await response.json();
                alert('❌ ' + (errorData.error || 'Failed to create team'));
            }
        } catch (err) {
            console.error('Error creating team:', err);
            alert('❌ Failed to create team');
        } finally {
            setCreateLoading(false);
        }
    };

    const handleAddMember = async (teamId: number, userId: number): Promise<void> => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId }),
            });

            if (response.ok) {
                alert('✅ Member added successfully!');
                await selectTeamDetails(teamId);
                await fetchManageableUsers();
            } else {
                const errorData = await response.json();
                alert('❌ ' + (errorData.error || 'Failed to add member'));
            }
        } catch (err) {
            console.error('Error adding member:', err);
            alert('❌ Network error. Please try again.');
        }
    };

    const handleRemoveMember = async (teamId: number, userId: number): Promise<void> => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('✅ Member removed successfully!');
                await selectTeamDetails(teamId);
                await fetchManageableUsers();
            } else {
                const errorData = await response.json();
                alert('❌ ' + (errorData.error || 'Failed to remove member'));
            }
        } catch (err) {
            console.error('Error removing member:', err);
            alert('❌ Failed to remove member');
        }
    };

    const handleDeleteTeam = async (teamId: number): Promise<void> => {
        if (!confirm('⚠️ Are you sure you want to delete this team? This action cannot be undone!')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('✅ Team deleted successfully!');
                await fetchData();
            } else {
                const errorData = await response.json();
                alert('❌ ' + (errorData.error || 'Failed to delete team'));
            }
        } catch (err) {
            console.error('Error deleting team:', err);
            alert('❌ Failed to delete team');
        }
    };

    const handleJoinTeam = async (teamId: number): Promise<void> => {
        setJoining(teamId);
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/request-join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                alert('✅ ' + (data.message || 'Successfully joined team!'));
                await fetchData();
            } else {
                const errorData = await response.json();
                alert('❌ ' + (errorData.error || 'Failed to join team'));
            }
        } catch (err) {
            console.error('Error joining team:', err);
            alert('❌ Network error. Please try again.');
        } finally {
            setJoining(null);
        }
    };

    // ============================================================
    // TEAM CHAT HANDLERS
    // ============================================================
    const fetchTeamMessages = async (teamId: number): Promise<void> => {
        setChatLoading(true);
        setChatError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${teamId}/messages`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setTeamMessages(Array.isArray(data) ? data : []);
            } else {
                const errData = await response.json();
                setChatError(errData.error || 'Failed to load team messages');
            }
        } catch (err) {
            setChatError('Error loading team messages');
        } finally {
            setChatLoading(false);
        }
    };

    const handleSendTeamMessage = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!selectedTeam || !newChatMessage.trim() || chatSending) return;

        setChatSending(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/teams/${selectedTeam.id}/messages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ content: newChatMessage.trim() }),
            });

            if (response.ok) {
                setNewChatMessage('');
                await fetchTeamMessages(selectedTeam.id);
            } else {
                const errData = await response.json();
                alert('❌ ' + (errData.error || 'Failed to send message'));
            }
        } catch (err) {
            console.error('Error sending team message:', err);
            alert('❌ Failed to send message');
        } finally {
            setChatSending(false);
        }
    };

    // Filter available users for adding to team
    const getAvailableUsers = (): User[] => {
        if (!selectedTeam) return [];
        const memberIds = selectedTeam.members?.map(m => m.id) || [];
        const teamType = selectedTeam.teamType || 'MIXED';

        return allUsers.filter(u => {
            if (memberIds.includes(u.id)) return false;
            if (u.id === user?.id) return false;

            // Check role match with team type
            if (teamType === 'DEVELOPERS_ONLY' && u.role !== 'DEVELOPER') return false;
            if (teamType === 'TESTERS_ONLY' && u.role !== 'TESTER') return false;

            return true;
        });
    };

    const isUserInTeam = (): boolean => {
        if (!selectedTeam) return false;
        return selectedTeam.members?.some(m => m.id === user?.id) || false;
    };

    const canEditSelectedTeam = (): boolean => {
        if (!selectedTeam) return false;
        if (isAdmin) return true;
        if (selectedTeam.isCreator) return true;
        if (selectedTeam.createdBy?.id === user?.id) return true;
        return false;
    };

    const getTeamTypeBadge = (type?: string) => {
        switch (type) {
            case 'DEVELOPERS_ONLY':
                return (
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Developers Only
                    </span>
                );
            case 'TESTERS_ONLY':
                return (
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                        Testers Only
                    </span>
                );
            case 'MIXED':
            default:
                return (
                    <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Developers + Testers
                    </span>
                );
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500 flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0062E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading teams...</span>
                </div>
            </div>
        );
    }

    if (error && !canManageTeams) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center p-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs max-w-md">
                    <div className="text-5xl mb-3">⚠️</div>
                    <h2 className="text-xl font-bold text-[#0F172A] mb-2">Error Loading Team</h2>
                    <p className="text-slate-500 text-sm mb-4">{error}</p>
                    <button
                        onClick={fetchData}
                        className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg transition-colors font-medium text-sm shadow-sm"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">Team Management</h1>
                    <p className="text-slate-500 text-sm">
                        {canManageTeams
                            ? isMentor
                                ? 'Create and manage your domain teams and assigned mentees'
                                : 'Manage teams and organization members'
                            : 'View your team memberships and join available teams'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] px-3.5 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-xs text-sm font-medium"
                        title="Refresh teams"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    {canManageTeams && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-medium text-sm shadow-sm hover:shadow"
                        >
                            <Plus size={18} />
                            Create Team
                        </button>
                    )}
                </div>
            </div>

            {/* Team Selector Tabs if multiple teams */}
            {teams.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E2E8F0]">
                    {teams.map((t) => {
                        const isSelected = selectedTeam?.id === t.id;
                        return (
                            <button
                                key={t.id}
                                onClick={() => selectTeamDetails(t.id)}
                                className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                                    isSelected
                                        ? 'bg-[#0062E0] text-white shadow-xs'
                                        : 'bg-white border border-[#E2E8F0] text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                            >
                                <Users size={14} />
                                {t.name}
                                {t.teamType && (
                                    <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                                        isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {t.teamType === 'DEVELOPERS_ONLY' ? 'Dev' : t.teamType === 'TESTERS_ONLY' ? 'Test' : 'Mixed'}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* No teams yet */}
            {teams.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs">
                    <Users size={48} className="mx-auto mb-3 text-slate-300" />
                    <p className="text-lg font-bold text-[#0F172A]">No team yet</p>
                    <p className="text-sm text-slate-500">
                        {canManageTeams
                            ? 'Create your first team to get started!'
                            : 'No team available. Contact your mentor or administrator.'}
                    </p>
                    {!canManageTeams && availableTeams.length > 0 && (
                        <div className="mt-6 max-w-md mx-auto">
                            <h4 className="text-sm font-semibold text-slate-700 mb-3">Available Teams to Join:</h4>
                            <div className="space-y-2">
                                {availableTeams.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3">
                                        <div className="text-left">
                                            <div className="flex items-center gap-2">
                                                <p className="text-[#0F172A] text-sm font-semibold">{t.name}</p>
                                                {getTeamTypeBadge(t.teamType)}
                                            </div>
                                            <p className="text-xs text-slate-500 mt-0.5">{t.memberCount || 0} members</p>
                                        </div>
                                        <button
                                            onClick={() => handleJoinTeam(t.id)}
                                            disabled={joining === t.id}
                                            className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 shadow-xs"
                                        >
                                            {joining === t.id ? 'Joining...' : 'Join'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : selectedTeam ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Info Card */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs space-y-4">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <h3 className="text-lg font-bold text-[#0F172A]">{selectedTeam.name}</h3>
                                    {canEditSelectedTeam() && (
                                        <button
                                            onClick={() => handleDeleteTeam(selectedTeam.id)}
                                            className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                                            title="Delete Team"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    {getTeamTypeBadge(selectedTeam.teamType)}
                                </div>
                                <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                                    {selectedTeam.description || 'No description provided'}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-[#F1F5F9] space-y-2 text-xs text-slate-500">
                                <div className="flex items-start gap-2">
                                    <User size={14} className="text-[#0062E0] mt-0.5" />
                                    <div>
                                        <span className="text-slate-500">Team Owner:</span>{' '}
                                        <strong className="text-slate-800">
                                            {selectedTeam.createdBy?.name || selectedTeam.admin?.name || 'Administrator'}
                                        </strong>
                                        {(selectedTeam.createdBy?.department || selectedTeam.admin?.department) && (
                                            <div className="text-[11px] font-medium text-[#0062E0] mt-0.5">
                                                {selectedTeam.createdBy?.department || selectedTeam.admin?.department}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users size={14} className="text-emerald-600" />
                                    <span>
                                        Members:{' '}
                                        <strong className="text-slate-700">{selectedTeam.members?.length || 0}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons: Team Chat */}
                            <div className="pt-2">
                                <button
                                    onClick={() => setShowChatModal(true)}
                                    className="w-full bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                                >
                                    <MessageSquare size={16} />
                                    Open Team Chat
                                </button>
                            </div>

                            {isUserInTeam() && (
                                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-1.5">
                                    <CheckCircle size={14} />
                                    You are a member of this team
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Members List */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#F1F5F9]">
                                <h3 className="text-[#0F172A] font-bold flex items-center gap-2">
                                    <Users size={18} className="text-[#0062E0]" />
                                    Team Members
                                </h3>
                                <span className="text-xs font-medium text-slate-500">
                                    {selectedTeam.members?.length || 0} members
                                </span>
                            </div>
                            <div className="space-y-2">
                                {selectedTeam.members?.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 hover:border-slate-300 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0062E0] font-bold text-sm">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-[#0F172A] text-sm font-semibold flex items-center gap-2">
                                                    {member.name}
                                                    {member.id === user?.id && (
                                                        <span className="text-[#0062E0] text-xs bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-medium">
                                                            (You)
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                                    @{member.username || member.email}
                                                    <span className="text-slate-300">•</span>
                                                    <span className="font-medium text-slate-600">{member.role}</span>
                                                    {member.department && (
                                                        <>
                                                            <span className="text-slate-300">•</span>
                                                            <span className="text-slate-400">{member.department}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {canEditSelectedTeam() && member.id !== user?.id && (
                                            <button
                                                onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                                                className="text-slate-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove member"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {(!selectedTeam.members || selectedTeam.members.length === 0) && (
                                    <p className="text-center text-slate-400 py-6 text-sm">No members yet</p>
                                )}
                            </div>
                        </div>

                        {/* Add Member Section - For Creator Mentor or Admin */}
                        {canEditSelectedTeam() && (
                            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 shadow-xs">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[#0F172A] font-bold flex items-center gap-2">
                                        <UserPlus size={18} className="text-[#0062E0]" />
                                        Add Members to Team
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        Max 3 teams per developer/tester
                                    </span>
                                </div>
                                {getAvailableUsers().length === 0 ? (
                                    <p className="text-slate-400 text-center py-4 text-sm">
                                        No eligible users available to add for this team type
                                    </p>
                                ) : (
                                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                        {getAvailableUsers().map((candidate) => {
                                            const atLimit = candidate.atMaxTeams || (candidate.currentTeamCount !== undefined && candidate.currentTeamCount >= 3);
                                            return (
                                                <div
                                                    key={candidate.id}
                                                    className="flex items-center justify-between bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-3 hover:border-slate-300 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0062E0] font-bold text-sm">
                                                            {candidate.name?.charAt(0) || 'U'}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="text-[#0F172A] text-sm font-semibold">{candidate.name}</p>
                                                                {atLimit && (
                                                                    <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold border border-amber-200">
                                                                        3/3 Teams (Max Reached)
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-slate-500">
                                                                @{candidate.username || candidate.email} • {candidate.role}
                                                                {candidate.currentTeamCount !== undefined && !atLimit && (
                                                                    <span className="text-slate-400 ml-2">
                                                                        ({candidate.currentTeamCount}/3 teams)
                                                                    </span>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleAddMember(selectedTeam.id, candidate.id)}
                                                        disabled={atLimit}
                                                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all shadow-xs flex items-center gap-1.5 ${
                                                            atLimit
                                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                                : 'bg-[#0062E0] hover:bg-[#0050B8] text-white'
                                                        }`}
                                                    >
                                                        <UserPlus size={14} />
                                                        {atLimit ? 'Max Teams' : 'Add to Team'}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            ) : null}

            {/* Create Team Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
                                <Users size={18} className="text-[#0062E0]" />
                                Create New Team
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setSelectedMemberIds([]);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Team Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3.5 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-all"
                                    placeholder="e.g. Core Automation Team"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Team Type <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={formData.teamType}
                                    onChange={(e) =>
                                        handleTeamTypeChange(e.target.value as 'DEVELOPERS_ONLY' | 'TESTERS_ONLY' | 'MIXED')
                                    }
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3.5 py-2 text-sm text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-all"
                                >
                                    <option value="DEVELOPERS_ONLY">Developers Only</option>
                                    <option value="TESTERS_ONLY">Testers Only</option>
                                    <option value="MIXED">Mixed (Developers + Testers)</option>
                                </select>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Role restriction is strictly validated: members must match the team type.
                                </p>
                            </div>

                            {/* Eligible Members Selection */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-slate-700">
                                        Eligible Members
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        {selectedMemberIds.length} selected
                                    </span>
                                </div>
                                <div className="border border-[#CBD5E1] rounded-lg p-2.5 max-h-48 overflow-y-auto space-y-1.5 bg-[#F8FAFC]">
                                    {getCreateTeamEligibleMembers().length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center py-3">
                                            No eligible {formData.teamType === 'DEVELOPERS_ONLY' ? 'Developers' : formData.teamType === 'TESTERS_ONLY' ? 'Testers' : 'Members'} found
                                        </p>
                                    ) : (
                                        getCreateTeamEligibleMembers().map((candidate) => {
                                            const atLimit = candidate.atMaxTeams || (candidate.currentTeamCount !== undefined && candidate.currentTeamCount >= 3);
                                            const isChecked = selectedMemberIds.includes(candidate.id);
                                            const roleDisplay = candidate.role === 'DEVELOPER' ? 'Developer' : candidate.role === 'TESTER' ? 'Tester' : candidate.role;
                                            const teamCountDisplay = `${candidate.currentTeamCount ?? 0}/3 teams`;

                                            return (
                                                <label
                                                    key={candidate.id}
                                                    className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-colors ${
                                                        atLimit
                                                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                                                            : isChecked
                                                            ? 'bg-blue-50 border-blue-300 text-blue-900 cursor-pointer'
                                                            : 'bg-white border-[#E2E8F0] hover:bg-slate-50 text-slate-700 cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            disabled={atLimit}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                if (atLimit) return;
                                                                if (e.target.checked) {
                                                                    setSelectedMemberIds((prev) => [...prev, candidate.id]);
                                                                } else {
                                                                    setSelectedMemberIds((prev) => prev.filter((id) => id !== candidate.id));
                                                                }
                                                            }}
                                                            className="rounded text-[#0062E0] focus:ring-[#0062E0] h-4 w-4"
                                                        />
                                                        <span className="font-semibold">{candidate.name}</span>
                                                        <span className="text-slate-400">—</span>
                                                        <span className="font-medium text-slate-600">{roleDisplay}</span>
                                                        <span className="text-slate-400">—</span>
                                                        <span className={atLimit ? 'text-amber-600 font-semibold' : 'text-slate-500'}>
                                                            {teamCountDisplay}
                                                        </span>
                                                    </div>
                                                    {atLimit && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold border border-amber-200">
                                                            Max Reached
                                                        </span>
                                                    )}
                                                </label>
                                            );
                                        })
                                    )}
                                </div>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    A user can belong to a maximum of 3 teams.
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={2}
                                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3.5 py-2 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-all"
                                    placeholder="Describe team goals and focus..."
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setSelectedMemberIds([]);
                                    }}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2 rounded-lg font-medium text-xs transition-all disabled:opacity-50 shadow-sm"
                                >
                                    {createLoading ? 'Creating...' : 'Create Team'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Team Chat Modal */}
            {showChatModal && selectedTeam && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-2xl h-[560px] flex flex-col shadow-2xl overflow-hidden">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#0062E0] text-white flex items-center justify-center font-bold">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-sm text-[#0F172A]">{selectedTeam.name}</h3>
                                        {getTeamTypeBadge(selectedTeam.teamType)}
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        Team Chat • {selectedTeam.members?.length || 0} Members
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => fetchTeamMessages(selectedTeam.id)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                                    title="Refresh chat"
                                >
                                    <RefreshCw size={16} />
                                </button>
                                <button
                                    onClick={() => setShowChatModal(false)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Messages Body */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
                            {chatLoading ? (
                                <div className="flex items-center justify-center h-full text-slate-400 text-xs">
                                    <div className="w-4 h-4 border-2 border-[#0062E0] border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Loading team messages...
                                </div>
                            ) : chatError ? (
                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl flex items-center gap-2">
                                    <AlertCircle size={16} />
                                    <span>{chatError}</span>
                                </div>
                            ) : teamMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-10">
                                    <MessageSquare size={36} className="text-slate-300 mb-2" />
                                    <p className="text-xs font-semibold text-slate-600">No messages in this team yet</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">Start the conversation with your team members below.</p>
                                </div>
                            ) : (
                                teamMessages.map((msg) => {
                                    const isMe = msg.sender?.id === user?.id;
                                    return (
                                        <div
                                            key={msg.id}
                                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                                        >
                                            <div className="flex items-center gap-1.5 mb-1 px-1">
                                                <span className="text-[11px] font-semibold text-slate-700">
                                                    {isMe ? 'You' : msg.sender?.name || 'Member'}
                                                </span>
                                                {msg.sender?.role && (
                                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 text-slate-600 font-medium">
                                                        {msg.sender.role}
                                                    </span>
                                                )}
                                                <span className="text-[10px] text-slate-400">
                                                    {formatISTTime(msg.createdAt)}
                                                </span>
                                            </div>
                                            <div
                                                className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs leading-relaxed ${
                                                    isMe
                                                        ? 'bg-[#0062E0] text-white rounded-br-xs'
                                                        : 'bg-white border border-[#E2E8F0] text-slate-800 rounded-bl-xs shadow-xs'
                                                }`}
                                            >
                                                {msg.content}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Chat Input */}
                        <form onSubmit={handleSendTeamMessage} className="p-3 border-t border-[#F1F5F9] bg-white flex items-center gap-2">
                            <input
                                type="text"
                                value={newChatMessage}
                                onChange={(e) => setNewChatMessage(e.target.value)}
                                placeholder={`Message ${selectedTeam.name}...`}
                                className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition"
                            />
                            <button
                                type="submit"
                                disabled={!newChatMessage.trim() || chatSending}
                                className="bg-[#0062E0] hover:bg-[#0050B8] text-white p-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs flex items-center justify-center"
                                title="Send Message"
                            >
                                <Send size={15} />
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPage;