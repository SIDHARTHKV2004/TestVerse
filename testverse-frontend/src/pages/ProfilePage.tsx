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
                    <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                    <p className="text-[#666666] text-sm">View and manage your account information</p>
                </div>
                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all border border-red-600/30 hover:border-red-600"
                >
                    <LogOut size={18} />
                    Logout
                </button>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-2">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                        {/* Profile Header with Avatar */}
                        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-[#1a1a1a]">
                            <div className="relative">
                                <div className="w-20 h-20 rounded-full bg-[#ff6b00] flex items-center justify-center text-white text-3xl font-bold">
                                    {profile.name?.charAt(0) || 'U'}
                                </div>
                                {isEditing && (
                                    <button className="absolute bottom-0 right-0 bg-[#ff6b00] p-1 rounded-full hover:bg-[#cc5500] transition-colors">
                                        <Camera size={14} className="text-white" />
                                    </button>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-xl font-bold text-white">{profile.name || 'User'}</h2>
                                    <span className="text-xs px-3 py-1 rounded-full bg-[#ff6b00]/20 text-[#ff6b00]">
                    {user?.role || 'Student'}
                  </span>
                                </div>
                                <p className="text-sm text-[#666666]">{profile.email}</p>
                                <div className="flex items-center gap-4 mt-2">
                  <span className="text-xs text-[#666666] flex items-center gap-1">
                    <Calendar size={12} />
                    Joined {new Date().toLocaleDateString()}
                  </span>
                                    <span className="text-xs text-[#666666] flex items-center gap-1">
                    <Award size={12} />
                                        {userPoints} points
                  </span>
                                </div>
                            </div>
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-[#2a2a2a]"
                                >
                                    <Edit2 size={16} />
                                    Edit Profile
                                </button>
                            ) : (
                                <button
                                    onClick={handleCancel}
                                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors border border-[#2a2a2a]"
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
                                        <label className="block text-xs text-[#666666] uppercase tracking-wider mb-1">Full Name</label>
                                        <p className="text-white">{profile.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-[#666666] uppercase tracking-wider mb-1">Email Address</label>
                                        <p className="text-white">{profile.email}</p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-[#666666] uppercase tracking-wider mb-1">Bio</label>
                                    <p className="text-[#b0b0b0]">{userBio}</p>
                                </div>
                            </div>
                        ) : (
                            /* Profile Information - Edit Mode */
                            <form onSubmit={handleProfileUpdate} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm text-[#666666] mb-1">Full Name</label>
                                        <div className="relative">
                                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                                            <input
                                                type="text"
                                                value={profile.name}
                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                                placeholder="Your name"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm text-[#666666] mb-1">Email Address</label>
                                        <div className="relative">
                                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#666666]" />
                                            <input
                                                type="email"
                                                value={profile.email}
                                                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                                className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg pl-10 pr-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                                placeholder="Your email"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-[#666666] mb-1">Bio</label>
                                    <textarea
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        rows={3}
                                        className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Save size={18} />
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-6 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {/* Change Password Button */}
                        {!isEditing && (
                            <div className="mt-6 pt-6 border-t border-[#1a1a1a] flex items-center justify-between">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="text-[#ff6b00] hover:text-[#ff8c38] text-sm flex items-center gap-2 transition-colors"
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
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6">
                        <h3 className="text-white font-medium mb-4">Account Stats</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                                <span className="text-sm text-[#666666]">Role</span>
                                <span className="text-[#ff6b00] font-bold capitalize">{user?.role?.toLowerCase() || 'Student'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                                <span className="text-sm text-[#666666]">Points</span>
                                <span className="text-white font-bold">{userPoints}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                                <span className="text-sm text-[#666666]">Streak Days</span>
                                <span className="text-white font-bold">{userStreak}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                                <span className="text-sm text-[#666666]">Tasks Created</span>
                                <span className="text-white font-bold">0</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-[#0a0a0a] rounded-lg">
                                <span className="text-sm text-[#666666]">Tasks Completed</span>
                                <span className="text-white font-bold">0</span>
                            </div>
                        </div>

                        {/* Logout Button at bottom of stats card */}
                        <div className="mt-4 pt-4 border-t border-[#1a1a1a]">
                            <button
                                onClick={handleLogout}
                                className="w-full bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all border border-red-600/20 hover:border-red-600"
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
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-[#111111] border border-[#1a1a1a] rounded-xl p-6 max-w-md w-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Lock size={20} className="text-[#ff6b00]" />
                                Change Password
                            </h2>
                            <button
                                onClick={() => setShowPasswordModal(false)}
                                className="text-[#666666] hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Current Password</label>
                                <input
                                    type="password"
                                    value={passwordData.currentPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter current password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.newPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Enter new password"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-[#666666] mb-1">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={passwordData.confirmPassword}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
                                    placeholder="Confirm new password"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Key size={18} />
                                    {loading ? 'Updating...' : 'Update Password'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-4 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
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