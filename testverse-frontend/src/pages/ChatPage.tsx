import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    Send,
    Check,
    CheckCheck,
    Users,
    User,
    MessageCircle,
    Globe
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

type ChatMode = 'GENERAL' | 'DIRECT';

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:8080';

const ChatPage: React.FC = () => {

  const { user } = useAuth();

  const [searchParams] = useSearchParams();

  const token = localStorage.getItem('token');

  // ============================================================
  // STATE
  // ============================================================

  const [messages, setMessages] =
      useState<Message[]>([]);

  const [users, setUsers] =
      useState<ChatUser[]>([]);

  const [newMessage, setNewMessage] =
      useState('');

  const [chatMode, setChatMode] =
      useState<ChatMode>('GENERAL');

  const [selectedUser, setSelectedUser] =
      useState<ChatUser | null>(null);

  const [loading, setLoading] =
      useState(true);

  const [sending, setSending] =
      useState(false);

  const [error, setError] =
      useState<string | null>(null);

  const messagesEndRef =
      useRef<HTMLDivElement>(null);


  // ============================================================
  // SCROLL TO BOTTOM
  // ============================================================

  const scrollToBottom = (): void => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth'
    });

  };


  // ============================================================
  // LOAD USERS
  // ============================================================

  const fetchUsers = async (): Promise<ChatUser[]> => {

    try {

      const response = await fetch(
          `${API_BASE_URL}/api/messages/users`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
      );

      if (!response.ok) {

        console.error(
            'Failed to fetch chat users'
        );

        return [];
      }

      const data =
          await response.json();

      const chatUsers =
          Array.isArray(data)
              ? data
              : [];

      setUsers(chatUsers);

      return chatUsers;

    } catch (error) {

      console.error(
          'Error fetching chat users:',
          error
      );

      return [];
    }
  };


  // ============================================================
  // FETCH GENERAL MESSAGES
  // ============================================================

  const fetchGeneralMessages =
      async (): Promise<void> => {

        try {

          const response = await fetch(
              `${API_BASE_URL}/api/messages/general`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
          );

          if (!response.ok) {

            throw new Error(
                'Failed to fetch General messages'
            );
          }

          const data =
              await response.json();

          setMessages(
              Array.isArray(data)
                  ? data
                  : []
          );

          setError(null);

        } catch (error) {

          console.error(
              'Error fetching General messages:',
              error
          );

          setError(
              'Unable to load General chat.'
          );
        }
      };

    // ============================================================
