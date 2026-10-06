import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, X } from 'lucide-react';
import { API_BASE_URL } from '../services/api';

// ✅ Make props optional
interface SearchPageProps {
  query?: string;
  tasks?: any[];
  projects?: any[];
  bugs?: any[];
  users?: any[];
  onTaskClick?: (task: any) => void;
  onProjectClick?: (project: any) => void;
  onBugClick?: (bug: any) => void;
  onUserClick?: (user: any) => void;
}

const SearchPage: React.FC<SearchPageProps> = ({
                                                 query = '',
                                                 tasks = [],
                                                 projects = [],
                                                 bugs = [],
                                                 users = [],
                                                 onTaskClick = () => {},
                                                 onProjectClick = () => {},
                                                 onBugClick = () => {},
                                                 onUserClick = () => {}
                                               }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(query);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      setSearchTerm(query);
    }
  }, [query]);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
          `${API_BASE_URL}/api/search?q=${encodeURIComponent(searchTerm)}`,
          {
            headers: { 'Authorization': `Bearer ${token}` }
          }
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Search results:', data);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Search</h1>

        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for tasks, modules, bugs, users..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0062E0] focus:ring-1 focus:ring-[#0062E0] transition-colors shadow-sm"
            />
          </div>
          <button
              onClick={handleSearch}
              disabled={loading}
              className="px-5 py-2.5 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasks */}
          {tasks.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-3 border-b border-slate-100 pb-2">Tasks ({tasks.length})</h3>
                <div className="space-y-1">
                  {tasks.map((task: any) => (
                      <div
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="p-2.5 hover:bg-slate-50 hover:text-[#0062E0] rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="text-slate-700 font-medium">{task.title}</span>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* Projects/Modules */}
          {projects.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-3 border-b border-slate-100 pb-2">Modules ({projects.length})</h3>
                <div className="space-y-1">
                  {projects.map((project: any) => (
                      <div
                          key={project.id}
                          onClick={() => onProjectClick(project)}
                          className="p-2.5 hover:bg-slate-50 hover:text-[#0062E0] rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="text-slate-700 font-medium">{project.name}</span>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* Bugs */}
          {bugs.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-3 border-b border-slate-100 pb-2">Bugs ({bugs.length})</h3>
                <div className="space-y-1">
                  {bugs.map((bug: any) => (
                      <div
                          key={bug.id}
                          onClick={() => onBugClick(bug)}
                          className="p-2.5 hover:bg-slate-50 hover:text-[#0062E0] rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="text-slate-700 font-medium">{bug.title}</span>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* Users */}
          {users.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <h3 className="text-slate-900 font-semibold mb-3 border-b border-slate-100 pb-2">Users ({users.length})</h3>
                <div className="space-y-1">
                  {users.map((userItem: any) => (
                      <div
                          key={userItem.id}
                          onClick={() => onUserClick(userItem)}
                          className="p-2.5 hover:bg-slate-50 hover:text-[#0062E0] rounded-lg cursor-pointer transition-colors"
                      >
                        <span className="text-slate-700 font-medium">{userItem.name}</span>
                      </div>
                  ))}
                </div>
              </div>
          )}

          {/* No results */}
          {!loading && searchTerm && tasks.length === 0 && projects.length === 0 && bugs.length === 0 && users.length === 0 && (
              <div className="col-span-2 text-center py-16 text-slate-400 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                <p className="text-slate-600 font-medium">No results found for "{searchTerm}"</p>
              </div>
          )}
        </div>
      </div>
  );
};

export default SearchPage;