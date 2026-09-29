import React, { useState } from 'react';
import {
  X,
  Calendar,
  Upload,
  Paperclip,
  MessageSquare,
  Send,
  Clock,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Define types locally since they're not exported from types/index.ts
interface Attachment {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    avatar: string;
  };
}

interface Task {
  id: string;
  title: string;
  description: string;
  module: string;
  projectName: string;
  priority: 'Urgent' | 'High' | 'Medium' | 'Low';
  status: 'Not Started' | 'Accepted' | 'In Progress' | 'Need Help' | 'Waiting For Review' | 'Changes Requested' | 'Completed';
  dueDate: string;
  mentorName: string;
  instructions?: string;
  submissionNotes?: string;
  attachments?: Attachment[];
  comments?: Comment[];
}

type TaskStatus = 'Not Started' | 'Accepted' | 'In Progress' | 'Need Help' | 'Waiting For Review' | 'Changes Requested' | 'Completed';

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (taskId: string, newStatus: TaskStatus, notes?: string, files?: Attachment[]) => void;
  onAddComment: (taskId: string, commentText: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
                                                      task,
                                                      isOpen,
                                                      onClose,
                                                      onUpdateStatus,
                                                      onAddComment
                                                    }) => {
  const { user } = useAuth();
  const [commentInput, setCommentInput] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState(task?.submissionNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

  // Get user role from auth context
  const userRole = (user as any)?.role || 'STUDENT';

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    onAddComment(task.id, commentInput);
    setCommentInput('');
  };

  const handleSubmission = (newStatus: TaskStatus) => {
    setIsSubmitting(true);
    setTimeout(() => {
      const mockAttachment: Attachment = {
        id: `att-${Date.now()}`,
        name: `${task.title.replace(/\s+/g, '_')}_Submission.zip`,
        url: '#',
        size: '3.8 MB',
        type: 'ZIP'
      };
      onUpdateStatus(task.id, newStatus, submissionNotes, [mockAttachment]);
      setIsSubmitting(false);
      onClose();
    }, 600);
  };

  return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
        <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">

          {/* Header */}
          <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F8FAFC]">
            <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-[#EFF6FF] text-[#0062E0] border border-[#BFDBFE]">
              {task.module}
            </span>
              <span className="text-xs text-slate-500 font-medium">{task.projectName}</span>
            </div>
            <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">

            {/* Title & Priority */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-[#0F172A]">
                  {task.title}
                </h2>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    task.priority === 'Urgent' ? 'bg-red-50 text-red-700 border border-red-200' :
                        task.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-[#EFF6FF] text-[#0062E0] border border-[#BFDBFE]'
                }`}>
                {task.priority} Priority
              </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-[#F1F5F9]">
                <div className="flex items-center space-x-1.5">
                  <Calendar className="w-4 h-4 text-[#0062E0]" />
                  <span>Due Date: <strong className="text-[#0F172A]">{task.dueDate}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <UserCheck className="w-4 h-4 text-[#00B388]" />
                  <span>Mentor: <strong className="text-[#0F172A]">{task.mentorName}</strong></span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Status: <strong className="text-[#0062E0]">{task.status}</strong></span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Overview</h3>
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-sm leading-relaxed text-[#0F172A]">
                {task.description}
              </div>
            </div>

            {/* Instructions */}
            {task.instructions && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mentor Instructions</h3>
                  <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl text-sm leading-relaxed text-[#0062E0] whitespace-pre-line font-mono">
                    {task.instructions}
                  </div>
                </div>
            )}

            {/* Attachments */}
            {task.attachments && task.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Task Reference Files</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {task.attachments.map((att) => (
                        <a
                            key={att.id}
                            href={att.url}
                            className="p-3 bg-white border border-[#E2E8F0] rounded-xl flex items-center justify-between hover:border-[#0062E0] transition-colors shadow-sm"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            <Paperclip className="w-4 h-4 text-[#0062E0] flex-shrink-0" />
                            <span className="text-xs font-medium text-[#0F172A] truncate">{att.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{att.size}</span>
                        </a>
                    ))}
                  </div>
                </div>
            )}

            {/* Student Actions & Work Submission */}
            <div className="space-y-3 pt-4 border-t border-[#F1F5F9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Student Work Submission</h3>

              {userRole === 'STUDENT' && (
                  <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                <textarea
                    value={submissionNotes}
                    onChange={(e) => setSubmissionNotes(e.target.value)}
                    placeholder="Add submission notes, execution steps, or test execution summary..."
                    className="w-full p-3 text-xs bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0]"
                    rows={3}
                />

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <button
                          type="button"
                          className="flex items-center space-x-1.5 px-3 py-2 bg-white border border-[#E2E8F0] text-slate-700 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <Upload className="w-4 h-4 text-[#0062E0]" />
                        <span>Upload Test Artifact / ZIP Project</span>
                      </button>

                      <div className="flex space-x-2">
                        {task.status === 'Not Started' && (
                            <button
                                onClick={() => handleSubmission('Accepted')}
                                className="px-4 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-xs font-semibold shadow-sm"
                            >
                              Accept Task
                            </button>
                        )}
                        {task.status === 'Accepted' && (
                            <button
                                onClick={() => handleSubmission('In Progress')}
                                className="px-4 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-xs font-semibold shadow-sm"
                            >
                              Start Working
                            </button>
                        )}
                        <button
                            onClick={() => handleSubmission('Need Help')}
                            className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-lg text-xs font-semibold flex items-center space-x-1"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Need Help</span>
                        </button>
                        <button
                            onClick={() => handleSubmission('Waiting For Review')}
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-[#00B388] hover:bg-[#009670] text-white rounded-lg text-xs font-semibold shadow-sm"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Work for Review'}
                        </button>
                      </div>
                    </div>
                  </div>
              )}

              {userRole === 'MENTOR' && (
                  <div className="flex space-x-3 bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0]">
                    <button
                        onClick={() => onUpdateStatus(task.id, 'Changes Requested', 'Please revise test case assertions.')}
                        className="flex-1 py-2 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-semibold text-center"
                    >
                      Request Changes
                    </button>
                    <button
                        onClick={() => onUpdateStatus(task.id, 'Completed')}
                        className="flex-1 py-2 bg-[#00B388] hover:bg-[#009670] text-white rounded-lg text-xs font-semibold text-center shadow-sm"
                    >
                      Approve & Mark Completed
                    </button>
                  </div>
              )}
            </div>

            {/* Discussion & Comments */}
            <div className="space-y-4 pt-4 border-t border-[#F1F5F9]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-[#0062E0]" />
                <span>Discussion & Questions ({task.comments?.length || 0})</span>
              </h3>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {task.comments?.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3 p-3 bg-white rounded-xl border border-[#E2E8F0] shadow-sm">
                      <img
                          src={comment.author?.avatar || '/default-avatar.png'}
                          alt={comment.author?.name || 'User'}
                          className="w-7 h-7 rounded-full object-cover"
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-[#0F172A]">{comment.author?.name || 'Unknown User'}</span>
                          <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed">{comment.content}</p>
                      </div>
                    </div>
                ))}
              </div>

              <form onSubmit={handleAddComment} className="flex space-x-2 pt-2">
                <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Ask a question or add a comment..."
                    className="flex-1 px-3 py-2 text-xs bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0062E0]"
                />
                <button
                    type="submit"
                    className="px-3 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>

          </div>

        </div>
      </div>
  );
};