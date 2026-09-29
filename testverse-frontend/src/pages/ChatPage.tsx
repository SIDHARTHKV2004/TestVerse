import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttention } from '../context/AttentionContext';
import { AttentionDot } from '../components/AttentionDot';
import {
    Send,
    Check,
    CheckCheck,
    Users,
    User,
    Globe,
    Search,
    ChevronLeft
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

interface Message {
  id: number;
  content: string;
  sender: {
    id: string;
    name: string;
    username?: string;
    role: string;
  };
  receiver?: {
    id: string;
    name: string;
    username?: string;
    role: string;
  } | null;
  messageType: 'GENERAL' | 'DIRECT';
  createdAt: string;
  isSeen?: boolean;
}

interface ChatUser {
  id: string;
  name: string;
  username?: string;
  email?: string;
  role: string;
}

type ChatMode = 'GENERAL' | 'DIRECT' | null;

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const {
    unreadSenderIds,
    unreadCountsBySender,
    lastUnreadTimeBySender,
    lastMessageTimes,
    latestMessagePreviews,
    latestGeneralMessagePreview,
    latestGeneralMessageTime,
    generalUnreadCount,
    hasGeneralUnread,
    markGeneralChatAsRead,
    markChatAttentionAsRead,
    refreshAttention,
  } = useAttention();

  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('token');

  // ============================================================
  // STATE
  // ============================================================
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatMode, setChatMode] = useState<ChatMode>(null);
  const [selectedUser, setSelectedUser] = useState<ChatUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Local overrides for real-time responsiveness when messages arrive or are sent
  const [localMessageTimes, setLocalMessageTimes] = useState<Record<string, string>>({});
  const [localMessagePreviews, setLocalMessagePreviews] = useState<Record<string, string>>({});
  const [localGeneralTime, setLocalGeneralTime] = useState<string | null>(null);
  const [localGeneralPreview, setLocalGeneralPreview] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync latest message preview and timestamp when active messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (chatMode === 'DIRECT' && selectedUser) {
        const uId = String(selectedUser.id);
        setLocalMessageTimes((prev) => ({ ...prev, [uId]: lastMsg.createdAt }));
        setLocalMessagePreviews((prev) => ({ ...prev, [uId]: lastMsg.content }));
      } else if (chatMode === 'GENERAL') {
        setLocalGeneralTime(lastMsg.createdAt);
        setLocalGeneralPreview(lastMsg.content);
      }
    }
  }, [messages, chatMode, selectedUser]);

  // Format timestamp for conversation rows (compact: 11:16 PM, Yesterday, or Sep 28)
  const formatConversationTime = (dateString?: string | null): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
      }
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // ============================================================
  // SCROLL TO BOTTOM
  // ============================================================
  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  };

  // ============================================================
  // LOAD USERS
  // ============================================================
  const fetchUsers = async (): Promise<ChatUser[]> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch chat users');
        return [];
      }

      const data = await response.json();
      const chatUsers = Array.isArray(data) ? data : [];
      setUsers(chatUsers);
      return chatUsers;
    } catch (error) {
      console.error('Error fetching chat users:', error);
      return [];
    }
  };

  // ============================================================
  // FETCH GENERAL MESSAGES
  // ============================================================
  const fetchGeneralMessages = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/messages/general`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch General messages');
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
      setError(null);
    } catch (error) {
      console.error('Error fetching General messages:', error);
      setError('Unable to load General chat.');
    }
  };

  // ============================================================
  // MARK DIRECT MESSAGES AS SEEN
  // ============================================================
  const markMessagesAsSeen = async (targetUserId: string): Promise<void> => {
    try {
      await fetch(`${API_BASE_URL}/api/messages/direct/${targetUserId}/seen`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      void refreshAttention();
    } catch (error) {
      console.error('Error marking messages as seen:', error);
    }
  };

  // ============================================================
  // FETCH DIRECT MESSAGES
  // ============================================================
  const fetchDirectMessages = async (targetUserId: string): Promise<void> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/messages/direct/${targetUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch direct messages');
      }

      const data = await response.json();
      setMessages(Array.isArray(data) ? data : []);
      setError(null);
      await markMessagesAsSeen(targetUserId);
    } catch (error) {
      console.error('Error fetching direct messages:', error);
      setError('Unable to load this conversation.');
    }
  };

  // ============================================================
  // FETCH CURRENT CHAT
  // ============================================================
  const fetchCurrentChat = async (): Promise<void> => {
    if (chatMode === 'GENERAL') {
      await fetchGeneralMessages();
      await markGeneralChatAsRead();
      return;
    }

    if (chatMode === 'DIRECT' && selectedUser) {
      await fetchDirectMessages(selectedUser.id);
    }
  };

  // ============================================================
  // INITIAL LOAD
  // ============================================================
  useEffect(() => {
    const loadChat = async (): Promise<void> => {
      setLoading(true);
      const loadedUsers = await fetchUsers();

      const targetUserId = searchParams.get('userId');
      if (targetUserId) {
        const targetUser = loadedUsers.find(
          (chatUser) => String(chatUser.id) === String(targetUserId)
        );

        if (targetUser) {
          setChatMode('DIRECT');
          setSelectedUser(targetUser);
          setShowMobileChat(true);
          await markChatAttentionAsRead(targetUser.id);
          await fetchDirectMessages(targetUser.id);
          setLoading(false);
          return;
        }
      }

      // Check if general chat was explicitly requested via URL
      if (searchParams.get('chat') === 'general') {
        setChatMode('GENERAL');
        setSelectedUser(null);
        setShowMobileChat(true);
        await markGeneralChatAsRead();
        await fetchGeneralMessages();
        setLoading(false);
        return;
      }

      // Default state: Keep conversations intact without marking anything read
      setChatMode(null);
      setSelectedUser(null);
      setLoading(false);
    };

    void loadChat();
  }, []);

  // ============================================================
  // SWITCH CONVERSATION ON URL PARAMS (Active Today click)
  // ============================================================
  useEffect(() => {
    const targetUserId = searchParams.get('userId');
    if (targetUserId && users.length > 0) {
      const targetUser = users.find(
        (chatUser) => String(chatUser.id) === String(targetUserId)
      );

      if (targetUser && (!selectedUser || String(selectedUser.id) !== String(targetUser.id))) {
        setChatMode('DIRECT');
        setSelectedUser(targetUser);
        setShowMobileChat(true);
        void markChatAttentionAsRead(targetUser.id);
        void fetchDirectMessages(targetUser.id);
      }
    }
  }, [searchParams, users]);

  // ============================================================
  // POLLING
  // ============================================================
  useEffect(() => {
    const interval = setInterval(() => {
      if (chatMode !== null) {
        void fetchCurrentChat();
      }
      void refreshAttention();
    }, 4000);

    return () => clearInterval(interval);
  }, [chatMode, selectedUser]);

  // ============================================================
  // ONLINE HEARTBEAT
  // ============================================================
  useEffect(() => {
    const sendHeartbeat = async (): Promise<void> => {
      try {
        await fetch(`${API_BASE_URL}/api/messages/heartbeat`, {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    };

    void sendHeartbeat();
    const interval = setInterval(() => {
      void sendHeartbeat();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // SCROLL WHEN MESSAGES CHANGE
  // ============================================================
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================================
  // SWITCH TO GENERAL CHAT
  // ============================================================
  const openGeneralChat = async (): Promise<void> => {
    setChatMode('GENERAL');
    setSelectedUser(null);
    setMessages([]);
    setError(null);
    setLoading(true);
    setShowMobileChat(true);

    await markGeneralChatAsRead();
    await fetchGeneralMessages();
    setLoading(false);
  };

  // ============================================================
  // OPEN DIRECT CHAT
  // ============================================================
  const openDirectChat = async (chatUser: ChatUser): Promise<void> => {
    setChatMode('DIRECT');
    setSelectedUser(chatUser);
    setMessages([]);
    setError(null);
    setLoading(true);
    setShowMobileChat(true);

    await markChatAttentionAsRead(chatUser.id);
    await fetchDirectMessages(chatUser.id);
    setLoading(false);
  };

  // ============================================================
  // SEND MESSAGE
  // ============================================================
  const sendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!newMessage.trim()) {
      return;
    }

    if (chatMode === 'DIRECT' && !selectedUser) {
      alert('Please select a user first.');
      return;
    }

    try {
      setSending(true);

      const requestBody: {
        content: string;
        messageType: ChatMode;
        receiverId?: string;
      } = {
        content: newMessage.trim(),
        messageType: chatMode,
      };

      if (chatMode === 'DIRECT' && selectedUser) {
        requestBody.receiverId = selectedUser.id;
      }

      const response = await fetch(`${API_BASE_URL}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          if (typeof errorData === 'string') {
            errorMessage = errorData;
          } else if (errorData?.error) {
            errorMessage = errorData.error;
          }
        } catch {
          // Ignore JSON parsing error
        }

        alert('❌ ' + errorMessage);
        return;
      }

      setNewMessage('');
      await fetchCurrentChat();
      void refreshAttention();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('❌ Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // ============================================================
  // FORMAT TIME
  // ============================================================
  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // ============================================================
  // FORMAT DATE
  // ============================================================
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      }
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  // ============================================================
  // CHECK OWN MESSAGE
  // ============================================================
  const isOwnMessage = (message: Message): boolean => {
    const senderId = String(message.sender?.id ?? '');
    const currentUserId = String(user?.id ?? '');
    const senderUsername = message.sender?.username
      ? String(message.sender.username)
      : '';
    const currentUsername = user?.username ? String(user.username) : '';
    const currentEmail = user?.email ? String(user.email) : '';

    return (
      (senderId !== '' && senderId === currentUserId) ||
      (senderUsername !== '' &&
        (senderUsername === currentUsername || senderUsername === currentEmail))
    );
  };

  // ============================================================
  // GET USER ROLE LABEL
  // ============================================================
  const getRoleLabel = (role: string): string => {
    if (!role) return '';
    return role.toLowerCase().replace(/^./, (char) => char.toUpperCase());
  };

  // Filtered users for people list
  const filteredUsers = users.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  // Sort users strictly by latest message timestamp DESCENDING
  // The person/conversation with the newest message is ALWAYS at the top.
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    const aId = String(a.id);
    const bId = String(b.id);

    const aTime = localMessageTimes[aId] || lastMessageTimes[aId] || '';
    const bTime = localMessageTimes[bId] || lastMessageTimes[bId] || '';

    if (aTime && bTime) {
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    }
    if (aTime && !bTime) return -1;
    if (!aTime && bTime) return 1;

    return 0;
  });

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (loading && messages.length === 0 && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-500 flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-[#0062E0] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading chat...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // MAIN FULL-HEIGHT CHAT WORKSPACE
  // ============================================================
  return (
    <div className="h-[calc(100vh-105px)] min-h-[520px] flex flex-col overflow-hidden">
      {/* ======================================================
          TOP BAR (Minimal, no vertical screen-wasting header)
      ====================================================== */}
      <div className="flex items-center justify-between pb-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-[#0F172A] tracking-tight">Chat</h1>
          <span className="text-xs text-slate-300 hidden sm:inline">•</span>
          <span className="text-xs text-slate-500 hidden sm:inline">
            {chatMode === 'GENERAL'
              ? 'General conversation'
              : selectedUser
              ? `Conversation with ${selectedUser.name}`
              : 'Direct messaging'}
          </span>
        </div>
      </div>

      {/* ======================================================
          DESKTOP 2-COLUMN / MOBILE TOGGLED WORKSPACE CONTAINER
      ====================================================== */}
      <div className="flex-1 min-h-0 flex bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        {/* ====================================================
            LEFT COLUMN: CONVERSATION LIST (Self-scrolling)
        ==================================================== */}
        <div
          className={`w-full md:w-72 lg:w-80 border-r border-[#E2E8F0] flex flex-col bg-[#F8FAFC] flex-shrink-0 ${
            showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0 bg-white">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Conversations
            </span>
          </div>

          {/* General Conversation (Always at the top of conversations) */}
          <div className="p-2 flex-shrink-0">
            {(() => {
              const genPreview = localGeneralPreview || latestGeneralMessagePreview;
              const genTime = localGeneralTime || latestGeneralMessageTime;
              const isGenUnread = hasGeneralUnread && generalUnreadCount > 0 && chatMode !== 'GENERAL';

              return (
                <button
                  onClick={() => void openGeneralChat()}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                    chatMode === 'GENERAL'
                      ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#0062E0] shadow-sm'
                      : isGenUnread
                      ? 'bg-blue-50/70 border border-blue-200 text-[#0F172A] shadow-sm'
                      : 'bg-white border border-[#E2E8F0] text-slate-700 hover:bg-[#F1F5F9]'
                  }`}
                >
                  {/* Avatar / Icon */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      chatMode === 'GENERAL'
                        ? 'bg-[#0062E0] text-white shadow-sm'
                        : isGenUnread
                        ? 'bg-[#EFF6FF] text-[#0062E0] border border-[#BFDBFE]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Globe size={18} />
                  </div>

                  {/* Info block: 2 rows */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    {/* Row 1: General (left) and Time (right) */}
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isGenUnread && (
                          <span className="w-2 h-2 rounded-full bg-[#0062E0] animate-pulse flex-shrink-0" />
                        )}
                        <span className={`text-sm font-semibold truncate ${chatMode === 'GENERAL' ? 'text-[#0062E0]' : 'text-[#0F172A]'}`}>
                          General
                        </span>
                      </div>
                      {genTime && (
                        <span
                          className={`text-[11px] flex-shrink-0 ${
                            isGenUnread ? 'text-[#0062E0] font-semibold' : 'text-slate-400'
                          }`}
                        >
                          {formatConversationTime(genTime)}
                        </span>
                      )}
                    </div>

                    {/* Row 2: Latest Message Preview (left) and Unread Badge (right) */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs truncate ${
                          isGenUnread
                            ? 'text-slate-900 font-semibold'
                            : 'text-slate-500'
                        }`}
                      >
                        {genPreview || 'Everyone • Shared conversation'}
                      </span>
                      {isGenUnread && (
                        <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#0062E0] text-white text-[10px] font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                          {generalUnreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })()}
          </div>

          {/* Section Divider & People Search */}
          <div className="px-3 pt-2 pb-1 border-t border-[#E2E8F0] flex-shrink-0">
            <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-slate-500 mb-2">
              <div className="flex items-center gap-1.5">
                <Users size={12} className="text-slate-400" />
                <span>People</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                {sortedUsers.length}
              </span>
            </div>

            {/* People search input */}
            <div className="relative mb-1">
              <Search
                size={13}
                className="absolute left-2.5 top-2.5 text-slate-400"
              />
              <input
                type="text"
                placeholder="Filter people..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#CBD5E1] rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] transition-colors"
              />
            </div>
          </div>

          {/* Scrollable People / Direct Messages List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {sortedUsers.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-6">
                No matching users found.
              </div>
            ) : (
              sortedUsers.map((chatUser) => {
                const isSelected =
                  chatMode === 'DIRECT' && selectedUser?.id === chatUser.id;
                const userIdStr = String(chatUser.id);
                const unreadCount = isSelected
                  ? 0
                  : unreadCountsBySender[userIdStr] || 0;
                const hasUnread = unreadCount > 0;
                const timeStr = formatConversationTime(
                  localMessageTimes[userIdStr] || lastMessageTimes[userIdStr]
                );
                const previewText =
                  localMessagePreviews[userIdStr] ||
                  latestMessagePreviews[userIdStr];

                return (
                  <button
                    key={chatUser.id}
                    onClick={() => void openDirectChat(chatUser)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-[#EFF6FF] border border-[#BFDBFE] text-[#0062E0] shadow-sm'
                        : hasUnread
                        ? 'bg-blue-50/70 border border-blue-200 text-[#0F172A] shadow-sm'
                        : 'bg-transparent hover:bg-white border border-transparent text-slate-700 hover:shadow-xs'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-semibold ${
                          isSelected
                            ? 'bg-[#0062E0] border-[#0062E0] text-white'
                            : hasUnread
                            ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0062E0]'
                            : 'bg-slate-100 border-[#E2E8F0] text-slate-600'
                        }`}
                      >
                        {chatUser.name
                          ? chatUser.name.charAt(0).toUpperCase()
                          : 'U'}
                      </div>
                    </div>

                    {/* Info Block: 2 Rows */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                      {/* Row 1: Name (left) and Time (right) */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {hasUnread && (
                            <span className="w-2 h-2 rounded-full bg-[#0062E0] animate-pulse flex-shrink-0" />
                          )}
                          <span
                            className={`text-sm truncate font-medium ${
                              isSelected
                                ? 'text-[#0062E0] font-semibold'
                                : hasUnread
                                ? 'text-[#0F172A] font-semibold'
                                : 'text-slate-800'
                            }`}
                          >
                            {chatUser.name}
                          </span>
                        </div>
                        {timeStr && (
                          <span
                            className={`text-[11px] flex-shrink-0 ${
                              hasUnread ? 'text-[#0062E0] font-semibold' : 'text-slate-400'
                            }`}
                          >
                            {timeStr}
                          </span>
                        )}
                      </div>

                      {/* Row 2: Latest Message Preview (left) and Unread Badge (right) */}
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs truncate ${
                            hasUnread
                              ? 'text-slate-900 font-medium'
                              : 'text-slate-500'
                          }`}
                        >
                          {previewText || getRoleLabel(chatUser.role)}
                        </span>

                        {hasUnread && (
                          <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-[#0062E0] text-white text-[10px] font-bold flex items-center justify-center shadow-sm flex-shrink-0">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ====================================================
            RIGHT COLUMN: MESSAGE AREA (With Pinned Input)
        ==================================================== */}
        <div
          className={`flex-1 min-h-0 flex flex-col bg-[#F8FAFC] min-w-0 ${
            !showMobileChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Active Conversation Header */}
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile Back Button */}
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-1 text-slate-500 hover:text-slate-800 mr-1"
                title="Back to conversations"
              >
                <ChevronLeft size={20} />
              </button>

              {chatMode === 'GENERAL' ? (
                <>
                  <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-[#0062E0] flex-shrink-0">
                    <Globe size={16} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 truncate">
                      General
                      {hasGeneralUnread && <AttentionDot size="sm" />}
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate">
                      All active users • Shared conversation
                    </p>
                  </div>
                </>
              ) : selectedUser ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] flex items-center justify-center text-xs font-bold text-[#0062E0] flex-shrink-0">
                    {selectedUser.name
                      ? selectedUser.name.charAt(0).toUpperCase()
                      : 'U'}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2 truncate">
                      {selectedUser.name}
                      {unreadSenderIds.some(
                        (id) => String(id) === String(selectedUser.id)
                      ) && <AttentionDot size="sm" />}
                    </h2>
                    <p className="text-[11px] text-slate-500 truncate">
                      {getRoleLabel(selectedUser.role)} • Active
                    </p>
                  </div>
                </>
              ) : (
                <h2 className="text-sm font-medium text-slate-500">
                  Select a conversation
                </h2>
              )}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="m-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600 flex-shrink-0">
              {error}
            </div>
          )}

          {/* Message History (Internal Scrolling) */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center p-6">
                  <div className="text-3xl mb-2">
                    {chatMode === 'GENERAL'
                      ? '👋'
                      : selectedUser
                      ? '💬'
                      : '💬'}
                  </div>
                  <p className="text-base font-semibold text-[#0F172A]">
                    {chatMode === 'GENERAL'
                      ? 'No messages in General yet'
                      : selectedUser
                      ? 'No messages in this conversation'
                      : 'Select a conversation'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    {chatMode === 'GENERAL'
                      ? 'Send a message to start chatting with everyone!'
                      : selectedUser
                      ? 'Send a message to start this private conversation.'
                      : 'Choose General or select a person from People on the left to start messaging.'}
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isOwn = isOwnMessage(msg);
                const showDate =
                  index === 0 ||
                  formatDate(msg.createdAt) !==
                    formatDate(messages[index - 1].createdAt);

                return (
                  <div key={msg.id}>
                    {/* Date separator */}
                    {showDate && (
                      <div className="flex justify-center my-3">
                        <span className="px-3 py-0.5 rounded-full bg-white border border-[#E2E8F0] text-[10px] font-medium text-slate-500 shadow-xs">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div
                      className={`flex w-full ${
                        isOwn ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`flex items-end gap-2 max-w-[80%] md:max-w-[70%] ${
                          isOwn ? 'flex-row-reverse' : 'flex-row'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center border text-[11px] font-semibold ${
                            isOwn
                              ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#0062E0]'
                              : 'bg-white border-[#CBD5E1] text-slate-600 shadow-xs'
                          }`}
                        >
                          {msg.sender?.name
                            ? msg.sender.name.charAt(0).toUpperCase()
                            : 'U'}
                        </div>

                        {/* Content Box */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                            isOwn
                              ? 'bg-[#0062E0] text-white rounded-br-sm'
                              : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-sm'
                          }`}
                        >
                          {/* Sender name in General */}
                          {!isOwn && (
                            <p className="text-xs font-semibold text-[#0062E0] mb-0.5 flex items-center gap-1.5">
                              <span>{msg.sender?.name || 'Unknown'}</span>
                              {chatMode === 'GENERAL' && msg.sender?.role && (
                                <span className="text-[10px] text-slate-400 font-normal">
                                  ({getRoleLabel(msg.sender.role)})
                                </span>
                              )}
                            </p>
                          )}

                          <p className="text-sm leading-relaxed break-words">
                            {msg.content}
                          </p>

                          {/* Time & seen tick */}
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 ${
                              isOwn ? 'text-blue-100' : 'text-slate-400'
                            }`}
                          >
                            <span className="text-[10px]">
                              {formatTime(msg.createdAt)}
                            </span>
                            {isOwn && chatMode === 'DIRECT' && (
                              msg.isSeen ? (
                                <CheckCheck
                                  size={13}
                                  className="text-white"
                                />
                              ) : (
                                <Check
                                  size={13}
                                  className="text-blue-200"
                                />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ====================================================
              MESSAGE INPUT (Pinned at bottom, always accessible)
          ==================================================== */}
          {(chatMode === 'GENERAL' || selectedUser) && (
            <div className="p-3 md:p-3.5 border-t border-[#E2E8F0] bg-white flex-shrink-0">
              <form onSubmit={sendMessage} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={
                    chatMode === 'GENERAL'
                      ? 'Message General...'
                      : selectedUser
                      ? `Message ${selectedUser.name}...`
                      : 'Type a message...'
                  }
                  className="flex-1 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl px-4 py-2.5 text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="bg-[#0062E0] hover:bg-[#0050B8] text-white px-5 py-2.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-sm font-medium shadow-sm hover:shadow flex-shrink-0"
                >
                  <Send size={15} />
                  <span className="hidden sm:inline">
                    {sending ? 'Sending...' : 'Send'}
                  </span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;