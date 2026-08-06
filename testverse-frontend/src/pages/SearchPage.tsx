import React from 'react';
import { Task, Project, CommunityPost, BugReport } from '../types';
import { Search, Briefcase, CheckSquare, Bug, MessageSquare, ArrowRight } from 'lucide-react';

interface SearchPageProps {
  query: string;
  tasks: Task[];
  projects: Project[];
  bugs: BugReport[];
  posts: CommunityPost[];
  onTaskClick: (task: Task) => void;
  onProjectClick: (project: Project) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({
  query,
  tasks,
  projects,
  bugs,
  posts,
  onTaskClick,
  onProjectClick
}) => {
  const q = query.toLowerCase().trim();

  const matchingTasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.module.toLowerCase().includes(q));
  const matchingProjects = projects.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  const matchingBugs = bugs.filter(b => b.title.toLowerCase().includes(q) || b.id.toLowerCase().includes(q));
  const matchingPosts = posts.filter(p => p.content.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center space-x-3">
        <Search className="w-6 h-6 text-indigo-500" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Global Search Results for <span className="text-indigo-400">"{query}"</span>
        </h1>
      </div>

      {!q ? (
        <div className="text-slate-400 text-sm">Type a search query in the header to search across TestVerse...</div>
      ) : (
        <div className="space-y-6">
          
          {/* Projects Results */}
          {matchingProjects.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>Projects ({matchingProjects.length})</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {matchingProjects.map(p => (
                  <div
                    key={p.id}
                    onClick={() => onProjectClick(p)}
                    className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer text-xs"
                  >
                    <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</div>
                    <div className="text-slate-400 mt-1">{p.category} • {p.progress}% Completed</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tasks Results */}
          {matchingTasks.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-emerald-400" />
                <span>Tasks ({matchingTasks.length})</span>
              </h3>
              <div className="space-y-2">
                {matchingTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onTaskClick(t)}
                    className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-indigo-500 cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</div>
                      <div className="text-slate-400 mt-0.5">{t.projectName} • {t.status}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bugs Results */}
          {matchingBugs.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                <Bug className="w-4 h-4 text-rose-400" />
                <span>Bugs Logged ({matchingBugs.length})</span>
              </h3>
              <div className="space-y-2">
                {matchingBugs.map(b => (
                  <div key={b.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-rose-400">{b.id}: {b.title}</div>
                    <div className="text-slate-400">{b.projectName} • Severity: {b.severity}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
