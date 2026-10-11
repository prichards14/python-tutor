import React, { useState } from 'react';
import type { SeniorBridge } from '../types';
import { Layers, Terminal, Cpu, Sparkles } from 'lucide-react';

interface SeniorBridgeCalloutProps {
  bridge: SeniorBridge;
}

export const SeniorBridgeCallout: React.FC<SeniorBridgeCalloutProps> = ({ bridge }) => {
  const [activeTab, setActiveTab] = useState<'csharp' | 'c_modula2' | 'javascript' | 'c64_basic'>('csharp');

  return (
    <div className="senior-bridge-card rounded-2xl p-5 my-6 border transition shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-foreground">Senior Engineer Architectural Bridge</h3>
            <p className="text-xs text-muted-foreground">Direct translation from your previous engineering stacks</p>
          </div>
        </div>

        {/* Language Tabs */}
        <div className="flex flex-wrap gap-1 bg-surface-muted p-1 rounded-xl text-xs font-medium">
          {bridge.csharp && (
            <button
              onClick={() => setActiveTab('csharp')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'csharp'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <Layers size={13} />
              <span>From C# / .NET</span>
            </button>
          )}

          {bridge.c_modula2 && (
            <button
              onClick={() => setActiveTab('c_modula2')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'c_modula2'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <Cpu size={13} />
              <span>From C & Modula-2</span>
            </button>
          )}

          {bridge.javascript && (
            <button
              onClick={() => setActiveTab('javascript')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'javascript'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <Terminal size={13} />
              <span>From JavaScript</span>
            </button>
          )}

          {bridge.c64_basic && (
            <button
              onClick={() => setActiveTab('c64_basic')}
              className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
                activeTab === 'c64_basic'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface'
              }`}
            >
              <span>🕹️ C64 BASIC</span>
            </button>
          )}
        </div>
      </div>

      {/* Content panel */}
      <div className="text-sm leading-relaxed text-foreground/90 pl-1">
        {activeTab === 'csharp' && bridge.csharp && (
          <div className="flex items-start gap-3">
            <span className="font-semibold text-indigo-400 whitespace-nowrap text-xs uppercase tracking-wider py-0.5 px-2 rounded bg-indigo-500/10 border border-indigo-500/20">
              C# / .NET
            </span>
            <p className="flex-1 m-0">{bridge.csharp}</p>
          </div>
        )}

        {activeTab === 'c_modula2' && bridge.c_modula2 && (
          <div className="flex items-start gap-3">
            <span className="font-semibold text-blue-400 whitespace-nowrap text-xs uppercase tracking-wider py-0.5 px-2 rounded bg-blue-500/10 border border-blue-500/20">
              C / Modula-2
            </span>
            <p className="flex-1 m-0">{bridge.c_modula2}</p>
          </div>
        )}

        {activeTab === 'javascript' && bridge.javascript && (
          <div className="flex items-start gap-3">
            <span className="font-semibold text-amber-400 whitespace-nowrap text-xs uppercase tracking-wider py-0.5 px-2 rounded bg-amber-500/10 border border-amber-500/20">
              JavaScript
            </span>
            <p className="flex-1 m-0">{bridge.javascript}</p>
          </div>
        )}

        {activeTab === 'c64_basic' && bridge.c64_basic && (
          <div className="flex items-start gap-3">
            <span className="font-semibold text-emerald-400 whitespace-nowrap text-xs uppercase tracking-wider py-0.5 px-2 rounded bg-emerald-500/10 border border-emerald-500/20">
              C64 BASIC
            </span>
            <p className="flex-1 m-0">{bridge.c64_basic}</p>
          </div>
        )}
      </div>
    </div>
  );
};
