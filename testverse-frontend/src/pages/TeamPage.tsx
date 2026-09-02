import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, Trash2, User, Plus, X } from 'lucide-react';

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

const TeamPage: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const token = localStorage.getItem('token');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
    const [joining, setJoining] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        fetchData();
        if (isAdmin) {
            fetchAllUsers();
        }
    }, []);

    const fetchData = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            console.log('🔍 Fetching team data...');
            console.log('🔍 Is Admin:', isAdmin);
            console.log('🔍 Token exists:', !!token);

            // ✅ Admin uses different endpoint
            if (isAdmin) {
                console.log('📤 Calling /admin-team...');
                const response = await fetch('http://localhost:8080/api/teams/admin-team', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                console.log('📥 Admin team response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ Admin team data:', data);

                    if (data && data.id) {
                        setTeams([data]);
                        setSelectedTeam(data);
                    } else {
                        setTeams([]);
                        setSelectedTeam(null);
                        setError('No team found. Please create one.');
                    }
                } else {
                    const errorData = await response.json();
                    console.error('❌ Error response:', errorData);
                    setError(errorData.error || 'Failed to fetch team');
                    setTeams([]);
                    setSelectedTeam(null);
                }
            } else {
                // Non-admin: get my teams
                console.log('📤 Calling /my-teams...');
                const response = await fetch('http://localhost:8080/api/teams/my-teams', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                console.log('📥 My teams response status:', response.status);

                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ My teams data:', data);
                    setTeams(data || []);
                    if (data && data.length > 0) {
                        setSelectedTeam(data[0]);
                    } else {
                        setSelectedTeam(null);
                    }
                }

                // Fetch available teams for non-admin users
                console.log('📤 Calling /available...');
                const availableResponse = await fetch('http://localhost:8080/api/teams/available', {
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                console.log('📥 Available teams response status:', availableResponse.status);

                if (availableResponse.ok) {
                    const data = await availableResponse.json();
                    console.log('✅ Available teams:', data);
                    setAvailableTeams(data || []);
                }
            }

        } catch (error) {
            console.error('❌ Error fetching team data:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllUsers = async (): Promise<void> => {
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
        }
    };

    const handleCreateTeam = async (e: React.FormEvent): Promise<void> => {
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
                alert('✅ Team created successfully!');
                setShowModal(false);
                setFormData({ name: '', description: '' });
                await fetchData();
                if (isAdmin) {
                    await fetchAllUsers();
                }
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Failed to create team'));
            }
        } catch (error) {
            console.error('Error creating team:', error);
            alert('❌ Failed to create team');
        }
    };

    const handleAddMember = async (teamId: number, userId: number): Promise<void> => {
        try {
            const response = await fetch(`http://localhost:8080/api/teams/${teamId}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ userId: userId }),
            });

            if (response.ok) {
                alert('✅ Member added successfully!');
                await fetchData();
                await fetchAllUsers();
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Failed to add member'));
            }
        } catch (error) {
            console.error('Error adding member:', error);
            alert('❌ Network error. Please try again.');
        }
    };

    const handleRemoveMember = async (teamId: number, userId: number): Promise<void> => {
        if (!confirm('Are you sure you want to remove this member?')) return;
        try {
            const response = await fetch(`http://localhost:8080/api/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('✅ Member removed successfully!');
                await fetchData();
                await fetchAllUsers();
            }
        } catch (error) {
            console.error('Error removing member:', error);
            alert('❌ Failed to remove member');
        }
    };

    const handleJoinTeam = async (teamId: number): Promise<void> => {
        setJoining(teamId);
        try {
            const response = await fetch(`http://localhost:8080/api/teams/${teamId}/request-join`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                alert('✅ ' + data.message);
                await fetchData();
            } else {
                const error = await response.json();
                alert('❌ ' + (error.error || 'Failed to join team'));
            }
        } catch (error) {
            console.error('Error joining team:', error);
            alert('❌ Network error. Please try again.');
        } finally {
            setJoining(null);
        }
    };

    // Get users not in team (for Admin to add)
    const getAvailableUsers = (): User[] => {
        if (!selectedTeam) return [];
        const memberIds = selectedTeam.members?.map(m => m.id) || [];
        return allUsers.filter(u => !memberIds.includes(u.id) && u.id !== user?.id);
    };

    // Check if current user is in team
    const isUserInTeam = (): boolean => {
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

    // Show error message
    if (error && !isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="text-6xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-white mb-2">Error Loading Team</h2>
                    <p className="text-[#666666]">{error}</p>
                    <button
                        onClick={fetchData}
                        className="mt-4 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
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
                    {!isAdmin && availableTeams.length > 0 && (
                        <div className="mt-6 max-w-md mx-auto">
                            <h4 className="text-sm text-[#666666] mb-3">Available Teams to Join:</h4>
                            <div className="space-y-2">
                                {availableTeams.map((team) => (
                                    <div key={team.id} className="flex items-center justify-between bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-3">
                                        <div className="text-left">
                                            <p className="text-white text-sm font-medium">{team.name}</p>
                                            <p className="text-xs text-[#666666]">{team.members?.length || 0} members</p>
                                        </div>
                                        <button
                                            onClick={() => handleJoinTeam(team.id)}
                                            disabled={joining === team.id}
                                            className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-3 py-1.5 rounded-lg text-sm transition-colors disabled:opacity-50"
                                        >
                                            {joining === team.id ? 'Joining...' : 'Join'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {!isAdmin && availableTeams.length === 0 && (
                        <p className="text-sm text-[#666666] mt-2">No teams available to join at the moment.</p>
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
                                        <p className="text-sm text-[#666666] mt-1">{team.description || 'No description'}</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-[#666666]">
                                            <User size={14} />
                                            <span>Lead: {team.admin?.name || 'Admin'}</span>
                                            <span>•</span>
                                            <Users size={14} />
                                            <span>{team.members?.length || 0} Members</span>
                                        </div>
                                    </div>
                                </div>

                                {isUserInTeam() && (
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
                                                <p className="text-white text-sm font-medium">
                                                    {member.name}
                                                    {member.id === user?.id && (
                                                        <span className="ml-2 text-[#ff6b00] text-xs">(You)</span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-[#666666] flex items-center gap-2">
                                                    @{member.username || member.email}
                                                    <span className="text-[#444444]">•</span>
                                                    {member.role}
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
                        <p className="text-[#666666] text-center py-4">No users available to add</p>
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
                                            <p className="text-xs text-[#666666]">@{pendingUser.username || pendingUser.email} • {pendingUser.role}</p>
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