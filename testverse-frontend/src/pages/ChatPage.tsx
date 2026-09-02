import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, CheckCheck, Users, X, User, AlertCircle } from 'lucide-react';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    username: string;
    role: string;
  };
  team: {
    id: number;
    name: string;
  };
  isBroadcast: boolean;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  members: any[];
  admin: any;
}

const ChatPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const token = localStorage.getItem('token');
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [showUserList, setShowUserList] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
    fetchTeamAndMessages();
    const interval = setInterval(() => {
      if (team) {
        fetchTeamAndMessages();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchTeamAndMessages = async (): Promise<void> => {
    try {
      setError(null);

      console.log('🔍 Fetching chat team data...');
      console.log('🔍 Is Admin:', isAdmin);

      let teamResponse;
      if (isAdmin) {
        console.log('📤 Calling /admin-team for chat...');
        teamResponse = await fetch('http://localhost:8080/api/teams/admin-team', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
      } else {
        console.log('📤 Calling /my-teams for chat...');
        teamResponse = await fetch('http://localhost:8080/api/teams/my-teams', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
      }

      console.log('📥 Team response status:', teamResponse.status);

      if (teamResponse.ok) {
        const data = await teamResponse.json();
        console.log('✅ Team data:', data);

        let teamData;

        if (Array.isArray(data) && data.length > 0) {
          teamData = data[0];
        } else if (!Array.isArray(data) && data.id) {
          teamData = data;
        } else {
          setTeam(null);
          setLoading(false);
          return;
        }

        setTeam(teamData);

        // Fetch messages for this team
        const messagesResponse = await fetch(`http://localhost:8080/api/messages/team/${teamData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          setMessages(messagesData || []);
        } else {
          setMessages([]);
        }
      } else {
        setTeam(null);
        setMessages([]);
        if (isAdmin) {
          setError('No team found. Please go to Team Management and create a team first.');
        } else {
          setError('No team found. Please contact your admin.');
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    if (!team) {
      alert('❌ Please join a team first!');
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          teamId: team.id,
          isBroadcast: false,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchTeamAndMessages();
      } else {
        const errorData = await response.json();
        const errorMsg = typeof errorData === 'string' ? errorData : (errorData.error || 'Failed to send message');
        alert('❌ ' + errorMsg);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Network error. Please try again.');
    }
  };

  const sendBroadcast = async (): Promise<void> => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('http://localhost:8080/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          teamId: null,
          isBroadcast: true,
        }),
      });

      if (response.ok) {
        setNewMessage('');
        await fetchTeamAndMessages();
        alert('✅ Broadcast sent to all users!');
      } else {
        const errorData = await response.json();
        alert('❌ ' + (errorData.error || 'Failed to send broadcast'));
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      alert('Network error. Please try again.');
    }
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

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

  const isOwnMessage = (message: Message): boolean => {
    return message.sender?.id === user?.id;
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-[#666666]">Loading chat...</div>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="text-center max-w-md bg-[#111111] border border-[#1a1a1a] rounded-xl p-8">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-white mb-2">No Team Chat Available</h2>
            <p className="text-[#666666] mb-4">{error}</p>
            {isAdmin && (
                <button
                    onClick={() => window.location.href = '/team'}
                    className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Team Page
                </button>
            )}
          </div>
        </div>
    );
  }

  if (!team) {
    return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <div className="text-center max-w-md bg-[#111111] border border-[#1a1a1a] rounded-xl p-8">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-bold text-white mb-2">No Team Assigned</h2>
            <p className="text-[#666666] mb-4">You haven't been added to a team yet.</p>
            {isAdmin ? (
                <button
                    onClick={() => window.location.href = '/team'}
                    className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Go to Team Page
                </button>
            ) : (
                <p className="text-sm text-[#666666]">Contact your admin to join a team.</p>
            )}
          </div>
        </div>
    );
  }

  return (
      <div className="flex flex-col h-[calc(100vh-160px)]">
        <div className="flex items-center justify-between border-b border-[#1a1a1a] pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Team Chat</h1>
            <p className="text-sm text-[#666666]">
              {team?.name || 'Team'} • {team?.members?.length || 0} members
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#666666]">
              <Users size={16} />
              <span className="text-sm">{team?.members?.length || 0} members</span>
            </div>
            {isAdmin && (
                <button
                    onClick={() => setShowUserList(!showUserList)}
                    className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-3 py-1.5 rounded-lg text-sm flex items-center gap-2 transition-colors"
                >
                  <User size={14} />
                  Users
                </button>
            )}
          </div>
        </div>

        {showUserList && isAdmin && (
            <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-3 mb-4 max-h-40 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-white">All Users</h3>
                <button onClick={() => setShowUserList(false)} className="text-[#666666] hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {users.map((u) => (
                    <div key={u.id} className="flex items-center gap-2 text-xs text-[#666666] bg-[#1a1a1a] p-2 rounded-lg">
                      <User size={12} className="text-[#ff6b00]" />
                      <span>{u.name}</span>
                      <span className="text-[10px] text-[#444444]">({u.role})</span>
                    </div>
                ))}
              </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-[#0a0a0a] rounded-xl border border-[#1a1a1a]">
          {messages.length === 0 ? (
              <div className="text-center py-12 text-[#666666]">
                <div className="text-4xl mb-2">👋</div>
                <p className="text-lg">No messages yet</p>
                <p className="text-sm">Be the first to say something!</p>
              </div>
          ) : (
              <>
                {messages.map((msg, index) => {
                  const isOwn = isOwnMessage(msg);
                  const showDate = index === 0 || formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);
                  const isBroadcast = msg.isBroadcast;

                  return (
                      <div key={msg.id}>
                        {showDate && (
                            <div className="text-center text-xs text-[#444444] py-2">
                              {formatDate(msg.createdAt)}
                            </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              isBroadcast
                                  ? 'bg-purple-500/20 border border-purple-500/30'
                                  : isOwn
                                      ? 'bg-[#ff6b00]'
                                      : 'bg-[#1a1a1a]'
                          }`}>
                            {!isOwn && (
                                <p className={`text-xs font-medium mb-1 ${
                                    isBroadcast ? 'text-purple-400' : 'text-[#ff6b00]'
                                }`}>
                                  {isBroadcast ? '📢 BROADCAST' : msg.sender?.name || 'Unknown User'}
                                </p>
                            )}
                            <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-300'}`}>
                              {msg.content}
                            </p>
                            <p className={`text-[10px] ${isOwn ? 'text-orange-200/70' : 'text-[#666666]'} mt-1 flex items-center gap-1`}>
                              {formatTime(msg.createdAt)}
                              {isOwn && (
                                  <CheckCheck size={12} className="text-blue-400" />
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </>
          )}
        </div>

        <form onSubmit={sendMessage} className="flex gap-3 mt-4">
          <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${team?.name || 'Team'}...`}
              className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
          />
          {isAdmin && (
              <button
                  type="button"
                  onClick={sendBroadcast}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                📢 Broadcast
              </button>
          )}
          <button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={18} /> Send
          </button>
        </form>

        <div className="mt-3 text-xs text-[#444444] flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          {team?.members?.length || 0} members online
        </div>
      </div>
  );
};

export default ChatPage;