import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  fetchUnreadMessageCount,
  markTaskNotificationsAsRead,
  markAllNotificationsAsRead,
  markGeneralMessagesAsSeen,
  UnreadMessageSummary,
} from '../services/api';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isAccepted?: boolean;
  isTaskViewed?: boolean;
  taskId?: string;
  senderId?: string | number | null;
  teamId?: number | null;
  createdAt: string;
  updatedAt?: string;
}

interface AttentionContextType {
  hasTaskAttention: boolean;
  hasChatAttention: boolean;
  hasBellAttention: boolean;
  unreadNotificationCount: number;
  unreadChatCount: number;
  unreadTaskCount: number;
  unreadSenderIds: Array<string | number>;
  unreadCountsBySender: Record<string, number>;
  lastUnreadTimeBySender: Record<string, string>;
  lastMessageTimes: Record<string, string>;
  latestMessagePreviews: Record<string, string>;
  latestGeneralMessagePreview: string | null;
  latestGeneralMessageTime: string | null;
  generalUnreadCount: number;
  hasGeneralUnread: boolean;
  notifications: NotificationItem[];
  refreshAttention: () => Promise<void>;
  markTaskAttentionAsRead: () => Promise<void>;
  markBellAttentionAsRead: () => Promise<void>;
  markChatAttentionAsRead: (senderId?: string | number) => Promise<void>;
  markGeneralChatAsRead: () => Promise<void>;
}

const AttentionContext = createContext<AttentionContextType | undefined>(undefined);

