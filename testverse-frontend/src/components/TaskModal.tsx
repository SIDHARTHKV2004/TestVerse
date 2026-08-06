import React, { useState } from 'react';
import { Task, TaskStatus, Priority, Attachment } from '../types';
import { 
  X, 
  Calendar, 
  Priority as PriorityIcon, 
  Upload, 
  Paperclip, 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  FileText, 
  HelpCircle,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  const { user, role } = useAuth();
  const [commentInput, setCommentInput] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState(task?.submissionNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !task) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/60">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/30">
              {task.module}
            </span>
            <span className="text-xs text-slate-400 font-medium">{task.projectName}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Title & Priority */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {task.title}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                task.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                task.priority === 'High' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                'bg-blue-500/20 text-blue-400 border border-blue-500/30'
              }`}>
                {task.priority} Priority
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Due Date: <strong className="text-slate-800 dark:text-slate-200">{task.dueDate}</strong></span>
              </div>
              <div className="flex items-center space-x-1">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>Mentor: <strong className="text-slate-800 dark:text-slate-200">{task.mentorName}</strong></span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Status: <strong className="text-indigo-400">{task.status}</strong></span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Overview</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {task.description}
            </div>
          </div>

          {/* Instructions */}
          {task.instructions && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Mentor Instructions</h3>
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-sm leading-relaxed text-indigo-900 dark:text-indigo-200 whitespace-pre-line font-mono">
                {task.instructions}
              </div>
            </div>
          )}

          {/* Attachments */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Reference Files</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {task.attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.url}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Paperclip className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <span className="text-xs font-medium truncate">{att.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{att.size}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Student Actions & Work Submission */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Student Work Submission</h3>

            {role === 'STUDENT' && (
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <textarea
                  value={submissionNotes}
                  onChange={(e) => setSubmissionNotes(e.target.value)}
                  placeholder="Add submission notes, execution steps, or test execution summary..."
                  className="w-full p-3 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="flex items-center space-x-1.5 px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>Upload Test Artifact / ZIP Project</span>
                  </button>

                  <div className="flex space-x-2">
                    {task.status === 'Not Started' && (
                      <button
                        onClick={() => handleSubmission('Accepted')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Accept Task
                      </button>
                    )}
                    {task.status === 'Accepted' && (
                      <button
                        onClick={() => handleSubmission('In Progress')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Start Working
                      </button>
                    )}
                    <button
                      onClick={() => handleSubmission('Need Help')}
                      className="px-3 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600/30 rounded-lg text-xs font-semibold flex items-center space-x-1"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Need Help</span>
                    </button>
                    <button
                      onClick={() => handleSubmission('Waiting For Review')}
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/20"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Work for Review'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {role === 'MENTOR' && (
              <div className="flex space-x-3 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => onUpdateStatus(task.id, 'Changes Requested', 'Please revise test case assertions.')}
                  className="flex-1 py-2 bg-orange-600/20 text-orange-400 border border-orange-500/40 hover:bg-orange-600/30 rounded-lg text-xs font-semibold text-center"
                >
                  Request Changes
                </button>
                <button
                  onClick={() => onUpdateStatus(task.id, 'Completed')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold text-center shadow-lg shadow-emerald-600/20"
                >
                  Approve & Mark Completed
                </button>
              </div>
            )}
          </div>

          {/* Discussion & Comments */}
          <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <span>Discussion & Questions ({task.comments?.length || 0})</span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {task.comments?.map(comment => (
                <div key={comment.id} className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
                  <img src={comment.author.avatar} alt={comment.author.name} className="w-7 h-7 rounded-full object-cover" />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200">{comment.author.name}</span>
                      <span className="text-[10px] text-slate-400">{comment.createdAt}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{comment.content}</p>
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
                className="flex-1 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1"
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
