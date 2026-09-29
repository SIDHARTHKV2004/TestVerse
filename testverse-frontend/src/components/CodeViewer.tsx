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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2 text-[#0062E0]">
            <Terminal className="w-4 h-4" />
            <span className="font-mono text-xs font-semibold text-slate-900">{title}</span>
            <span className="text-[10px] bg-blue-50 text-[#0062E0] border border-blue-200 px-2 py-0.5 rounded font-mono uppercase font-semibold">{language}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-xs flex items-center space-x-1 font-medium transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span className={copied ? 'text-emerald-600' : ''}>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4 max-h-[70vh] overflow-y-auto bg-slate-900">
          <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
            {code}
          </pre>
        </div>

      </div>
    </div>
  );
};
