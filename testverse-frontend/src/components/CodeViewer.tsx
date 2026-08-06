import React from 'react';
import { X, Copy, Check, Terminal } from 'lucide-react';

interface CodeViewerProps {
  title: string;
  code: string;
  language?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const CodeViewer: React.FC<CodeViewerProps> = ({
  title,
  code,
  language = 'java',
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        
        <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2 text-indigo-400">
            <Terminal className="w-4 h-4" />
            <span className="font-mono text-xs font-semibold text-slate-200">{title}</span>
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400 font-mono uppercase">{language}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs flex items-center space-x-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto bg-[#0b0f17]">
          <pre className="font-mono text-xs text-indigo-300 whitespace-pre-wrap leading-relaxed">
            {code}
          </pre>
        </div>

      </div>
    </div>
  );
};
