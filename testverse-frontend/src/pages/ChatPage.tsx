import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Send, CheckCheck, Users, Image, X } from 'lucide-react';

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
  messageType: string;
  isRead: boolean;
  createdAt: string;
  imageUrl?: string;
}

interface Team {
  id: number;
  name: string;
  description: string;
  members: any[];
  admin: any;
}

const ChatPage: React.FC = () => {
  const { user, token, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTeamAndMessages();
    const interval = setInterval(fetchTeamAndMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchTeamAndMessages = async () => {
    try {
      setError(null);

      const teamResponse = await fetch('http://localhost:8080/api/teams/my-team', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (teamResponse.ok) {
        const teams = await teamResponse.json();
        if (teams && teams.length > 0) {
          setTeam(teams[0]);
          const messagesResponse = await fetch(`http://localhost:8080/api/chat/team/${teams[0].id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (messagesResponse.ok) {
            const data = await messagesResponse.json();
            setMessages(data || []);
          }
        } else {
          if (isAdmin) {
            await createDefaultTeam();
          } else {
            setError('You are not assigned to any team yet. Please contact your admin.');
          }
        }
      } else {
        setError('Failed to fetch team information');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTeam = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: 'TestVerse Team',
          description: 'Default team for all TestVerse members',
        }),
      });

      if (response.ok) {
        const newTeam = await response.json();
        setTeam(newTeam);
        setError(null);
        await fetchTeamAndMessages();
      }
    } catch (error) {
      console.error('Error creating team:', error);
      setError('Failed to create team. Please try again.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !selectedImage) return;
    if (!team) return;

    setUploading(true);

    try {
      let imageUrl = '';

      if (selectedImage) {
        const formData = new FormData();
        formData.append('image', selectedImage);
        formData.append('teamId', String(team.id));

        const uploadResponse = await fetch('http://localhost:8080/api/chat/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });

        if (uploadResponse.ok) {
          const data = await uploadResponse.json();
          imageUrl = data.imageUrl;
        } else {
          alert('Failed to upload image');
          setUploading(false);
          return;
        }
      }

      const response = await fetch('http://localhost:8080/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          content: newMessage || (imageUrl ? '📷 Image shared' : ''),
          teamId: team.id,
          messageType: imageUrl ? 'IMAGE' : 'TEXT',
          imageUrl: imageUrl || '',
        }),
      });

      if (response.ok) {
        setNewMessage('');
        removeImage();
        await fetchTeamAndMessages();
      } else {
        const errorData = await response.json();
        alert('Failed to send message: ' + (errorData.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Network error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
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
  };

  const isOwnMessage = (message: Message) => {
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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-white mb-2">No Team Chat Available</h2>
            <p className="text-[#666666] mb-4">{error}</p>
          </div>
        </div>
    );
  }

  if (!team) {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Team Assigned</h2>
            <p className="text-[#666666]">You haven't been added to a team yet.</p>
            <p className="text-[#666666] text-sm">Contact your admin to join a team.</p>
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
          <div className="flex items-center gap-2 text-[#666666]">
            <Users size={16} />
            <span className="text-sm">{team?.members?.length || 0} members</span>
          </div>
        </div>

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
                  return (
                      <div key={msg.id}>
                        {showDate && (
                            <div className="text-center text-xs text-[#444444] py-2">
                              {formatDate(msg.createdAt)}
                            </div>
                        )}
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] ${isOwn ? 'bg-[#ff6b00]' : 'bg-[#1a1a1a]'} rounded-lg px-4 py-2`}>
                            {!isOwn && (
                                <p className="text-xs text-[#ff6b00] font-medium mb-1">
                                  {msg.sender?.name || 'Unknown User'}
                                </p>
                            )}
                            {msg.messageType === 'IMAGE' && msg.imageUrl ? (
                                <div className="mt-1">
                                  <img
                                      src={msg.imageUrl}
                                      alt="Shared image"
                                      className="max-w-full max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => window.open(msg.imageUrl, '_blank')}
                                  />
                                </div>
                            ) : (
                                <p className={`text-sm ${isOwn ? 'text-white' : 'text-gray-300'}`}>
                                  {msg.content}
                                </p>
                            )}
                            <p className={`text-[10px] ${isOwn ? 'text-orange-200/70' : 'text-[#666666]'} mt-1 flex items-center gap-1`}>
                              {formatTime(msg.createdAt)}
                              {isOwn && msg.isRead && (
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

        {imagePreview && (
            <div className="relative mt-2 p-2 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
              <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-32 rounded-lg object-contain"
              />
              <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
        )}

        <form onSubmit={sendMessage} className="flex gap-3 mt-4">
          <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
          />
          <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white px-3 py-2 rounded-lg transition-colors border border-[#2a2a2a]"
          >
            <Image size={18} />
          </button>
          <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${team?.name || 'Team'}...`}
              className="flex-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg px-4 py-2 text-white placeholder-[#666666] focus:outline-none focus:border-[#ff6b00]"
          />
          <button
              type="submit"
              disabled={(!newMessage.trim() && !selectedImage) || uploading}
              className="bg-[#ff6b00] hover:bg-[#cc5500] text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {uploading ? 'Uploading...' : <><Send size={18} /> Send</>}
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