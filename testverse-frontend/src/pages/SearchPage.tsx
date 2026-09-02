import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Search, X } from 'lucide-react';

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
          `http://localhost:8080/api/search?q=${encodeURIComponent(searchTerm)}`,
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
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white mb-6">Search</h1>

        <div className="flex gap-2 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search for tasks, modules, bugs, users..."
                className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-[#ff6b00]"
            />
          </div>
          <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-[#ff6b00] hover:bg-[#cc5500] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tasks */}
          {tasks.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Tasks ({tasks.length})</h3>
                {tasks.map((task: any) => (
                    <div
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="p-2 hover:bg-[#1a1a1a] rounded cursor-pointer"
                    >
                      <span className="text-slate-300">{task.title}</span>
                    </div>
                ))}
              </div>
          )}

          {/* Projects/Modules */}
          {projects.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Modules ({projects.length})</h3>
                {projects.map((project: any) => (
                    <div
                        key={project.id}
                        onClick={() => onProjectClick(project)}
                        className="p-2 hover:bg-[#1a1a1a] rounded cursor-pointer"
                    >
                      <span className="text-slate-300">{project.name}</span>
                    </div>
                ))}
              </div>
          )}

          {/* Bugs */}
          {bugs.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Bugs ({bugs.length})</h3>
                {bugs.map((bug: any) => (
                    <div
                        key={bug.id}
                        onClick={() => onBugClick(bug)}
                        className="p-2 hover:bg-[#1a1a1a] rounded cursor-pointer"
                    >
                      <span className="text-slate-300">{bug.title}</span>
                    </div>
                ))}
              </div>
          )}

          {/* Users */}
          {users.length > 0 && (
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4">
                <h3 className="text-white font-medium mb-2">Users ({users.length})</h3>
                {users.map((userItem: any) => (
                    <div
                        key={userItem.id}
                        onClick={() => onUserClick(userItem)}
                        className="p-2 hover:bg-[#1a1a1a] rounded cursor-pointer"
                    >
                      <span className="text-slate-300">{userItem.name}</span>
                    </div>
                ))}
              </div>
          )}

          {/* No results */}
          {!loading && searchTerm && tasks.length === 0 && projects.length === 0 && bugs.length === 0 && users.length === 0 && (
              <div className="col-span-2 text-center py-12 text-slate-400">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No results found for "{searchTerm}"</p>
              </div>
          )}
        </div>
      </div>
  );
};

export default SearchPage;