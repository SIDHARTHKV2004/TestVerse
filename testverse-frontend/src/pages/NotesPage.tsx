import React, { useState } from 'react';
import { NoteResource } from '../types';
// Mock data import removed
import { 
  BookOpen, 
  FileText, 
  Video, 
  Link as LinkIcon, 
  Bookmark, 
  Upload, 
  Plus, 
  Search,
  ExternalLink,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotesPage: React.FC = () => {
  const { role, user } = useAuth();
  const [notes, setNotes] = useState<NoteResource[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'PDF' | 'VIDEO' | 'ASSIGNMENT' | 'LINK'>('PDF');
  const [category, setCategory] = useState('Selenium');
  const [url, setUrl] = useState('');

  const toggleBookmark = (id: string) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, isBookmarked: !n.isBookmarked } : n));
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newNote: NoteResource = {
      id: `note-${Date.now()}`,
      title,
      description,
      type,
      url: url || '#',
      fileSize: type === 'PDF' ? '3.2 MB' : undefined,
      uploadedBy: user,
      isBookmarked: false,
      category,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setNotes(prev => [newNote, ...prev]);
    setTitle('');
    setShowUploadModal(false);
  };

  const filteredNotes = notes.filter(n => {
    if (selectedCategory === 'BOOKMARKS' && !n.isBookmarked) return false;
    if (selectedCategory !== 'ALL' && selectedCategory !== 'BOOKMARKS' && n.category !== selectedCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-amber-500" />
            <span>Notes, PDF Resources & Assignments Repository</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access study guides, Selenium handbooks, video lectures, and bookmark reference materials.
          </p>
        </div>

        {role === 'MENTOR' && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-amber-600/30"
          >
            <Upload className="w-4 h-4" />
            <span>Upload New Material</span>
          </button>
        )}
      </div>

      {/* Categories Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 text-xs">
        {['ALL', 'BOOKMARKS', 'Selenium', 'Playwright', 'API Testing'].map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {cat === 'BOOKMARKS' ? '⭐ Bookmarked Items' : cat}
          </button>
        ))}
      </div>

      {/* Grid of Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map(note => (
          <div key={note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  note.type === 'PDF' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                  note.type === 'VIDEO' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                  'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {note.type}
                </span>

                <button
                  onClick={() => toggleBookmark(note.id)}
                  className={`p-1 rounded-lg transition-colors ${
                    note.isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-slate-400 hover:text-amber-400'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{note.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{note.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>By {note.uploadedBy.name}</span>
                <span>{note.createdAt}</span>
              </div>

              <a
                href={note.url}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-semibold flex items-center justify-center space-x-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-indigo-400" />
                <span>Open Material {note.fileSize ? `(${note.fileSize})` : ''}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 text-xs">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Upload Learning Resource</h2>

            <form onSubmit={handleUploadSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Resource Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Playwright Page Object Model Architecture PDF"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="PDF">PDF Document</option>
                    <option value="VIDEO">Video Lecture</option>
                    <option value="ASSIGNMENT">Assignment</option>
                    <option value="LINK">Reference Link</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                  >
                    <option value="Selenium">Selenium</option>
                    <option value="Playwright">Playwright</option>
                    <option value="API Testing">API Testing</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Resource URL / Link</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://testverse.io/materials/guide.pdf"
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief summary of learning material..."
                  className="w-full p-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
