import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, X, UserPlus, MessageSquare, Mail } from 'lucide-react';

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

const NotificationBell: React.FC = () => {
    const { token, user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (token) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 10000);
            return () => clearInterval(interval);
        }
    }, [token]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data || []);
                setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const handleAccept = async (notificationId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/notifications/${notificationId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('✅ You have joined the team successfully!');
                fetchNotifications();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }
        } catch (error) {
            console.error('Error accepting invitation:', error);
            alert('❌ Failed to accept invitation');
        }
    };

    const handleReject = async (notificationId: number) => {
        try {
            const response = await fetch(`http://localhost:8080/api/notifications/${notificationId}/reject`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                alert('❌ Invitation rejected');
                fetchNotifications();
            }
        } catch (error) {
            console.error('Error rejecting invitation:', error);
            alert('❌ Failed to reject invitation');
        }
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TEAM_INVITE':
                return <UserPlus size={16} className="text-[#ff6b00]" />;
            case 'MESSAGE':
                return <MessageSquare size={16} className="text-blue-400" />;
            default:
                return <Mail size={16} className="text-[#666666]" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >
                <Bell size={20} className="text-[#666666]" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b00] rounded-full animate-pulse"></span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
                    <div className="p-3 border-b border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#111111]">
                        <h3 className="text-white font-medium">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-xs text-[#ff6b00]">{unreadCount} new</span>
                        )}
                    </div>
                    <div className="p-2">
                        {notifications.length === 0 ? (
                            <p className="text-center text-[#666666] py-4">No notifications</p>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg mb-2 transition-colors ${
                                        !notification.isRead ? 'bg-[#1a1a1a] border border-[#2a2a2a]' : 'bg-[#0a0a0a]'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm text-white font-medium">{notification.title}</p>
                                            <p className="text-xs text-[#666666]">{notification.message}</p>
                                            <p className="text-[10px] text-[#444444] mt-1">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                            {notification.type === 'TEAM_INVITE' && !notification.isAccepted && !notification.isRead && (
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleAccept(notification.id)}
                                                        className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1"
                                                    >
                                                        <Check size={12} />
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(notification.id)}
                                                        className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1"
                                                    >
                                                        <X size={12} />
                                                        Decline
                                                    </button>
                                                </div>
                                            )}
                                            {notification.type === 'TEAM_INVITE' && notification.isAccepted && (
                                                <span className="text-xs text-green-400">✅ Accepted</span>
                                            )}
                                            {notification.type === 'TEAM_INVITE' && notification.isRead && !notification.isAccepted && (
                                                <span className="text-xs text-red-400">❌ Declined</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;