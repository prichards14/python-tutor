import React, { useState, useEffect } from 'react';
import { runPythonCode } from '../utils/pyodide';
import { Play, RotateCcw, X, Terminal, Loader2, Sparkles, Check } from 'lucide-react';

interface PlaygroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
  title?: string;
}

const DEFAULT_SNIPPET = `# Python 3.12 WebAssembly Playground
# Run pure Python right in your browser!

from collections import Counter, defaultdict

logs = ["auth_success", "db_timeout", "auth_success", "auth_failure", "auth_success"]
counts = Counter(logs)
print("Log Frequencies:", counts)

# List comprehension:
squares = [x**2 for x in range(10) if x % 2 == 0]
print("Even squares:", squares)
`;

export const PlaygroundModal: React.FC<PlaygroundModalProps> = ({
  isOpen,
  onClose,
  initialCode,
  title = 'Interactive Python Playground',
}) => {
  const [code, setCode] = useState(initialCode || DEFAULT_SNIPPET);
  const [output, setOutput] = useState<string>('');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
    }
  }, [initialCode]);

  if (!isOpen) return null;

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('Loading Pyodide WebAssembly runtime and executing code...\n');
    setExecutionTime(null);

    const res = await runPythonCode(code, (text) => {
      setOutput(text);
    });

    setIsRunning(false);
    setExecutionTime(res.executionTimeMs);
  };

  const handleReset = () => {
    setCode(initialCode || DEFAULT_SNIPPET);
    setOutput('');
    setExecutionTime(null);
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-4xl h-[85vh] rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-muted/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Terminal size={20} />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Pyodide WebAssembly 3.12
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">Test Python expressions, comprehensions, and algorithms live</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border hover:bg-surface text-foreground transition flex items-center gap-1.5"
            >
              {isCopied ? <Check size={14} className="text-emerald-400" /> : <Sparkles size={14} />}
              <span>{isCopied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition"
              title="Reset code"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition"
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Editor and Terminal */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border overflow-hidden">
          {/* Left: Code Editor Area */}
          <div className="flex flex-col h-full bg-slate-950">
            <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-mono text-slate-400 flex items-center justify-between">
              <span>main.py</span>
              <span className="text-[11px] text-slate-500">Ctrl/Cmd + Enter to run</span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleRun();
                }
              }}
              className="flex-1 w-full p-4 font-mono text-sm leading-relaxed text-slate-100 bg-transparent resize-none focus:outline-none overflow-y-auto selection:bg-indigo-600/40"
              placeholder="# Type Python code here..."
              spellCheck={false}
            />
          </div>

          {/* Right: Output Console */}
          <div className="flex flex-col h-full bg-slate-900/95">
            <div className="px-4 py-2 bg-slate-800/90 border-b border-slate-700 text-xs font-mono text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Console Output</span>
              </span>
              {executionTime !== null && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Runtime: {executionTime}ms
                </span>
              )}
            </div>
            <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed select-text">
              {output || (
                <span className="text-slate-500 italic">
                  Click "Run Code" to execute Python in your browser via WebAssembly.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-surface-muted/60">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Zero server requests • 100% Client-side WebAssembly execution
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition"
            >
              Close
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-md disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <Play size={14} className="fill-current" />
                  <span>Run Code</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
