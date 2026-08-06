import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Send, Users, Clock, Check, X, User, Mail } from 'lucide-react';

interface User {
    id: number;
    username: string;
    email: string;
    name: string;
    role: string;
    status: string;
    createdAt: string;
}

interface Team {
    id: number;
    name: string;
    members: any[];
}

const AdminUsersPage: React.FC = () => {
    const { token, isAdmin } = useAuth();
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
    const [invitingUserId, setInvitingUserId] = useState<number | null>(null);

    useEffect(() => {
        if (isAdmin) {
            fetchAllUsers();
            fetchTeams();
        }
    }, [isAdmin]);

    const fetchAllUsers = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAllUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/teams', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setTeams(data);
                if (data.length > 0) {
                    setSelectedTeamId(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        }
    };

    const handleSendInvitation = async (userId: number) => {
        if (!selectedTeamId) {
            setMessage({ text: '❌ Please select a team first', type: 'error' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        setInvitingUserId(userId);
        try {
            const response = await fetch('http://localhost:8080/api/notifications/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    userId: userId,
                    teamId: selectedTeamId,
                }),
            });

            if (response.ok) {
                setMessage({ text: '✅ Invitation sent successfully!', type: 'success' });
                setTimeout(() => setMessage(null), 3000);
            } else {
                const error = await response.json();
                setMessage({ text: '❌ ' + (error.error || 'Failed to send invitation'), type: 'error' });
                setTimeout(() => setMessage(null), 3000);
            }
        } catch (error) {
            console.error('Error sending invitation:', error);
            setMessage({ text: '❌ Network error. Please try again.', type: 'error' });
            setTimeout(() => setMessage(null), 3000);
        } finally {
            setInvitingUserId(null);
        }
    };

    // Get users not in the selected team
    const getAvailableUsers = () => {
        if (!selectedTeamId) return allUsers;
        const team = teams.find(t => t.id === selectedTeamId);
        if (!team) return allUsers;
        const memberIds = team.members?.map(m => m.id) || [];
        return allUsers.filter(u => !memberIds.includes(u.id));
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center text-[#666666]">
                    <div className="text-4xl mb-4">🔒</div>
                    <p className="text-lg">Access Denied</p>
                    <p className="text-sm">Only Admin can access this page</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[#666666]">Loading users...</div>
            </div>
        );
    }

    const availableUsers = getAvailableUsers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">👥 User Management</h1>
                    <p className="text-[#666666] text-sm">View all users and send team invitations</p>
                </div>
                <div className="bg-[#ff6b00]/20 text-[#ff6b00] px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                    <Users size={16} />
                    Total Users: {allUsers.length}
                </div>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${
                    message.type === 'success'
                        ? 'bg-green-500/10 border border-green-500/30 text-green-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Team Selection */}
            {teams.length > 0 && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-4">
                    <label className="block text-sm text-[#666666] mb-2">Select Team for Invitations</label>
                    <select
                        value={selectedTeamId || ''}
                        onChange={(e) => setSelectedTeamId(Number(e.target.value))}
                        className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white w-full max-w-md focus:outline-none focus:border-[#ff6b00]"
                    >
                        {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                                {team.name} ({team.members?.length || 0} members)
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* All Users - Send Invitations */}
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Send size={18} className="text-[#ff6b00]" />
                    Send Invitations
                </h3>
                <p className="text-sm text-[#666666] mb-4">Invite users to join your team. They will receive a notification.</p>

                {availableUsers.length === 0 ? (
                    <p className="text-[#666666] text-center py-4">All users are already in the team</p>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {availableUsers.map((u) => (
                            <div key={u.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3 hover:border-[#ff6b00] transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#ff6b00]/20 flex items-center justify-center text-[#ff6b00] font-bold">
                                        {u.name?.charAt(0) || 'U'}
                                    </div>
                                    <div>
                                        <p className="text-white text-sm font-medium">{u.name}</p>
                                        <p className="text-xs text-[#666666] flex items-center gap-2">
                                            @{u.username}
                                            <span className="text-[#444444]">•</span>
                                            {u.role}
                                            <span className="text-[#444444]">•</span>
                                            <span className="text-[#666666]">{u.email}</span>
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleSendInvitation(u.id)}
                                    disabled={invitingUserId === u.id}
                                    className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <UserPlus size={16} />
                                    {invitingUserId === u.id ? 'Sending...' : 'Invite to Team'}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* All Users List */}
            <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                    <Users size={18} className="text-[#666666]" />
                    All Registered Users
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                    {allUsers.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2">
                            <div className="w-8 h-8 rounded-full bg-[#ff6b00]/20 flex items-center justify-center text-[#ff6b00] font-bold text-xs">
                                {u.name?.charAt(0) || 'U'}
                            </div>
                            <div className="flex-1">
                                <p className="text-white text-sm">{u.name}</p>
                                <p className="text-xs text-[#666666]">@{u.username} • {u.role}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                u.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                                    u.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-red-500/20 text-red-400'
                            }`}>
                                {u.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminUsersPage;