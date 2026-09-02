import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Check, X, Clock, AlertCircle, RefreshCw, Trash2, UserCheck, UserX, Shield } from 'lucide-react';

interface UserData {
    id: number;
    email: string;
    name: string;
    role: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
    createdAt: string;
}

const AdminUsersPage: React.FC = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const [users, setUsers] = useState<UserData[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('http://localhost:8080/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to fetch users');
            }

            const data = await response.json();
            setUsers(data);

            const pending = data.filter((u: UserData) => u.status === 'PENDING');
            setPendingUsers(pending);

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
            console.error('❌ Error fetching users:', errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId: number): Promise<void> => {
        setActionLoading(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/approve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to approve user');
            }

            alert('✅ User approved successfully!');
            await fetchUsers();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to approve user';
            console.error('❌ Error approving user:', errorMessage);
            setError(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (userId: number): Promise<void> => {
        if (!confirm('Are you sure you want to reject this user?')) return;

        setActionLoading(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/reject`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to reject user');
            }

            alert('✅ User rejected successfully!');
            await fetchUsers();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to reject user';
            console.error('❌ Error rejecting user:', errorMessage);
            setError(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleSuspend = async (userId: number): Promise<void> => {
        if (!confirm('Are you sure you want to suspend this user?')) return;

        setActionLoading(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/suspend`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to suspend user');
            }

            alert('✅ User suspended successfully!');
            await fetchUsers();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to suspend user';
            console.error('❌ Error suspending user:', errorMessage);
            setError(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const handleActivate = async (userId: number): Promise<void> => {
        setActionLoading(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/activate`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to activate user');
            }

            alert('✅ User activated successfully!');
            await fetchUsers();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to activate user';
            console.error('❌ Error activating user:', errorMessage);
            setError(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    // ✅ SECURE DELETE FUNCTION - Prevents admin deletion
    const handleDeleteUser = async (userId: number): Promise<void> => {
        // Get the user being deleted
        const userToDelete = users.find(u => u.id === userId);

        // ❌ Prevent deleting your own account
        if (userId === user?.id) {
            alert('❌ You cannot delete your own admin account!');
            return;
        }

        // ❌ COMPLETELY PREVENT deleting other admin accounts
        if (userToDelete?.role === 'ADMIN') {
            alert('❌ Admin accounts cannot be deleted for security reasons.\n\nIf you need to remove this admin, please contact the system administrator.');
            return;
        }

        // ✅ Only allow deletion of non-admin users with strong confirmation
        if (!confirm(`⚠️ Are you sure you want to delete user "${userToDelete?.name}"?\n\nThis action will permanently remove this user and cannot be undone!`)) {
            return;
        }

        // ✅ Double confirmation for extra safety
        if (!confirm(`Are you absolutely sure? This will delete all data associated with "${userToDelete?.name}".`)) {
            return;
        }

        setActionLoading(userId);
        try {
            const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to delete user');
            }

            alert('✅ User deleted successfully!');
            await fetchUsers();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
            console.error('❌ Error deleting user:', errorMessage);
            setError(errorMessage);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string): string => {
        const styles: Record<string, string> = {
            'PENDING': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'ACTIVE': 'bg-green-500/20 text-green-400 border-green-500/30',
            'SUSPENDED': 'bg-red-500/20 text-red-400 border-red-500/30',
            'REJECTED': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
        };
        return styles[status] || 'bg-gray-500/20 text-gray-400';
    };

    const getStatusIcon = (status: string): JSX.Element => {
        switch (status) {
            case 'PENDING': return <Clock size={14} className="text-yellow-400" />;
            case 'ACTIVE': return <UserCheck size={14} className="text-green-400" />;
            case 'SUSPENDED': return <UserX size={14} className="text-red-400" />;
            case 'REJECTED': return <X size={14} className="text-gray-400" />;
            default: return <AlertCircle size={14} />;
        }
    };

    const isCurrentUser = (userId: number): boolean => {
        return userId === user?.id;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-[#666666]">Loading users...</div>
            </div>
        );
    }

    const displayedUsers = activeTab === 'pending' ? pendingUsers : users;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">User Management</h1>
                    <p className="text-[#666666] text-sm">
                        {pendingUsers.length} users pending approval • {users.length} total users
                    </p>
                    <p className="text-xs text-[#666666] mt-1">
                        🔒 Admin accounts cannot be deleted for security reasons
                    </p>
                </div>
                <button
                    onClick={fetchUsers}
                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                    <RefreshCw size={18} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="flex gap-2 border-b border-[#1a1a1a] pb-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'pending'
                            ? 'bg-[#ff6b00] text-white'
                            : 'text-[#666666] hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                >
                    Pending Approvals ({pendingUsers.length})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                        activeTab === 'all'
                            ? 'bg-[#ff6b00] text-white'
                            : 'text-[#666666] hover:text-white hover:bg-[#1a1a1a]'
                    }`}
                >
                    All Users ({users.length})
                </button>
            </div>

            {displayedUsers.length === 0 ? (
                <div className="text-center py-16 bg-[#111111] border border-[#1a1a1a] rounded-xl">
                    {activeTab === 'pending' ? (
                        <>
                            <UserCheck size={48} className="mx-auto mb-3 text-green-500" />
                            <p className="text-lg text-white">No pending approvals</p>
                            <p className="text-sm text-[#666666]">All users have been processed</p>
                        </>
                    ) : (
                        <>
                            <User size={48} className="mx-auto mb-3 text-[#444444]" />
                            <p className="text-lg text-white">No users found</p>
                            <p className="text-sm text-[#666666]">Users will appear here when they register</p>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {displayedUsers.map((userData) => {
                        const isOwnAccount = isCurrentUser(userData.id);
                        const isAdminUser = userData.role === 'ADMIN';

                        return (
                            <div
                                key={userData.id}
                                className={`bg-[#111111] border rounded-lg p-4 transition-all ${
                                    isOwnAccount
                                        ? 'border-[#ff6b00]/30 bg-[#1a1a1a]'
                                        : isAdminUser
                                            ? 'border-purple-500/30 bg-[#111111]'
                                            : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isOwnAccount ? 'bg-[#ff6b00]/20' :
                                                isAdminUser ? 'bg-purple-500/20' : 'bg-[#1a1a1a]'
                                        }`}>
                                            {isAdminUser ? (
                                                <Shield size={18} className={isOwnAccount ? 'text-[#ff6b00]' : 'text-purple-400'} />
                                            ) : (
                                                <User size={18} className={isOwnAccount ? 'text-[#ff6b00]' : 'text-[#666666]'} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-medium">
                                                {userData.name}
                                                {isOwnAccount && (
                                                    <span className="ml-2 text-xs text-[#ff6b00] font-normal">
                            (You)
                          </span>
                                                )}
                                                {!isOwnAccount && isAdminUser && (
                                                    <span className="ml-2 text-xs text-purple-400 font-normal">
                            (Admin)
                          </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-[#666666]">{userData.email}</p>
                                            <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                            isAdminUser ? 'bg-purple-500/20 text-purple-400' : 'bg-[#1a1a1a] text-[#666666]'
                        }`}>
                          {userData.role}
                        </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadge(userData.status)}`}>
                          {getStatusIcon(userData.status)}
                                                    {userData.status}
                        </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {userData.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(userData.id)}
                                                    disabled={actionLoading === userData.id}
                                                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    <Check size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(userData.id)}
                                                    disabled={actionLoading === userData.id}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                                >
                                                    <X size={14} />
                                                    Reject
                                                </button>
                                            </>
                                        )}

                                        {userData.status === 'ACTIVE' && !isOwnAccount && (
                                            <button
                                                onClick={() => handleSuspend(userData.id)}
                                                disabled={actionLoading === userData.id}
                                                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                            >
                                                <UserX size={14} />
                                                Suspend
                                            </button>
                                        )}

                                        {userData.status === 'SUSPENDED' && (
                                            <button
                                                onClick={() => handleActivate(userData.id)}
                                                disabled={actionLoading === userData.id}
                                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                            >
                                                <UserCheck size={14} />
                                                Activate
                                            </button>
                                        )}

                                        {/* 🔒 DELETE BUTTON - Hidden for admin accounts */}
                                        {!isOwnAccount && !isAdminUser && (
                                            <button
                                                onClick={() => handleDeleteUser(userData.id)}
                                                disabled={actionLoading === userData.id}
                                                className="px-3 py-1.5 bg-[#1a1a1a] hover:bg-red-600/20 text-[#666666] hover:text-red-400 rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}

                                        {/* Show "Protected" for admin accounts */}
                                        {!isOwnAccount && isAdminUser && (
                                            <span className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg text-sm flex items-center gap-1 cursor-not-allowed border border-purple-500/20">
                        <Shield size={14} />
                        Protected
                      </span>
                                        )}

                                        {/* Show "Your Account" for own account */}
                                        {isOwnAccount && (
                                            <span className="px-3 py-1.5 bg-[#ff6b00]/10 text-[#ff6b00] rounded-lg text-sm flex items-center gap-1 cursor-not-allowed border border-[#ff6b00]/20">
                        <UserCheck size={14} />
                        Your Account
                      </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;