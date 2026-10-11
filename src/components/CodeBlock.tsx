import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  runnable?: boolean;
  onRun?: (code: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'python',
  title,
  runnable = false,
  onRun,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  return (
    <div className="code-block-wrapper my-4 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-lg">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 border-b border-slate-700 text-xs font-mono text-slate-300">
        <div className="flex items-center space-x-2">
          <span className="inline-block w-3 h-3 rounded-full bg-rose-500/80"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500/80"></span>
          <span className="inline-block w-3 h-3 rounded-full bg-emerald-500/80"></span>
          <span className="ml-2 font-semibold text-slate-200">{title || language}</span>
        </div>
        <div className="flex items-center space-x-2">
          {runnable && onRun && (
            <button
              onClick={() => onRun(code)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-sans text-xs transition"
              title="Run in in-browser Python playground"
            >
              <Play size={12} className="fill-current" />
              <span>Run</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-200 transition text-xs"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-sans">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span className="font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto text-sm font-mono leading-relaxed bg-slate-950 text-slate-100">
        <pre className="m-0 whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};
