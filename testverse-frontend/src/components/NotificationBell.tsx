import React, { useEffect, useRef, useState } from 'react';
import {
    Bell,
    Check,
    Mail,
    MessageSquare,
    UserPlus,
    X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    isAccepted: boolean;
    senderId: string | null;
    teamId: number | null;
    createdAt: string;
}

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8080';

const NotificationBell: React.FC = () => {

    const navigate = useNavigate();

    const [notifications, setNotifications] =
        useState<Notification[]>([]);

    const [showDropdown, setShowDropdown] =
        useState(false);

    const [unreadCount, setUnreadCount] =
        useState(0);

    const dropdownRef =
        useRef<HTMLDivElement>(null);


    // ============================================================
    // FETCH NOTIFICATIONS
    // ============================================================

    const fetchNotifications = async () => {

        const currentToken =
            localStorage.getItem('token');

        if (!currentToken) {
            return;
        }

        try {

            const response = await fetch(
                API_BASE_URL + '/api/notifications',
                {
                    headers: {
                        Authorization: 'Bearer ' + currentToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {

                console.error(
                    'Failed to fetch notifications:',
                    response.status
                );

                return;
            }

            const data: Notification[] =
                await response.json();

            setNotifications(data);

            setUnreadCount(
                data.filter(
                    (notification) =>
                        !notification.isRead
                ).length
            );

        } catch (error) {

            console.error(
                'Error fetching notifications:',
                error
            );
        }
    };


    // ============================================================
    // LOAD NOTIFICATIONS
    // ============================================================

    useEffect(() => {

        void fetchNotifications();

        const interval =
            setInterval(() => {
                void fetchNotifications();
            }, 10000);

        return () => clearInterval(interval);

    }, []);


    // ============================================================
    // CLOSE DROPDOWN WHEN CLICKING OUTSIDE
    // ============================================================

    useEffect(() => {

        const handleClickOutside =
            (event: MouseEvent) => {

                if (
                    dropdownRef.current &&
                    !dropdownRef.current.contains(
                        event.target as Node
                    )
                ) {

                    setShowDropdown(false);
                }
            };

        document.addEventListener(
            'mousedown',
            handleClickOutside
        );

        return () => {

            document.removeEventListener(
                'mousedown',
                handleClickOutside
            );
        };

    }, []);


    // ============================================================
    // MARK NOTIFICATION AS READ
    // ============================================================

    const markAsRead = async (notificationId: string) => {
        const currentToken = localStorage.getItem('token');

        if (!currentToken) return;

        try {
            const response = await fetch(
                API_BASE_URL +
                '/api/notifications/' +
                notificationId +
                '/read',
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: 'Bearer ' + currentToken,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (!response.ok) {
                console.error(
                    'Failed to mark notification as read:',
                    response.status
                );
                return;
            }

            // Immediately update the notification in the UI
            setNotifications((previousNotifications) =>
                previousNotifications.map((notification) =>
                    notification.id === notificationId
                        ? {
                            ...notification,
                            isRead: true
                        }
                        : notification
                )
            );

            // Immediately remove it from unread count
            setUnreadCount((previousCount) =>
                Math.max(0, previousCount - 1)
            );

        } catch (error) {
            console.error(
                'Error marking notification as read:',
                error
            );
        }
    };
    // ============================================================
    // HANDLE NOTIFICATION CLICK
    // ============================================================

    const handleNotificationClick =
        async (notification: Notification) => {

            /*
             * Mark the notification as read first.
             */
            if (!notification.isRead) {

                await markAsRead(
                    notification.id
                );
            }


            /*
             * MESSAGE notification
             *
             * Close the notification dropdown.
             *
             * The Chat page can then be opened.
             */
            if (notification.type === 'MESSAGE') {

                setShowDropdown(false);

                if (notification.senderId) {

                    navigate(
                        `/chat?userId=${notification.senderId}`
                    );

                } else {

                    navigate('/chat');

                }

                return;
            }


            /*
             * Registration notification
             *
             * Clicking this takes the admin
             * to the Users page.
             */
            if (
                notification.type === 'SYSTEM' &&
                notification.title === 'New Registration Request'
            ) {

                setShowDropdown(false);

                navigate('/users');

                return;
            }

        };

    // ============================================================
    // ACCEPT TEAM INVITATION
    // ============================================================

    const handleAccept =
        async (notificationId: string) => {

            const currentToken =
                localStorage.getItem('token');

            if (!currentToken) {
                return;
            }

            try {

                const response = await fetch(
                    API_BASE_URL +
                    '/api/notifications/' +
                    notificationId +
                    '/accept',
                    {
                        method: 'POST',

                        headers: {
                            Authorization:
                                'Bearer ' + currentToken,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

                if (response.ok) {

                    alert(
                        'You have joined the team successfully!'
                    );

                    void fetchNotifications();

                    setTimeout(() => {

                        window.location.reload();

                    }, 1000);

                } else {

                    const errorData =
                        await response.json().catch(() => null);

                    alert(
                        errorData?.error ||
                        'Failed to accept invitation'
                    );
                }

            } catch (error) {

                console.error(
                    'Error accepting invitation:',
                    error
                );

                alert(
                    'Failed to accept invitation'
                );
            }
        };


    // ============================================================
    // REJECT TEAM INVITATION
    // ============================================================

    const handleReject =
        async (notificationId: string) => {

            const currentToken =
                localStorage.getItem('token');

            if (!currentToken) {
                return;
            }

            try {

                const response = await fetch(
                    API_BASE_URL +
                    '/api/notifications/' +
                    notificationId +
                    '/reject',
                    {
                        method: 'POST',

                        headers: {
                            Authorization:
                                'Bearer ' + currentToken,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

                if (response.ok) {

                    alert(
                        'Invitation rejected'
                    );

                    void fetchNotifications();

                } else {

                    const errorData =
                        await response.json().catch(() => null);

                    alert(
                        errorData?.error ||
                        'Failed to reject invitation'
                    );
                }

            } catch (error) {

                console.error(
                    'Error rejecting invitation:',
                    error
                );

                alert(
                    'Failed to reject invitation'
                );
            }
        };


    // ============================================================
    // NOTIFICATION ICON
    // ============================================================

    const getNotificationIcon =
        (type: string) => {

            switch (type) {

                case 'TEAM_INVITE':

                    return (
                        <UserPlus
                            size={16}
                            className="text-[#ff6b00]"
                        />
                    );

                case 'MESSAGE':

                    return (
                        <MessageSquare
                            size={16}
                            className="text-blue-400"
                        />
                    );

                case 'SYSTEM':

                    return (
                        <Bell
                            size={16}
                            className="text-[#ff6b00]"
                        />
                    );

                default:

                    return (
                        <Mail
                            size={16}
                            className="text-[#666666]"
                        />
                    );
            }
        };


    // ============================================================
    // UI
    // ============================================================

    return (

        <div
            className="relative"
            ref={dropdownRef}
        >

            <button
                onClick={() =>
                    setShowDropdown(!showDropdown)
                }

                className="relative p-2 rounded-lg hover:bg-[#1a1a1a] transition-colors"
            >

                <Bell
                    size={20}
                    className="text-[#666666]"
                />

                {unreadCount > 0 && (

                    <span
                        className="absolute top-1 right-1 w-2 h-2 bg-[#ff6b00] rounded-full animate-pulse"
                    />

                )}

            </button>


            {showDropdown && (

                <div
                    className="absolute right-0 mt-2 w-96 bg-[#111111] border border-[#1a1a1a] rounded-xl shadow-lg max-h-96 overflow-y-auto z-50"
                >

                    <div
                        className="p-3 border-b border-[#1a1a1a] flex items-center justify-between sticky top-0 bg-[#111111]"
                    >

                        <h3 className="text-white font-medium">
                            Notifications
                        </h3>

                        {unreadCount > 0 && (

                            <span className="text-xs text-[#ff6b00]">
                                {unreadCount} new
                            </span>

                        )}

                    </div>


                    <div className="p-2">

                        {notifications.length === 0 ? (

                            <p className="text-center text-[#666666] py-4">
                                No notifications
                            </p>

                        ) : (

                            notifications.map(
                                (notification) => {

                                    const isRegistrationRequest =
                                        notification.type === 'SYSTEM' &&
                                        notification.title === 'New Registration Request';

                                    return (

                                        <div
                                            key={notification.id}

                                            onClick={() => {

                                                if (
                                                    isRegistrationRequest ||
                                                    notification.type === 'MESSAGE'
                                                ) {

                                                    void handleNotificationClick(
                                                        notification
                                                    );

                                                }

                                            }}

                                            className={
                                                'p-3 rounded-lg mb-2 transition-colors ' +

                                                (
                                                    !notification.isRead
                                                        ? 'bg-[#1a1a1a] border border-[#2a2a2a]'
                                                        : 'bg-[#0a0a0a]'
                                                ) +

                                                (
                                                    isRegistrationRequest
                                                        ? ' cursor-pointer hover:bg-[#222222]'
                                                        : ''
                                                )
                                            }
                                        >

                                            <div className="flex items-start gap-3">

                                                <div className="mt-1">

                                                    {getNotificationIcon(
                                                        notification.type
                                                    )}

                                                </div>


                                                <div className="flex-1">

                                                    <p className="text-sm text-white font-medium">
                                                        {notification.title}
                                                    </p>


                                                    <p className="text-xs text-[#666666]">
                                                        {notification.message}
                                                    </p>


                                                    <p className="text-[10px] text-[#444444] mt-1">

                                                        {new Date(
                                                            notification.createdAt
                                                        ).toLocaleString()}

                                                    </p>


                                                    {isRegistrationRequest && (

                                                        <p className="text-xs text-[#ff6b00] mt-2">
                                                            Click to review registration
                                                        </p>

                                                    )}


                                                    {notification.type ===
                                                        'TEAM_INVITE' &&

                                                        !notification.isAccepted &&

                                                        !notification.isRead && (

                                                            <div
                                                                className="flex gap-2 mt-2"
                                                                onClick={(event) =>
                                                                    event.stopPropagation()
                                                                }
                                                            >

                                                                <button
                                                                    onClick={() =>
                                                                        void handleAccept(
                                                                            notification.id
                                                                        )
                                                                    }

                                                                    className="bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1"
                                                                >

                                                                    <Check
                                                                        size={12}
                                                                    />

                                                                    Accept

                                                                </button>


                                                                <button
                                                                    onClick={() =>
                                                                        void handleReject(
                                                                            notification.id
                                                                        )
                                                                    }

                                                                    className="bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1 rounded-lg text-xs transition-colors flex items-center gap-1"
                                                                >

                                                                    <X
                                                                        size={12}
                                                                    />

                                                                    Decline

                                                                </button>

                                                            </div>

                                                        )}


                                                    {notification.type ===
                                                        'TEAM_INVITE' &&

                                                        notification.isAccepted && (

                                                            <span className="text-xs text-green-400">
                                                                Accepted
                                                            </span>

                                                        )}


                                                    {notification.type ===
                                                        'TEAM_INVITE' &&

                                                        notification.isRead &&

                                                        !notification.isAccepted && (

                                                            <span className="text-xs text-red-400">
                                                                Declined
                                                            </span>

                                                        )}

                                                </div>

                                            </div>

                                        </div>

                                    );
                                }
                            )

                        )}

                    </div>

                </div>

            )}

        </div>
    );
};


export default NotificationBell;