// MARK DIRECT MESSAGES AS SEEN
// ============================================================

    const markMessagesAsSeen =
        async (
            targetUserId: string
        ): Promise<void> => {

            try {

                await fetch(
                    `${API_BASE_URL}/api/messages/direct/${targetUserId}/seen`,
                    {
                        method: 'PATCH',

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

            } catch (error) {

                console.error(
                    'Error marking messages as seen:',
                    error
                );
            }
        };


  // ============================================================
  // FETCH DIRECT MESSAGES
  // ============================================================

  const fetchDirectMessages =
      async (
          targetUserId: string
      ): Promise<void> => {

        try {

          const response = await fetch(
              `${API_BASE_URL}/api/messages/direct/${targetUserId}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              }
          );

          if (!response.ok) {

            throw new Error(
                'Failed to fetch direct messages'
            );
          }

          const data =
              await response.json();

          setMessages(
              Array.isArray(data)
                  ? data
                  : []
          );

          setError(null);
            await markMessagesAsSeen(
                targetUserId
            );

        } catch (error) {

          console.error(
              'Error fetching direct messages:',
              error
          );

          setError(
              'Unable to load this conversation.'
          );
        }
      };


  // ============================================================
  // FETCH CURRENT CHAT
  // ============================================================

  const fetchCurrentChat =
      async (): Promise<void> => {

        if (chatMode === 'GENERAL') {

          await fetchGeneralMessages();

          return;
        }

        if (
            chatMode === 'DIRECT' &&
            selectedUser
        ) {

          await fetchDirectMessages(
              selectedUser.id
          );
        }
      };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {

    const loadChat =
        async (): Promise<void> => {

          setLoading(true);

          const loadedUsers =
              await fetchUsers();

          /*
           * If NotificationBell opened Chat with:
           *
           * /chat?userId=some-user-id
           *
           * automatically open that user's
           * Direct conversation.
           */
          const targetUserId =
              searchParams.get('userId');

          if (targetUserId) {

            const targetUser =
                loadedUsers.find(
                    (chatUser) =>
                        String(chatUser.id) ===
                        String(targetUserId)
                );

            if (targetUser) {

              setChatMode('DIRECT');

              setSelectedUser(
                  targetUser
              );

              await fetchDirectMessages(
                  targetUser.id
              );

              setLoading(false);

              return;
            }
          }

          /*
           * Normal Chat page opening.
           *
           * Default to General.
           */
          await fetchGeneralMessages();

          setLoading(false);
        };

    void loadChat();

  }, []);


  // ============================================================
  // POLLING
  // ============================================================

  useEffect(() => {

    const interval =
        setInterval(() => {

          void fetchCurrentChat();

        }, 3000);

    return () =>
        clearInterval(interval);

  }, [
    chatMode,
    selectedUser
  ]);

    // ============================================================
    // ONLINE HEARTBEAT
    // ============================================================

    useEffect(() => {

        const sendHeartbeat = async (): Promise<void> => {

            try {

                await fetch(
                    `${API_BASE_URL}/api/messages/heartbeat`,
                    {
                        method: 'PATCH',

                        headers: {
                            Authorization:
                                `Bearer ${token}`,

                            'Content-Type':
                                'application/json'
                        }
                    }
                );

            } catch (error) {

                console.error(
                    'Heartbeat failed:',
                    error
                );
            }
        };

        // Send immediately when ChatPage opens
        void sendHeartbeat();

        // Send every 15 seconds
        const interval =
            setInterval(() => {

                void sendHeartbeat();

            }, 15000);

        return () =>
            clearInterval(interval);

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

  const openGeneralChat =
      async (): Promise<void> => {

        setChatMode('GENERAL');

        setSelectedUser(null);

        setMessages([]);

        setError(null);

        setLoading(true);

        await fetchGeneralMessages();

        setLoading(false);
      };


  // ============================================================
  // OPEN DIRECT CHAT
  // ============================================================

  const openDirectChat =
      async (
          chatUser: ChatUser
      ): Promise<void> => {

        setChatMode('DIRECT');

        setSelectedUser(chatUser);

        setMessages([]);

        setError(null);

        setLoading(true);

        await fetchDirectMessages(
            chatUser.id
        );

        setLoading(false);
      };


  // ============================================================
  // SEND MESSAGE
  // ============================================================

  const sendMessage =
      async (
          e: React.FormEvent
      ): Promise<void> => {

        e.preventDefault();

        if (!newMessage.trim()) {
          return;
        }

        if (
            chatMode === 'DIRECT' &&
            !selectedUser
        ) {

          alert(
              'Please select a user first.'
          );

          return;
        }

        try {

          setSending(true);

          const requestBody: {
            content: string;
            messageType: ChatMode;
            receiverId?: string;
          } = {

            content:
                newMessage.trim(),

            messageType:
            chatMode
          };


          if (
              chatMode === 'DIRECT' &&
              selectedUser
          ) {

            requestBody.receiverId =
                selectedUser.id;
          }


          const response = await fetch(
              `${API_BASE_URL}/api/messages`,
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                      'application/json',

                  Authorization:
                      `Bearer ${token}`
                },

                body:
                    JSON.stringify(
                        requestBody
                    )
              }
          );


          if (!response.ok) {

            let errorMessage =
                'Failed to send message';

            try {

              const errorData =
                  await response.json();

              if (
                  typeof errorData ===
                  'string'
              ) {

                errorMessage =
                    errorData;

              } else if (
                  errorData?.error
              ) {

                errorMessage =
                    errorData.error;
              }

            } catch {
              // Ignore JSON parsing error
            }

            alert(
                '❌ ' +
                errorMessage
            );

            return;
          }


          setNewMessage('');

          await fetchCurrentChat();

        } catch (error) {

          console.error(
              'Error sending message:',
              error
          );

          alert(
              '❌ Network error. Please try again.'
          );

        } finally {

          setSending(false);
        }
      };


  // ============================================================
  // FORMAT TIME
  // ============================================================

  const formatTime =
      (
          dateString: string
      ): string => {

        if (!dateString) {
          return '';
        }

        try {

          const date =
              new Date(dateString);

          return date.toLocaleTimeString(
              [],
              {
                hour: '2-digit',
                minute: '2-digit'
              }
          );

        } catch {

          return '';
        }
      };


  // ============================================================
  // FORMAT DATE
  // ============================================================

  const formatDate =
      (
          dateString: string
      ): string => {

        if (!dateString) {
          return '';
        }

        try {

          const date =
              new Date(dateString);

          const today =
              new Date();

          if (
              date.toDateString() ===
              today.toDateString()
          ) {

            return 'Today';
          }

          const yesterday =
              new Date(today);

          yesterday.setDate(
              yesterday.getDate() - 1
          );

          if (
              date.toDateString() ===
              yesterday.toDateString()
          ) {

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

  const isOwnMessage = (
      message: Message
  ): boolean => {

    const senderId = String(
        message.sender?.id ?? ''
    );

    const currentUserId = String(
        user?.id ?? ''
    );

    const senderUsername =
        message.sender?.username
            ? String(message.sender.username)
            : '';

    const currentUsername =
        user?.username
            ? String(user.username)
            : '';

    const currentEmail =
        user?.email
            ? String(user.email)
            : '';

    return (
        senderId !== '' &&
        senderId === currentUserId
    ) || (
        senderUsername !== '' &&
        (
            senderUsername === currentUsername ||
            senderUsername === currentEmail
        )
    );
  };


  // ============================================================
  // GET USER ROLE LABEL
  // ============================================================

  const getRoleLabel =
      (
          role: string
      ): string => {

        if (!role) {
          return '';
        }

        return role
            .toLowerCase()
            .replace(
                /^./,
                (char) =>
                    char.toUpperCase()
            );
      };


  // ============================================================
  // LOADING
  // ============================================================

  if (
      loading &&
      messages.length === 0
  ) {

    return (

        <div className="flex items-center justify-center min-h-[400px]">

          <div className="text-[#666666]">
            Loading chat...
          </div>

        </div>
    );
  }


  // ============================================================
  // MAIN UI
  // ============================================================

  return (

      <div className="flex flex-col h-[calc(100vh-120px)] min-h-[650px]">

        {/* ======================================================
          HEADER
      ====================================================== */}

        <div className="border-b border-[#1a1a1a] pb-4 mb-4">

          <div className="flex items-center justify-between">

            <div>

              <h1 className="text-2xl font-bold text-white">
                Chat
              </h1>

              <p className="text-sm text-[#666666] mt-1">

                {chatMode === 'GENERAL'
                    ? 'Everyone'
                    : selectedUser
                        ? `Private conversation with ${selectedUser.name}`
                        : 'Select a user'}

              </p>

            </div>

          </div>


          {/* ====================================================
            CHAT TABS
        ==================================================== */}

          <div className="flex gap-2 mt-4">

            <button
                onClick={() =>
                    void openGeneralChat()
                }
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    chatMode === 'GENERAL'
                        ? 'bg-[#ff6b00] text-white'
                        : 'bg-[#1a1a1a] text-[#888888] hover:text-white hover:bg-[#222222]'
                }`}
            >

              <Globe size={16} />

              General

            </button>


            <button
                onClick={() => {

                  setChatMode('DIRECT');

                  setMessages([]);

                  setError(null);

                }}
                className={`px-4 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    chatMode === 'DIRECT'
                        ? 'bg-[#ff6b00] text-white'
                        : 'bg-[#1a1a1a] text-[#888888] hover:text-white hover:bg-[#222222]'
                }`}
            >

              <MessageCircle size={16} />

              Individual

            </button>

          </div>

        </div>


        {/* ======================================================
          INDIVIDUAL USERS
      ====================================================== */}

        {chatMode === 'DIRECT' && (

            <div className="mb-4">

              <div className="flex items-center gap-2 mb-2">

                <Users
                    size={15}
                    className="text-[#666666]"
                />

                <span className="text-sm text-[#888888]">
              Active Users
            </span>

              </div>


              <div className="flex gap-2 overflow-x-auto pb-2">

                {users.length === 0 ? (

                    <div className="text-sm text-[#666666]">
                      No other active users found.
                    </div>

                ) : (

                    users.map(
                        (chatUser) => (

                            <button
                                key={chatUser.id}
                                onClick={() =>
                                    void openDirectChat(
                                        chatUser
                                    )
                                }
                                className={`flex-shrink-0 px-3 py-2 rounded-lg border transition-colors text-left ${
                                    selectedUser?.id ===
                                    chatUser.id
                                        ? 'bg-[#ff6b00]/20 border-[#ff6b00] text-white'
                                        : 'bg-[#0a0a0a] border-[#1a1a1a] text-[#888888] hover:border-[#333333] hover:text-white'
                                }`}
                            >

                              <div className="flex items-center gap-2">

                                <User
                                    size={14}
                                    className={
                                      selectedUser?.id ===
                                      chatUser.id
                                          ? 'text-[#ff6b00]'
                                          : 'text-[#666666]'
                                    }
                                />

                                <div>

                                  <div className="text-sm font-medium">
                                    {chatUser.name}
                                  </div>

                                  <div className="text-[10px] text-[#555555]">
                                    {getRoleLabel(
                                        chatUser.role
                                    )}
                                  </div>

                                </div>

                              </div>

                            </button>

                        )
                    )

                )}

              </div>

            </div>

        )}


        {/* ======================================================
          ERROR
      ====================================================== */}

        {error && (

            <div className="mb-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">

              <p className="text-sm text-red-400">
                {error}
              </p>

            </div>

        )}


        {/* ======================================================
          CHAT CONTAINER
      ====================================================== */}

        {chatMode === 'DIRECT' &&
        !selectedUser ? (

            <div className="flex-1 flex items-center justify-center bg-[#0a0a0a] rounded-2xl border border-[#1a1a1a] shadow-inner">

              <div className="text-center">

                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center">

                  <User
                      size={30}
                      className="text-[#ff6b00]"
                  />

                </div>

                <h2 className="text-lg font-semibold text-white mb-2">
                  Select a user
                </h2>

                <p className="text-sm text-[#666666] max-w-sm">
                  Choose an active user above to start a private conversation.
                </p>

              </div>

            </div>

        ) : (

            <div className="flex-1 min-h-0 flex flex-col bg-[#080808] rounded-2xl border border-[#1a1a1a] shadow-xl overflow-hidden">

              {/* ==================================================
              CONVERSATION HEADER
          ================================================== */}

              {chatMode === 'DIRECT' &&
                  selectedUser && (

                      <div className="px-5 py-4 border-b border-[#1a1a1a] bg-[#0d0d0d] flex items-center gap-3">

                        <div className="w-10 h-10 rounded-full bg-[#ff6b00]/10 border border-[#ff6b00]/20 flex items-center justify-center">

                          <User
                              size={19}
                              className="text-[#ff6b00]"
                          />

                        </div>

                        <div>

                          <p className="text-sm font-semibold text-white">
                            {selectedUser.name}
                          </p>

                          <p className="text-xs text-[#666666]">
                            {getRoleLabel(
                                selectedUser.role
                            )}
                            {' • '}
                            Active
                          </p>

                        </div>

                      </div>

                  )}


              {/* ==================================================
              MESSAGE AREA
          ================================================== */}

              <div className="flex-1 overflow-y-auto p-6 space-y-4">

                {messages.length === 0 ? (

                    <div className="h-full flex items-center justify-center">

                      <div className="text-center">

                        <div className="text-4xl mb-3">

                          {chatMode === 'GENERAL'
                              ? '👋'
                              : '💬'}

                        </div>

                        <p className="text-lg text-white">

                          {chatMode === 'GENERAL'
                              ? 'No messages yet'
                              : 'No messages in this conversation'}

                        </p>

                        <p className="text-sm text-[#666666] mt-1">

                          {chatMode === 'GENERAL'
                              ? 'Be the first to say something!'
                              : 'Send a message to start the conversation.'}

                        </p>

                      </div>

                    </div>

                ) : (

                    messages.map(
                        (msg, index) => {

                          const isOwn =
                              isOwnMessage(msg);

                          const showDate =
                              index === 0 ||
                              formatDate(
                                  msg.createdAt
                              ) !==
                              formatDate(
                                  messages[
                                  index - 1
                                      ].createdAt
                              );

                          return (

                              <div
                                  key={msg.id}
                              >

                                {/* DATE */}

                                {showDate && (

                                    <div className="flex justify-center my-4">

                          <span className="px-3 py-1 rounded-full bg-[#111111] border border-[#1a1a1a] text-[10px] text-[#555555]">
                            {formatDate(
                                msg.createdAt
                            )}
                          </span>

                                    </div>

                                )}


                                {/* MESSAGE ROW */}

                                <div
                                    className={`flex w-full ${
                                        isOwn
                                            ? 'justify-end'
                                            : 'justify-start'
                                    }`}
                                >

                                  <div
                                      className={`flex items-end gap-2 max-w-[75%] ${
                                          isOwn
                                              ? 'flex-row-reverse'
                                              : 'flex-row'
                                      }`}
                                  >

                                    {/* AVATAR */}

                                    <div
                                        className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center border ${
                                            isOwn
                                                ? 'bg-[#ff6b00]/10 border-[#ff6b00]/20'
                                                : 'bg-[#161616] border-[#252525]'
                                        }`}
                                    >

                                      <User
                                          size={14}
                                          className={
                                            isOwn
                                                ? 'text-[#ff6b00]'
                                                : 'text-[#777777]'
                                          }
                                      />

                                    </div>


                                    {/* BUBBLE */}

                                    <div
                                        className={`rounded-2xl px-4 py-3 shadow-sm ${
                                            isOwn
                                                ? 'bg-[#ff6b00] rounded-br-md'
                                                : 'bg-[#151515] border border-[#222222] rounded-bl-md'
                                        }`}
                                    >

                                      {/* SENDER */}

                                      {!isOwn && (

                                          <p className="text-xs font-semibold text-[#ff6b00] mb-1">

                                            {msg.sender?.name ||
                                                'Unknown User'}

                                            {chatMode ===
                                                'GENERAL' &&
                                                msg.sender?.role && (

                                                    <span className="text-[#666666] ml-2 font-normal">
                                    {getRoleLabel(
                                        msg.sender.role
                                    )}
                                  </span>

                                                )}

                                          </p>

                                      )}


                                      {/* CONTENT */}

                                      <p
                                          className={`text-sm leading-6 break-words ${
                                              isOwn
                                                  ? 'text-white'
                                                  : 'text-gray-200'
                                          }`}
                                      >
                                        {msg.content}
                                      </p>


                                      {/* TIME */}

                                      <div
                                          className={`mt-1 flex items-center justify-end gap-1 ${
                                              isOwn
                                                  ? 'text-orange-100/70'
                                                  : 'text-[#555555]'
                                          }`}
                                      >

                              <span className="text-[10px]">
                                {formatTime(
                                    msg.createdAt
                                )}
                              </span>

                                          {isOwn && chatMode === 'DIRECT' && (

                                              msg.isSeen ? (

                                                  <CheckCheck
                                                      size={12}
                                                      className="text-blue-300"
                                                  />

                                              ) : (

                                                  <Check
                                                      size={12}
                                                      className="text-orange-100/70"
                                                  />

                                              )

                                          )}

                                      </div>

                                    </div>

                                  </div>

                                </div>

                              </div>

                          );
                        }
                    )

                )}

                <div
                    ref={messagesEndRef}
                />

              </div>

            </div>

        )}


        {/* ======================================================
          MESSAGE INPUT
      ====================================================== */}

        {(
            chatMode === 'GENERAL' ||
            selectedUser
        ) && (

            <form
                onSubmit={sendMessage}
                className="flex gap-3 mt-4"
            >

              <div className="flex-1 relative">

                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) =>
                        setNewMessage(
                            e.target.value
                        )
                    }
                    placeholder={
                      chatMode === 'GENERAL'
                          ? 'Message everyone...'
                          : `Message ${
                              selectedUser?.name ||
                              'user'
                          }...`
                    }
                    className="w-full bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl px-4 py-3 text-white placeholder-[#555555] focus:outline-none focus:border-[#ff6b00] transition-colors"
                />

              </div>


              <button
                  type="submit"
                  disabled={
                      !newMessage.trim() ||
                      sending
                  }
                  className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-6 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >

                <Send size={18} />

                {sending
                    ? 'Sending...'
                    : 'Send'}

              </button>

            </form>

        )}


        {/* ======================================================
          FOOTER
      ====================================================== */}

        <div className="mt-3 text-xs text-[#444444] flex items-center gap-2">

          <span className="w-2 h-2 bg-green-500 rounded-full"></span>

          {chatMode === 'GENERAL'
              ? 'General Chat • All active users'
              : selectedUser
                  ? `Private Chat • ${selectedUser.name}`
                  : 'Select a user to start chatting'}

        </div>

      </div>
  );
};

export default ChatPage;