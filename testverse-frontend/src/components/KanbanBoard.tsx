import React, { useState } from 'react';
import { 
  Task, 
  TaskStatus, 
  Priority 
} from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  HelpCircle, 
  Eye, 
  RotateCcw, 
  Play, 
  Plus, 
  User, 
  Paperclip, 
  MessageSquare, 
  Calendar, 
  ArrowRight,
  Filter,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onCreateTaskClick?: () => void;
}

const STATUS_COLUMNS: { status: TaskStatus; label: string; icon: any; color: string; bg: string }[] = [
  { status: 'Not Started', label: 'Not Started', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' },
  { status: 'Accepted', label: 'Accepted', icon: Check, color: 'text-blue-600', bg: 'bg-blue-50/40' },
  { status: 'In Progress', label: 'In Progress', icon: Play, color: 'text-[#0062E0]', bg: 'bg-blue-50/70' },
  { status: 'Need Help', label: 'Need Help', icon: HelpCircle, color: 'text-rose-600', bg: 'bg-rose-50/40' },
  { status: 'Waiting For Review', label: 'Waiting Review', icon: Eye, color: 'text-amber-600', bg: 'bg-amber-50/40' },
  { status: 'Changes Requested', label: 'Changes Req.', icon: RotateCcw, color: 'text-orange-600', bg: 'bg-orange-50/40' },
  { status: 'Completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50/40' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, 
  onTaskClick, 
  onStatusChange,
  onCreateTaskClick 
}) => {
  const { role } = useAuth();
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  const filteredTasks = tasks.filter(t => {
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  const getPriorityBadgeClass = (priority: Priority) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-50 text-red-700 border-red-200 font-bold';
      case 'High': return 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
      case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Board Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
            <Filter className="w-4 h-4 text-[#0062E0]" />
            <span>Priority Filter:</span>
          </div>
          {['ALL', 'Low', 'Medium', 'High', 'Urgent'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-md font-medium transition-colors ${
                priorityFilter === p
                  ? 'bg-[#0062E0] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {role === 'MENTOR' && onCreateTaskClick && (
          <button
            onClick={onCreateTaskClick}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Task</span>
          </button>
        )}
      </div>

      {/* 7-Column Kanban Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map(col => {
          const ColumnIcon = col.icon;
          const columnTasks = filteredTasks.filter(t => t.status === col.status);

          return (
            <div 
              key={col.status} 
              className={`rounded-2xl border border-slate-200/80 p-3 flex flex-col kanban-col transition-all ${col.bg}`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/80">
                <div className="flex items-center space-x-1.5">
                  <ColumnIcon className={`w-4 h-4 ${col.color}`} />
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    {col.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200 shadow-xs">
                  {columnTasks.length}
                </span>
              </div>

              {/* Task Cards */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[700px] pr-1">
                {columnTasks.length === 0 ? (
                  <div className="h-28 border border-dashed border-slate-300 rounded-xl flex items-center justify-center text-[11px] text-slate-400 italic bg-white/50">
                    No tasks
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => onTaskClick(task)}
                      className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:shadow-md hover:border-[#0062E0] cursor-pointer transition-all group space-y-2 relative"
                    >
                      {/* Priority & Module */}
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md border ${getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[100px]" title={task.module}>
                          {task.module}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-[#0062E0] transition-colors line-clamp-2 leading-snug">
                        {task.title}
                      </h4>

                      {/* Project Name */}
                      <div className="text-[10px] text-[#0062E0] font-medium truncate">
                        {task.projectName}
                      </div>

                      {/* Meta Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{task.dueDate}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          {task.attachments && task.attachments.length > 0 && (
                            <span className="flex items-center space-x-0.5">
                              <Paperclip className="w-3 h-3" />
                              <span>{task.attachments.length}</span>
                            </span>
                          )}
                          {task.comments && task.comments.length > 0 && (
                            <span className="flex items-center space-x-0.5">
                              <MessageSquare className="w-3 h-3" />
                              <span>{task.comments.length}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Status Shift Controls */}
                      <div className="mt-2 pt-1 flex items-center justify-between text-[10px] border-t border-slate-100 opacity-90 group-hover:opacity-100">
                        <span className="text-slate-400 font-medium">Move:</span>
                        <div className="flex space-x-1">
                          {task.status !== 'Completed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const nextStatus: TaskStatus = 
                                  task.status === 'Not Started' ? 'Accepted' :
                                  task.status === 'Accepted' ? 'In Progress' :
                                  task.status === 'In Progress' ? 'Waiting For Review' :
                                  task.status === 'Waiting For Review' ? 'Completed' : 'Completed';
                                onStatusChange(task.id, nextStatus);
                              }}
                              className="px-2 py-0.5 rounded bg-blue-50 text-[#0062E0] hover:bg-[#0062E0] hover:text-white font-medium transition-colors border border-blue-200"
                              title="Advance status"
                            >
                              Next →
                            </button>
                          )}
                        </div>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
