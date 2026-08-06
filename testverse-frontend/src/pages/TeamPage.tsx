import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Trash2, User, Calendar, Mail, Plus, X, Check, Bell, MessageSquare, Send } from 'lucide-react';

interface Team {
    id: number;
    name: string;
    description: string;
    members: User[];
    admin: User;
    createdAt: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    username: string;
    role: string;
    status: string;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    isAccepted: boolean;
    senderId: number;
    teamId: number;
    createdAt: string;
}

const TeamPage: React.FC = () => {
    const { user, token, isAdmin } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [joinRequestSent, setJoinRequestSent] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        fetchTeams();
        fetchAllUsers();
        fetchNotifications();
    }, []);

    const fetchTeams = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/teams/my-team', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setTeams(data);
                if (data.length > 0) {
                    setSelectedTeam(data[0]);
                }
            }
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/admin/pending-users', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setAllUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleCreateTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:8080/api/teams', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const newTeam = await response.json();
                setTeams([...teams, newTeam]);
                setSelectedTeam(newTeam);
                setShowModal(false);
                setFormData({ name: '', description: '' });
                alert('✅ Team created successfully!');
                fetchTeams();
            }
        } catch (error) {
            console.error('Error creating team:', error);
            alert('❌ Failed to create team');
        }
    };

    const handleAddMember = async (teamId: number, userId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ studentId: userId }),
            });

            if (response.ok) {
                alert('✅ Member added successfully!');
                fetchTeams();
                fetchAllUsers();
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Failed to add member'));
            }
        } catch (error) {
            console.error('Error adding member:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    const handleRemoveMember = async (teamId: number, userId: number) => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            const response = await fetch(`http://localhost:8080/api/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('✅ Member removed successfully!');
                fetchTeams();
                fetchAllUsers();
            }
        } catch (error) {
            console.error('Error removing member:', error);
            alert('❌ Failed to remove member');
        }
    };

    const handleSendJoinRequest = async () => {
        if (!selectedTeam) {
            alert('No team available to join');
            return;
        }
        try {
            const response = await fetch(`http://localhost:8080/api/teams/${selectedTeam.id}/join-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setJoinRequestSent(true);
                alert('✅ Join request sent to admin!');
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Failed to send request'));
            }
        } catch (error) {
            console.error('Error sending join request:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    // Get users not in team (for Admin to add)
    const getAvailableUsers = () => {
        if (!selectedTeam) return [];
        const memberIds = selectedTeam.members?.map(m => m.id) || [];
        return allUsers.filter(u => !memberIds.includes(u.id) && u.id !== user?.id);
    };

    // Check if current user is in team
    const isUserInTeam = () => {
        if (!selectedTeam) return false;
        return selectedTeam.members?.some(m => m.id === user?.id) || false;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[#666666]">Loading team...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Management</h1>
                    <p className="text-[#666666] text-sm">
                        {isAdmin ? 'Manage your team and members' : 'View your team and send join requests'}
                    </p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                        <Plus size={18} />
                        Create Team
                    </button>
                )}
            </div>

            {/* Current Team */}
            {teams.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
                    <Users size={48} className="mx-auto mb-3 text-[#444444]" />
                    <p className="text-lg text-white">No team yet</p>
                    <p className="text-sm text-[#666666]">
                        {isAdmin ? 'Create your first team to get started!' : 'No team available. Contact your admin.'}
                    </p>
                    {!isAdmin && (
                        <button
                            onClick={handleSendJoinRequest}
                            disabled={joinRequestSent}
                            className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send size={18} />
                            {joinRequestSent ? 'Request Sent ✓' : 'Request to Join'}
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Team Info Card */}
                    <div className="lg:col-span-1">
                        {teams.map((team) => (
                            <div key={team.id} className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-lg font-bold text-white">{team.name}</h3>
                                        <p className="text-sm text-[#666666] mt-1">{team.description}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-[#666666]">
                                            <User size={14} />
                                            <span>Lead: {team.admin?.name || 'Admin'}</span>
                                            <span>•</span>
                                            <Users size={14} />
                                            <span>{team.members?.length || 0} Members</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Join Request Button for non-members */}
                                {!isAdmin && !isUserInTeam() && (
                                    <button
                                        onClick={handleSendJoinRequest}
                                        disabled={joinRequestSent}
                                        className="mt-4 w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <Send size={16} />
                                        {joinRequestSent ? 'Request Sent ✓' : 'Request to Join Team'}
                                    </button>
                                )}

                                {!isAdmin && isUserInTeam() && (
                                    <div className="mt-4 p-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-center text-sm">
                                        ✅ You are a member of this team
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Members List */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-white font-medium flex items-center gap-2">
                                    <Users size={18} className="text-[#ff6b00]" />
                                    Team Members
                                </h3>
                                <span className="text-sm text-[#666666]">{selectedTeam?.members?.length || 0} members</span>
                            </div>
                            <div className="space-y-2">
                                {selectedTeam?.members?.map((member) => (
                                    <div key={member.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#ff6b00]/20 flex items-center justify-center text-[#ff6b00] font-bold">
                                                {member.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-white text-sm font-medium">{member.name}</p>
                                                <p className="text-xs text-[#666666] flex items-center gap-2">
                                                    @{member.username}
                                                    <span className="text-[#444444]">•</span>
                                                    {member.role}
                                                    {member.id === user?.id && (
                                                        <span className="text-[#ff6b00] text-xs">(You)</span>
                                                    )}
                                                    {member.role === 'ADMIN' && (
                                                        <span className="text-xs text-[#ff6b00]">👑 Admin</span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {isAdmin && member.id !== user?.id && (
                                            <button
                                                onClick={() => handleRemoveMember(selectedTeam.id, member.id)}
                                                className="text-[#666666] hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {(!selectedTeam?.members || selectedTeam.members.length === 0) && (
                                    <p className="text-center text-[#666666] py-4">No members yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Section - Admin Only */}
            {isAdmin && teams.length > 0 && selectedTeam && (
                <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-5">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                        <UserPlus size={18} className="text-[#ff6b00]" />
                        Add Members to Team
                    </h3>
                    {getAvailableUsers().length === 0 ? (
                        <p className="text-[#666666] text-center py-4">No pending users available to add</p>
                    ) : (
                        <div className="space-y-2">
                            {getAvailableUsers().map((pendingUser) => (
                                <div key={pendingUser.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[#ff6b00]/20 flex items-center justify-center text-[#ff6b00] font-bold">
                                            {pendingUser.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="text-white text-sm font-medium">{pendingUser.name}</p>
                                            <p className="text-xs text-[#666666]">@{pendingUser.username} • {pendingUser.role}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleAddMember(selectedTeam.id, pendingUser.id)}
                                        className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center gap-1"
                                    >
                                        <UserPlus size={14} />
                                        Add to Team
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Create Team Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Create Team</h2>
                            <button onClick={() => setShowModal(false)} className="text-[#666666] hover:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateTeam} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Team Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter team name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={3}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Describe your team"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                            >
                                Create Team
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamPage;