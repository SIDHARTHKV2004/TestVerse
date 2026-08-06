import React, { useState } from 'react';
import { BugReport, Priority, BugSeverity, BugStatus } from '../types';
import { X, Bug, Image, AlertOctagon, CheckCircle2, User, Layers, Video } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BugModalProps {
  bug: BugReport | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveBug: (bugData: Partial<BugReport>) => void;
  projectsList: { id: string; name: string }[];
}

export const BugModal: React.FC<BugModalProps> = ({
  bug,
  isOpen,
  onClose,
  onSaveBug,
  projectsList
}) => {
  const { user } = useAuth();
  const isNew = !bug;

  const [title, setTitle] = useState(bug?.title || '');
  const [description, setDescription] = useState(bug?.description || '');
  const [stepsToReproduce, setStepsToReproduce] = useState(bug?.stepsToReproduce || '');
  const [expectedResult, setExpectedResult] = useState(bug?.expectedResult || '');
  const [actualResult, setActualResult] = useState(bug?.actualResult || '');
  const [priority, setPriority] = useState<Priority>(bug?.priority || 'High');
  const [severity, setSeverity] = useState<BugSeverity>(bug?.severity || 'Critical');
  const [status, setStatus] = useState<BugStatus>(bug?.status || 'Open');
  const [projectId, setProjectId] = useState(bug?.projectId || projectsList[0]?.id || 'proj-1');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !stepsToReproduce.trim()) return;

    const selectedProj = projectsList.find(p => p.id === projectId);

    onSaveBug({
      id: bug?.id || `BUG-${Date.now().toString().slice(-4)}`,
      title,
      description,
      stepsToReproduce,
      expectedResult,
      actualResult,
      priority,
      severity,
      status,
      projectId,
      projectName: selectedProj?.name || 'General Project',
      reporter: bug?.reporter || user,
      createdAt: bug?.createdAt || new Date().toISOString().split('T')[0]
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-rose-950/20">
          <div className="flex items-center space-x-2 text-rose-500">
            <Bug className="w-5 h-5" />
            <h2 className="font-bold text-base text-slate-900 dark:text-slate-100">
              {isNew ? 'Report New Bug Issue' : `Bug Details: ${bug.id}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                {projectsList.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Bug Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Clear title summarizing defect..."
                className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as BugSeverity)}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
                <option value="Blocker">Blocker</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as BugStatus)}
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Need Info">Need Info</option>
                <option value="Resolved">Resolved</option>
                <option value="Verified">Verified</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Bug Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed explanation of the issue..."
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Steps to Reproduce</label>
            <textarea
              rows={3}
              required
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              placeholder="1. Navigate to...\n2. Click on...\n3. Observe error..."
              className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Expected Result</label>
              <textarea
                rows={2}
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                placeholder="What should happen..."
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Actual Result</label>
              <textarea
                rows={2}
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                placeholder="What actually happens..."
                className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {bug?.screenshotUrl && (
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Attached Screenshot Proof</label>
              <img src={bug.screenshotUrl} alt="Bug screenshot" className="w-full h-48 object-cover rounded-xl border border-slate-700" />
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-semibold shadow-lg shadow-rose-600/30"
            >
              {isNew ? 'Log Defect' : 'Update Defect'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
