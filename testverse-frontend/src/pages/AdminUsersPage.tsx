import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Check, X, Clock, AlertCircle, RefreshCw, Trash2, UserCheck, UserX, Shield, GraduationCap } from 'lucide-react';

interface UserData {
    id: number;
    email: string;
    name: string;
    role: string;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';
    department?: string;
    mentor?: {
        id: number;
        name: string;
        email?: string;
        department?: string;
    } | null;
    createdAt: string;
}

interface MentorOption {
    id: string;
    name: string;
    department?: string;
    activeCount?: number;
}

// Backend URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const AdminUsersPage: React.FC = () => {
    const { user } = useAuth();
    const token = localStorage.getItem('token');
    const [users, setUsers] = useState<UserData[]>([]);
    const [pendingUsers, setPendingUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');

    // Mentor assignment state
    const [mentorModalUser, setMentorModalUser] = useState<UserData | null>(null);
    const [availableMentors, setAvailableMentors] = useState<MentorOption[]>([]);
    const [selectedMentorId, setSelectedMentorId] = useState<string>('');
    const [mentorLoading, setMentorLoading] = useState(false);
    const [mentorSubmitting, setMentorSubmitting] = useState(false);
    const [mentorModalError, setMentorModalError] = useState<string | null>(null);

    // Create Mentor/Faculty modal state
    const [showCreateMentor, setShowCreateMentor] = useState(false);
    const [createMentorForm, setCreateMentorForm] = useState({
        name: '',
        email: '',
        password: '',
        domain: '',
        canMentorDeveloper: false,
        canMentorTester: true
    });
    const [createMentorLoading, setCreateMentorLoading] = useState(false);
    const [createMentorError, setCreateMentorError] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
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
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/approve`, {
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
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/reject`, {
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
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/suspend`, {
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
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/activate`, {
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
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
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

    // ── Mentor Modal Handlers ────────────────────────────────────────────────
    const handleOpenMentorModal = async (targetUser: UserData): Promise<void> => {
        setMentorModalUser(targetUser);
        setSelectedMentorId(targetUser.mentor?.id ? String(targetUser.mentor.id) : '');
        setMentorModalError(null);
        setMentorLoading(true);

        const role = targetUser.role === 'TESTER' ? 'TESTER' : 'DEVELOPER';
        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/mentors?role=${encodeURIComponent(role)}`);
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(errText || 'Failed to load mentors');
            }
            const data = await response.json();
            setAvailableMentors(data || []);
            if (!targetUser.mentor?.id && data && data.length === 1) {
                setSelectedMentorId(String(data[0].id));
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to fetch mentors';
            setMentorModalError(msg);
        } finally {
            setMentorLoading(false);
        }
    };

    const handleAssignMentor = async (): Promise<void> => {
        if (!mentorModalUser || !selectedMentorId) return;

        setMentorSubmitting(true);
        setMentorModalError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${mentorModalUser.id}/mentor`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    mentorId: selectedMentorId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to assign mentor');
            }

            alert('✅ Mentor assigned successfully!');
            setMentorModalUser(null);
            await fetchUsers();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to assign mentor';
            console.error('❌ Error assigning mentor:', errorMessage);
            setMentorModalError(errorMessage);
        } finally {
            setMentorSubmitting(false);
        }
    };

    const handleCloseMentorModal = (): void => {
        setMentorModalUser(null);
        setAvailableMentors([]);
        setSelectedMentorId('');
        setMentorModalError(null);
    };

    // ============================================================
    // CREATE MENTOR HANDLER
    // ============================================================
    const handleCreateMentor = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!createMentorForm.domain.trim()) {
            setCreateMentorError('Domain / Specialization is required');
            return;
        }
        if (!createMentorForm.canMentorDeveloper && !createMentorForm.canMentorTester) {
            setCreateMentorError('Please select at least one role the mentor can supervise (Developer or Tester)');
            return;
        }

        setCreateMentorLoading(true);
        setCreateMentorError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/create-mentor`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(createMentorForm),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to create mentor');
            }
            const data = await response.json();
            alert(`✅ Mentor "${data.name}" created successfully! They can log in with their email and password.`);
            setShowCreateMentor(false);
            setCreateMentorForm({
                name: '',
                email: '',
                password: '',
                domain: '',
                canMentorDeveloper: false,
                canMentorTester: true
            });
            await fetchUsers();
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to create mentor';
            setCreateMentorError(msg);
        } finally {
            setCreateMentorLoading(false);
        }
    };

    const getStatusBadge = (status: string): string => {
        const styles: Record<string, string> = {
            'PENDING': 'bg-amber-50 text-amber-700 border-amber-200 font-medium',
            'ACTIVE': 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
            'SUSPENDED': 'bg-red-50 text-red-700 border-red-200 font-medium',
            'REJECTED': 'bg-slate-100 text-slate-600 border-slate-200 font-medium',
        };
        return styles[status] || 'bg-slate-100 text-slate-600 border-slate-200';
    };

    const getStatusIcon = (status: string): JSX.Element => {
        switch (status) {
            case 'PENDING': return <Clock size={14} className="text-amber-600" />;
            case 'ACTIVE': return <UserCheck size={14} className="text-emerald-600" />;
            case 'SUSPENDED': return <UserX size={14} className="text-red-600" />;
            case 'REJECTED': return <X size={14} className="text-slate-500" />;
            default: return <AlertCircle size={14} />;
        }
    };

    const isCurrentUser = (userId: number): boolean => {
        return userId === user?.id;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-slate-500 flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-[#0062E0] border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium">Loading users...</span>
                </div>
            </div>
        );
    }

    const displayedUsers = activeTab === 'pending' ? pendingUsers : users;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0F172A]">User Management</h1>
                    <p className="text-slate-500 text-sm">
                        {pendingUsers.length} users pending approval • {users.length} total users
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        🔒 Admin accounts cannot be deleted for security reasons
                    </p>
                </div>
                <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowCreateMentor(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-xs text-sm font-medium"
                >
                    <GraduationCap size={16} />
                    Create Mentor
                </button>
                <button
                    onClick={fetchUsers}
                    className="bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-xs text-sm font-medium"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
                </div>
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div className="flex gap-2 border-b border-[#E2E8F0] pb-2">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'pending'
                            ? 'bg-[#0062E0] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    Pending Approvals ({pendingUsers.length})
                </button>
                <button
                    onClick={() => setActiveTab('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        activeTab === 'all'
                            ? 'bg-[#0062E0] text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                >
                    All Users ({users.length})
                </button>
            </div>

            {displayedUsers.length === 0 ? (
                <div className="text-center py-16 bg-white border border-[#E2E8F0] rounded-xl shadow-xs">
                    {activeTab === 'pending' ? (
                        <>
                            <UserCheck size={48} className="mx-auto mb-3 text-[#00B388]" />
                            <p className="text-lg font-semibold text-[#0F172A]">No pending approvals</p>
                            <p className="text-sm text-slate-500">All users have been processed</p>
                        </>
                    ) : (
                        <>
                            <User size={48} className="mx-auto mb-3 text-slate-300" />
                            <p className="text-lg font-semibold text-[#0F172A]">No users found</p>
                            <p className="text-sm text-slate-500">Users will appear here when they register</p>
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
                                className={`bg-white border rounded-xl p-4 transition-all shadow-xs ${
                                    isOwnAccount
                                        ? 'border-[#0062E0]/50 bg-blue-50/20'
                                        : isAdminUser
                                            ? 'border-indigo-200 bg-white'
                                            : 'border-[#E2E8F0] hover:border-slate-300'
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                            isOwnAccount ? 'bg-[#EFF6FF] border border-[#BFDBFE]' :
                                                isAdminUser ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-100 border border-slate-200'
                                        }`}>
                                            {isAdminUser ? (
                                                <Shield size={18} className={isOwnAccount ? 'text-[#0062E0]' : 'text-indigo-600'} />
                                            ) : (
                                                <User size={18} className={isOwnAccount ? 'text-[#0062E0]' : 'text-slate-600'} />
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-[#0F172A] font-semibold flex items-center gap-1.5">
                                                {userData.name}
                                                {isOwnAccount && (
                                                    <span className="text-xs bg-[#EFF6FF] text-[#0062E0] font-medium px-2 py-0.5 rounded-full border border-[#BFDBFE]">
                                                        You
                                                    </span>
                                                )}
                                                {!isOwnAccount && isAdminUser && (
                                                    <span className="text-xs bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-full border border-indigo-200">
                                                        Admin
                                                    </span>
                                                )}
                                            </h3>
                                            <p className="text-sm text-slate-500">{userData.email}</p>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                                                    isAdminUser ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                                                }`}>
                                                    {userData.role}
                                                </span>
                                                <span className={`text-xs px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${getStatusBadge(userData.status)}`}>
                                                    {getStatusIcon(userData.status)}
                                                    {userData.status}
                                                </span>
                                            </div>

                                            {(userData.role === 'TESTER' || userData.role === 'DEVELOPER') && (
                                                <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                                                    <span className="text-slate-600 flex items-center gap-1">
                                                        <GraduationCap size={14} className="text-[#0062E0]" />
                                                        Mentor:
                                                        <span className={userData.mentor?.name ? "text-[#0062E0] font-semibold" : "text-amber-600 font-medium"}>
                                                            {userData.mentor?.name || 'Not Assigned'}
                                                        </span>
                                                    </span>
                                                    <button
                                                        onClick={() => handleOpenMentorModal(userData)}
                                                        className="text-xs px-2.5 py-0.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0062E0] border border-[#BFDBFE] rounded-full transition-colors flex items-center gap-1 font-medium"
                                                    >
                                                        {userData.mentor?.name ? 'Change Mentor' : 'Assign Mentor'}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {userData.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(userData.id)}
                                                    disabled={actionLoading === userData.id}
                                                    className="px-3 py-1.5 bg-[#00B388] hover:bg-[#008766] text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 font-medium shadow-xs"
                                                >
                                                    <Check size={14} />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(userData.id)}
                                                    disabled={actionLoading === userData.id}
                                                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 font-medium shadow-xs"
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
                                                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 font-medium shadow-xs"
                                            >
                                                <UserX size={14} />
                                                Suspend
                                            </button>
                                        )}

                                        {userData.status === 'SUSPENDED' && (
                                            <button
                                                onClick={() => handleActivate(userData.id)}
                                                disabled={actionLoading === userData.id}
                                                className="px-3 py-1.5 bg-[#00B388] hover:bg-[#008766] text-white rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 font-medium shadow-xs"
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
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 rounded-lg text-sm flex items-center gap-1 transition-colors disabled:opacity-50 font-medium"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        )}

                                        {/* Show "Protected" for admin accounts */}
                                        {!isOwnAccount && isAdminUser && (
                                            <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm flex items-center gap-1 cursor-not-allowed border border-indigo-200 font-medium">
                                                <Shield size={14} />
                                                Protected
                                            </span>
                                        )}

                                        {/* Show "Your Account" for own account */}
                                        {isOwnAccount && (
                                            <span className="px-3 py-1.5 bg-[#EFF6FF] text-[#0062E0] rounded-lg text-sm flex items-center gap-1 cursor-not-allowed border border-[#BFDBFE] font-medium">
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

            {/* ── Mentor Assignment / Reassignment Modal ── */}
            {mentorModalUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={20} className="text-[#0062E0]" />
                                <div>
                                    <h2 className="text-base font-bold text-[#0F172A]">
                                        {mentorModalUser.mentor ? 'Change Mentor' : 'Assign Mentor'}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {mentorModalUser.name} • {mentorModalUser.role} ({mentorModalUser.role === 'TESTER' ? 'TESTING' : 'DEVELOPMENT'})
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseMentorModal}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {mentorModalError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                <span>{mentorModalError}</span>
                            </div>
                        )}

                        {mentorLoading ? (
                            <div className="py-8 text-center text-slate-500 text-sm">
                                Loading {mentorModalUser.role === 'TESTER' ? 'Testing' : 'Development'} mentors...
                            </div>
                        ) : availableMentors.length === 0 ? (
                            <div className="py-6 text-center text-amber-700 text-xs bg-amber-50 border border-amber-200 rounded-lg p-3">
                                No active {mentorModalUser.role === 'TESTER' ? 'Testing' : 'Development'} mentors available.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                <label className="text-xs text-slate-600 font-medium block">
                                    Select an active {mentorModalUser.role === 'TESTER' ? 'Testing' : 'Development'} mentor:
                                </label>
                                {availableMentors.map((m) => {
                                    const isSelected = selectedMentorId === String(m.id);
                                    const isCurrent = mentorModalUser.mentor?.id && String(mentorModalUser.mentor.id) === String(m.id);

                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => setSelectedMentorId(String(m.id))}
                                            className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                                                isSelected
                                                    ? 'bg-[#EFF6FF] border-[#0062E0] shadow-sm'
                                                    : 'bg-[#F8FAFC] border-[#E2E8F0] hover:border-slate-300'
                                            }`}
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#0062E0]' : 'text-[#0F172A]'}`}>{m.name}</span>
                                                    {isCurrent && (
                                                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium border border-blue-200">
                                                            Current
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {m.department} • <span className="text-[#0062E0] font-semibold">{m.activeCount ?? 0}</span> active {mentorModalUser.role === 'TESTER' ? 'Testers' : 'Developers'}
                                                </div>
                                            </div>
                                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                                isSelected ? 'border-[#0062E0] bg-[#0062E0]' : 'border-slate-300 bg-white'
                                            }`}>
                                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                            <button
                                onClick={handleCloseMentorModal}
                                className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAssignMentor}
                                disabled={!selectedMentorId || mentorSubmitting || mentorLoading}
                                className="px-4 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white font-medium text-xs rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                            >
                                {mentorSubmitting ? 'Saving...' : 'Confirm Assignment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Create Mentor / Faculty Modal ── */}
            {showCreateMentor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white border border-[#E2E8F0] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                            <div className="flex items-center gap-2">
                                <GraduationCap size={20} className="text-purple-600" />
                                <div>
                                    <h2 className="text-base font-bold text-[#0F172A]">Create Mentor / Faculty</h2>
                                    <p className="text-xs text-slate-500">Create an active mentor account with direct access</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateMentor(false);
                                    setCreateMentorError(null);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {createMentorError && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex items-center gap-2">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                <span>{createMentorError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateMentor} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createMentorForm.name}
                                    onChange={(e) => setCreateMentorForm({ ...createMentorForm, name: e.target.value })}
                                    placeholder="e.g. Dr. Jane Smith"
                                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={createMentorForm.email}
                                    onChange={(e) => setCreateMentorForm({ ...createMentorForm, email: e.target.value })}
                                    placeholder="mentor@university.edu"
                                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Initial Password <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={createMentorForm.password}
                                    onChange={(e) => setCreateMentorForm({ ...createMentorForm, password: e.target.value })}
                                    placeholder="Min. 6 characters"
                                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Domain / Specialization <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={createMentorForm.domain}
                                    onChange={(e) => setCreateMentorForm({ ...createMentorForm, domain: e.target.value })}
                                    placeholder="e.g. Automation Testing, Performance Testing, API Testing..."
                                    className="w-full px-3 py-2 text-sm border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                                />
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Admin can enter any technical specialization (e.g. Automation Testing, AI Testing, Fullstack, etc.).
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">
                                    Can Mentor <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center gap-6 mt-2">
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                                        <input
                                            type="checkbox"
                                            checked={createMentorForm.canMentorDeveloper}
                                            onChange={(e) => setCreateMentorForm({ ...createMentorForm, canMentorDeveloper: e.target.checked })}
                                            className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                                        />
                                        <span>Developer</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 select-none">
                                        <input
                                            type="checkbox"
                                            checked={createMentorForm.canMentorTester}
                                            onChange={(e) => setCreateMentorForm({ ...createMentorForm, canMentorTester: e.target.checked })}
                                            className="w-4 h-4 rounded text-purple-600 border-slate-300 focus:ring-purple-500 cursor-pointer"
                                        />
                                        <span>Tester</span>
                                    </label>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-1">
                                    Select which student roles can register under or be assigned to this faculty.
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateMentor(false);
                                        setCreateMentorError(null);
                                    }}
                                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createMentorLoading}
                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium text-xs rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
                                >
                                    {createMentorLoading ? 'Creating...' : 'Create Mentor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsersPage;