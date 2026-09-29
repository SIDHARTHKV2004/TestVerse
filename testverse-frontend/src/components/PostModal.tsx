import React, { useState } from 'react';
import { CommunityPost } from '../types';
import { X, Code, Image as ImageIcon, Link as LinkIcon, Tag, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface PostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (postData: Partial<CommunityPost>) => void;
}

export const PostModal: React.FC<PostModalProps> = ({
  isOpen,
  onClose,
  onCreatePost
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('SeleniumJava, Automation');
  const [codeLanguage, setCodeLanguage] = useState('java');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onCreatePost({
      content,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      codeSnippet: showCodeInput && codeSnippet ? { language: codeLanguage, code: codeSnippet } : undefined,
      linkUrl: linkUrl.trim() || undefined,
      author: user,
      likesCount: 0,
      commentsCount: 0,
      comments: [],
      createdAt: 'Just now'
    });

    setContent('');
    setCodeSnippet('');
    setLinkUrl('');
    onClose();
  };

  return (
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-[#E2E8F0] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-[#F1F5F9] flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2 text-[#0062E0] font-bold">
            <Send className="w-5 h-5" />
            <span className="text-[#0F172A]">Create Community Feed Post</span>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share useful test automation ideas, ask doubts, or suggest improvements... Use markdown formatting!"
              className="w-full p-3 bg-white border border-[#CBD5E1] rounded-xl text-[#0F172A] placeholder-slate-400 text-sm focus:ring-2 focus:ring-[#0062E0]/20 focus:border-[#0062E0] transition-all"
            />
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setShowCodeInput(!showCodeInput)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs transition-colors ${
                showCodeInput ? 'bg-[#0062E0] text-white border-[#0062E0]' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>{showCodeInput ? 'Remove Code Snippet' : 'Attach Code Snippet'}</span>
            </button>
          </div>

          {showCodeInput && (
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono text-[11px]">Code Snippet</span>
                <select
                  value={codeLanguage}
                  onChange={(e) => setCodeLanguage(e.target.value)}
                  className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[11px]"
                >
                  <option value="java">Java</option>
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="xml">XML / POM</option>
                </select>
              </div>
              <textarea
                rows={5}
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="// Paste Java / Playwright code here..."
                className="w-full p-2 bg-slate-950 font-mono text-cyan-300 text-xs border border-slate-800 rounded-lg focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-medium mb-1">Link URL (Optional)</label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://github.com/your-username/qa-framework"
              className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 text-sm focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-medium mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="SeleniumJava, TestNG, BugReport, Playwright"
              className="w-full p-2.5 bg-white border border-[#CBD5E1] rounded-lg text-[#0F172A] placeholder-slate-400 text-sm focus:border-[#0062E0] focus:ring-2 focus:ring-[#0062E0]/20"
            />
          </div>

          <div className="pt-4 border-t border-[#F1F5F9] flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-sm transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0062E0] hover:bg-[#0050B8] text-white rounded-lg font-medium text-sm shadow-sm hover:shadow transition-all"
            >
              Publish Post
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
