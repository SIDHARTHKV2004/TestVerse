import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    User, Mail, Key, Save, Camera, Lock, Edit2, X, Calendar, Award,
    LogOut
} from 'lucide-react';

const ProfilePage: React.FC = () => {
    const { user, token } = useAuth();
    const [loading, setLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile form
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        bio: '',
    });

    // Password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    useEffect(() => {
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                bio: (user as any).bio || '',
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        try {
            const response = await fetch('http://localhost:8080/api/users/update', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(profile),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Profile updated successfully!' });
                const updatedUser = await response.json();
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setIsEditing(false);
                window.location.reload();
            } else {
                setMessage({ type: 'error', text: 'Failed to update profile' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            setLoading(false);
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/users/change-password', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Password changed successfully!' });
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setShowPasswordModal(false);
            } else {
                const error = await response.json();
                setMessage({ type: 'error', text: error.message || 'Failed to change password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        if (user) {
            setProfile({
                name: user.name || '',
                email: user.email || '',
                bio: (user as any).bio || '',
            });
        }
        setMessage(null);
    };

    const handleLogout = () => {
        // Clear all localStorage data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page
        window.location.href = '/';
    };

    // Get user stats with safe fallbacks
    const userPoints = (user as any)?.points || 0;
    const userStreak = (user as any)?.streakDays || 0;
    const userBio = (user as any)?.bio || 'No bio added yet';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
                    <p className="text-slate-500 text-sm">View and manage your account information</p>
                </div>
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all border border-red-200 shadow-sm"
                >
                    <LogOut size={18} />
                    Logout
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-xl font-medium ${
                    message.type === 'success'
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                }`}>
                    {message.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        {/* Profile Header with Avatar */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-[#0062E0] flex items-center justify-center text-white text-3xl font-bold shadow-md">
                                    {profile.name?.charAt(0) || 'U'}
                                </div>
                                {isEditing && (
                                    <button className="absolute bottom-0 right-0 bg-[#0062E0] p-1.5 rounded-full hover:bg-[#0050B8] text-white shadow-sm transition-colors">
                                        <Camera size={14} />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-slate-900">{profile.name || 'User'}</h2>
                                    <span className="text-xs px-3 py-0.5 rounded-full bg-blue-50 text-[#0062E0] border border-blue-200 font-semibold">
                                        {user?.role || 'Student'}
                                    </span>
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                        <Calendar size={12} />
                                        Joined {new Date().toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                        <Award size={12} />
                                        {userPoints} points
                                    </span>
                                </div>
                            </div>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors border border-slate-200"
                                >
                                    <Edit2 size={16} />
                                    Edit Profile
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancel}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors border border-slate-200"
                                >
                                    <X size={16} />
                                    Cancel
                                </button>
                            )}
                        </div>

                        {/* Profile Information - View Mode */}
                        {!isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Full Name</label>
                                        <p className="text-slate-900 font-medium">{profile.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Email Address</label>
                                        <p className="text-slate-900 font-medium">{profile.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Bio</label>
                                    <p className="text-slate-600">{userBio}</p>
                                </div>
                            </div>
                        ) : (
                            /* Profile Information - Edit Mode */
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors"
                                                placeholder="Your name"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full bg-white border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors"
                                                placeholder="Your email"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        rows={3}
                                        className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-6 py-2.5 rounded-lg transition-colors font-medium shadow-sm flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition-colors border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Change Password Button */}
                        {!isEditing && (
                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="text-[#0062E0] hover:text-[#0050B8] font-semibold text-sm flex items-center gap-2 transition-colors"
                                >
                                    <Lock size={16} />
                                    Change Password
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Card */}
                <div className="lg:col-span-1">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-slate-900 font-semibold mb-4">Account Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">Role</span>
                                <span className="text-[#0062E0] font-bold capitalize">{user?.role?.toLowerCase() || 'Student'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">Points</span>
                                <span className="text-slate-900 font-bold">{userPoints}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">Streak Days</span>
                                <span className="text-slate-900 font-bold">{userStreak}</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">Tasks Created</span>
                                <span className="text-slate-900 font-bold">0</span>
                            </div>
                            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-100 rounded-xl">
                                <span className="text-sm font-medium text-slate-500">Tasks Completed</span>
                                <span className="text-slate-900 font-bold">0</span>
                            </div>
                        </div>

                        {/* Logout Button at bottom of stats card */}
                        <div className="mt-5 pt-4 border-t border-slate-100">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border border-red-200 shadow-sm"
                            >
                                <LogOut size={18} />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Lock size={20} className="text-[#0062E0]" />
                                Change Password
                            </h2>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors"
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#0062E0] hover:bg-[#0050B8] text-white px-4 py-2.5 rounded-lg font-medium shadow-sm transition-colors flex items-center justify-center gap-2"
                                >
                                    <Key size={18} />
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors border border-slate-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;