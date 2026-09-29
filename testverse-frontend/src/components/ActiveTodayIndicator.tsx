import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { attendanceApi, ActiveUser } from '../services/api';
import { MessageSquare, Users, Sparkles } from 'lucide-react';

export const ActiveTodayIndicator: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchActive = async () => {
    try {
      const data = await attendanceApi.getTodayActive();
      if (Array.isArray(data)) {
        setActiveUsers(data);
      }
    } catch (err) {
      // Silently handle polling errors
    }
  };

  useEffect(() => {
    void fetchActive();
    // Poll active today status every 30 seconds
    const interval = setInterval(fetchActive, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      setLoading(true);
      fetchActive().finally(() => setLoading(false));
    }
    setIsOpen(!isOpen);
  };

  const handlePersonClick = (person: ActiveUser) => {
    const currentId = user?.userId || user?.id;
    const currentEmail = user?.email;
    const isSelf = (currentId && String(person.id) === String(currentId)) ||
                   (currentEmail && person.email && currentEmail.toLowerCase() === person.email.toLowerCase());

    if (isSelf) {
      // Do not open self-chat
      return;
    }

    setIsOpen(false);
    navigate(`/chat?userId=${person.id}`);
  };

  // Distinct background gradients for initials
  const getAvatarGradient = (index: number) => {
    const gradients = [
      'from-[#0062E0] to-[#0091FF]',
      'from-[#00B388] to-[#00D9A5]',
      'from-[#6366F1] to-[#818CF8]',
      'from-[#0284C7] to-[#38BDF8]',
      'from-[#0D9488] to-[#14B8A6]',
    ];
    return gradients[index % gradients.length];
  };

  // Up to three circles
  const visibleCircles = activeUsers.slice(0, 3);
  const extraCount = activeUsers.length > 3 ? activeUsers.length - 3 : 0;

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Navigation Indicator Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        title={`Active Today (${activeUsers.length} present)`}
        aria-label="Active Today list"
        className="flex items-center space-x-1.5 p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] transition-colors focus:outline-none"
      >
        {activeUsers.length === 0 ? (
          <div className="flex items-center space-x-1.5 px-1.5 py-0.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B388] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B388]" />
            </span>
            <span className="text-xs font-semibold text-[#64748B]">Active Today</span>
          </div>
        ) : (
          <div className="flex items-center space-x-1 px-0.5">
            {/* Display up to 3 round avatar icons */}
            <div className="flex items-center -space-x-1.5">
              {visibleCircles.map((person, idx) => {
                const initial = person.name ? person.name.charAt(0).toUpperCase() : 'U';
                return (
                  <div
                    key={person.id}
                    className={`
                      w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarGradient(idx)}
                      border-2 border-white flex items-center justify-center text-white
                      font-bold text-[10px] shadow-xs select-none
                    `}
                    title={`${person.name} (${person.role})`}
                  >
                    {initial}
                  </div>
                );
              })}
            </div>

            {/* Additional count indicator e.g. +5 */}
            {extraCount > 0 && (
              <span className="text-[11px] font-bold text-[#0062E0] bg-[#EFF6FF] px-1.5 py-0.5 rounded-full border border-[#BFDBFE] leading-none">
                +{extraCount}
              </span>
            )}

            {/* Small active green dot */}
            <span className="w-1.5 h-1.5 rounded-full bg-[#00B388] ml-0.5" />
          </div>
        )}
      </button>

      {/* Active Today Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-76 sm:w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B388] opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00B388]" />
              </span>
              <h3 className="text-xs font-bold tracking-wider text-[#0F172A] uppercase font-mono">
                ACTIVE TODAY
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-[#0062E0] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE]">
              {activeUsers.length} {activeUsers.length === 1 ? 'person' : 'people'}
            </span>
          </div>

          {/* Active Users List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#F8FAFC]">
            {activeUsers.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#94A3B8]">
                <Users className="w-8 h-8 mx-auto text-[#CBD5E1] mb-2" />
                <p>No active users recorded today yet.</p>
              </div>
            ) : (
              activeUsers.map((person, idx) => {
                const currentId = user?.userId || user?.id;
                const currentEmail = user?.email;
                const isSelf =
                  (currentId && String(person.id) === String(currentId)) ||
                  (currentEmail && person.email && currentEmail.toLowerCase() === person.email.toLowerCase());

                const initial = person.name ? person.name.charAt(0).toUpperCase() : 'U';

                return (
                  <div
                    key={person.id}
                    onClick={() => handlePersonClick(person)}
                    className={`
                      w-full px-3.5 py-2.5 flex items-center justify-between transition-colors
                      ${
                        isSelf
                          ? 'bg-[#F8FAFC]/70 cursor-default'
                          : 'hover:bg-[#EFF6FF] cursor-pointer group'
                      }
                    `}
                    title={isSelf ? 'You are active today' : `Click to chat with ${person.name}`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* Avatar with Green Active Dot */}
                      <div className="relative flex-shrink-0">
                        <div
                          className={`
                            w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(idx)}
                            flex items-center justify-center text-white font-bold text-xs shadow-xs
                          `}
                        >
                          {initial}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#00B388] border-2 border-white" />
                      </div>

                      {/* Name & Role */}
                      <div className="min-w-0 text-left">
                        <div className="flex items-center space-x-1.5">
                          <p className="text-xs font-semibold text-[#0F172A] truncate">
                            {person.name}
                          </p>
                          {isSelf && (
                            <span className="text-[10px] font-bold text-[#64748B] bg-[#E2E8F0] px-1.5 py-0.2 rounded leading-tight">
                              You
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1.5 mt-0.5">
                          <span
                            className={`
                              text-[10px] font-medium px-1.5 py-0.2 rounded-sm capitalize
                              ${
                                person.role === 'ADMIN'
                                  ? 'bg-blue-50 text-[#0062E0]'
                                  : person.role === 'MENTOR'
                                  ? 'bg-purple-50 text-purple-700'
                                  : person.role === 'TESTER'
                                  ? 'bg-emerald-50 text-[#008766]'
                                  : 'bg-cyan-50 text-cyan-800'
                              }
                            `}
                          >
                            {person.role?.toLowerCase()}
                          </span>
                          {person.department && (
                            <span className="text-[10px] text-[#94A3B8] capitalize truncate">
                              • {person.department.toLowerCase()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Chat Action Cue for other users */}
                    {!isSelf && (
                      <div className="flex-shrink-0 ml-2 text-[#94A3B8] group-hover:text-[#0062E0] transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Subtext info */}
          <div className="px-4 py-2 border-t border-[#F1F5F9] bg-[#F8FAFC] text-[10px] font-mono text-[#94A3B8] flex items-center justify-between">
            <span>● Present today</span>
            <span>Click person to chat</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveTodayIndicator;