export const AttentionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const [unreadSenderIds, setUnreadSenderIds] = useState<Array<string | number>>([]);
  const [unreadCountsBySender, setUnreadCountsBySender] = useState<Record<string, number>>({});
  const [lastUnreadTimeBySender, setLastUnreadTimeBySender] = useState<Record<string, string>>({});
  const [lastMessageTimes, setLastMessageTimes] = useState<Record<string, string>>({});
  const [latestMessagePreviews, setLatestMessagePreviews] = useState<Record<string, string>>({});
  const [latestGeneralMessagePreview, setLatestGeneralMessagePreview] = useState<string | null>(null);
  const [latestGeneralMessageTime, setLatestGeneralMessageTime] = useState<string | null>(null);
  const [generalUnreadCount, setGeneralUnreadCount] = useState<number>(0);
  const [hasGeneralUnread, setHasGeneralUnread] = useState<boolean>(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState<number>(0);
  const [unreadTaskCount, setUnreadTaskCount] = useState<number>(0);

  const fetchAttentionData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token || !isAuthenticated) {
      setNotifications([]);
      setUnreadChatCount(0);
      setUnreadSenderIds([]);
      setUnreadCountsBySender({});
      setLastUnreadTimeBySender({});
      setLastMessageTimes({});
      setLatestMessagePreviews({});
      setLatestGeneralMessagePreview(null);
      setLatestGeneralMessageTime(null);
      setGeneralUnreadCount(0);
      setHasGeneralUnread(false);
      setUnreadNotificationCount(0);
      setUnreadTaskCount(0);
      return;
    }

    try {
      // 1. Fetch Notifications
      const notifsData: NotificationItem[] = await fetchNotifications();
      const notifsList = Array.isArray(notifsData) ? notifsData : [];
      setNotifications(notifsList);

      // Unread notifications for bell
      const unreadBellNotifs = notifsList.filter((n) => !n.isRead);
      setUnreadNotificationCount(unreadBellNotifs.length);

      // Unread / unviewed task notifications for task attention
      const unviewedTasks = notifsList.filter(
        (n) => n.type === 'TASK' && (!n.isTaskViewed || !n.isRead)
      );
      setUnreadTaskCount(unviewedTasks.length);

      // 2. Fetch Unread Chat Message Summary (Direct + General)
      try {
        const chatData: UnreadMessageSummary = await fetchUnreadMessageCount();
        if (chatData) {
          const directCount =
            typeof chatData.directUnreadCount === 'number'
              ? chatData.directUnreadCount
              : typeof chatData.unreadCount === 'number'
              ? chatData.unreadCount
              : 0;

          setUnreadChatCount(directCount);

          if (Array.isArray(chatData.unreadSenderIds)) {
            setUnreadSenderIds(chatData.unreadSenderIds);
          } else {
            setUnreadSenderIds([]);
          }

          setUnreadCountsBySender(chatData.unreadCountsBySender || {});
          setLastUnreadTimeBySender(chatData.lastUnreadTimeBySender || {});
          setLastMessageTimes(chatData.lastMessageTimes || {});
          setLatestMessagePreviews(chatData.latestMessagePreviews || {});
          setLatestGeneralMessagePreview(chatData.latestGeneralMessagePreview || null);
          setLatestGeneralMessageTime(chatData.latestGeneralMessageTime || null);
          const genCount = typeof chatData.generalUnreadCount === 'number' ? chatData.generalUnreadCount : 0;
          setGeneralUnreadCount(genCount);
          setHasGeneralUnread(Boolean(chatData.hasGeneralUnread || genCount > 0));
        }
      } catch (chatError) {
        console.warn('Failed to fetch unread chat count:', chatError);
      }
    } catch (error) {
      console.error('Error fetching attention data:', error);
    }
  }, [isAuthenticated]);

  // Initial and recurring poll
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadChatCount(0);
      setUnreadSenderIds([]);
      setUnreadCountsBySender({});
      setLastUnreadTimeBySender({});
      setLastMessageTimes({});
      setLatestMessagePreviews({});
      setLatestGeneralMessagePreview(null);
      setLatestGeneralMessageTime(null);
      setGeneralUnreadCount(0);
      setHasGeneralUnread(false);
      setUnreadNotificationCount(0);
      setUnreadTaskCount(0);
      return;
    }

    void fetchAttentionData();

    // Lightweight polling interval (6 seconds)
    const interval = setInterval(() => {
      void fetchAttentionData();
    }, 6000);

    const handleFocus = () => {
      void fetchAttentionData();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated, user?.id, fetchAttentionData]);

  // Mark task attention as read
  const handleMarkTaskAttentionAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setUnreadTaskCount(0);
      setNotifications((prev) =>
        prev.map((n) =>
          n.type === 'TASK' ? { ...n, isTaskViewed: true, isRead: true } : n
        )
      );

      await markTaskNotificationsAsRead();
      void fetchAttentionData();
    } catch (error) {
      console.error('Failed to mark task attention as read:', error);
    }
  }, [fetchAttentionData]);

  // Mark bell notifications as read
  const handleMarkBellAttentionAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setUnreadNotificationCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true }))
      );

      await markAllNotificationsAsRead();
      void fetchAttentionData();
    } catch (error) {
      console.error('Failed to mark bell notifications as read:', error);
    }
  }, [fetchAttentionData]);

  // Mark direct chat attention as read for a specific user
  const handleMarkChatAttentionAsRead = useCallback(
    async (senderId?: string | number) => {
      try {
        if (senderId != null) {
          const sId = String(senderId);
          // Optimistic update for this sender
          setUnreadSenderIds((prev) =>
            prev.filter((id) => String(id) !== sId)
          );
          setUnreadCountsBySender((prev) => {
            const next = { ...prev };
            const removedCount = next[sId] || 0;
            delete next[sId];
            if (removedCount > 0) {
              setUnreadChatCount((cur) => Math.max(0, cur - removedCount));
            }
            return next;
          });

          const token = localStorage.getItem('token');
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
          await fetch(`${apiUrl}/api/messages/direct/${senderId}/seen`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
        }
        void fetchAttentionData();
      } catch (error) {
        console.error('Failed to mark chat as seen:', error);
      }
    },
    [fetchAttentionData]
  );

  // Mark general chat as read
  const handleMarkGeneralChatAsRead = useCallback(async () => {
    try {
      // Optimistic update
      setGeneralUnreadCount(0);
      setHasGeneralUnread(false);
      await markGeneralMessagesAsSeen();
      void fetchAttentionData();
    } catch (error) {
      console.error('Failed to mark general chat as seen:', error);
    }
  }, [fetchAttentionData]);

  const hasTaskAttention = unreadTaskCount > 0;
  const hasChatAttention = unreadChatCount > 0 || hasGeneralUnread || generalUnreadCount > 0;
  const hasBellAttention = unreadNotificationCount > 0;

  const value: AttentionContextType = {
    hasTaskAttention,
    hasChatAttention,
    hasBellAttention,
    unreadNotificationCount,
    unreadChatCount,
    unreadTaskCount,
    unreadSenderIds,
    unreadCountsBySender,
    lastUnreadTimeBySender,
    lastMessageTimes,
    latestMessagePreviews,
    latestGeneralMessagePreview,
    latestGeneralMessageTime,
    generalUnreadCount,
    hasGeneralUnread,
    notifications,
    refreshAttention: fetchAttentionData,
    markTaskAttentionAsRead: handleMarkTaskAttentionAsRead,
    markBellAttentionAsRead: handleMarkBellAttentionAsRead,
    markChatAttentionAsRead: handleMarkChatAttentionAsRead,
    markGeneralChatAsRead: handleMarkGeneralChatAsRead,
  };

  return (
    <AttentionContext.Provider value={value}>
      {children}
    </AttentionContext.Provider>
  );
};

export const useAttention = (): AttentionContextType => {
  const context = useContext(AttentionContext);
  if (context === undefined) {
    throw new Error('useAttention must be used within an AttentionProvider');
  }
  return context;
};
