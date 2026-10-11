import React from 'react';
import { Award, CheckCircle, Download, X } from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedCount: number;
  averageScore: number;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  completedCount,
  averageScore,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col w-full max-w-2xl rounded-3xl bg-surface border-2 border-emerald-500/40 shadow-2xl overflow-hidden p-8 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
        >
          <X size={20} />
        </button>

        {/* Certificate Card Container */}
        <div className="border-4 border-double border-emerald-500/30 rounded-2xl p-8 bg-gradient-to-b from-surface-muted/60 to-surface">
          <div className="inline-flex p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 mb-4 border border-emerald-500/20">
            <Award size={48} />
          </div>

          <h2 className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-bold mb-1">
            Certificate of Achievement
          </h2>
          <h1 className="text-3xl font-black text-foreground mb-4">
            Senior Python Software Engineer
          </h1>

          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
            Successfully completed the 14-Day Accelerated Python curriculum spanning the Python Mental Model, 
            Data Processing, Web APIs with FastAPI, Concurrency & the GIL, and Production Engineering.
          </p>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto mb-6 py-4 border-y border-border text-center">
            <div>
              <div className="text-2xl font-black text-foreground">{completedCount} / 14</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Days Passed (≥80%)</div>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">{averageScore}%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Average Accuracy</div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
            <CheckCircle size={14} className="text-emerald-400" />
            <span>Validated via Local Storage • Ready for Production</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-lg"
          >
            <Download size={14} />
            <span>Print / Save Certificate</span>
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-border hover:bg-surface-muted text-foreground text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
