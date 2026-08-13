
import React from 'react';
import { WordAnalysis } from '../types';

interface WordDetailModalProps {
    word: WordAnalysis;
    onClose: () => void;
}

export const WordDetailModal: React.FC<WordDetailModalProps> = ({ word, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-scale-in" onClick={e => e.stopPropagation()}>
                {/* Header with big Arabic word */}
                <div className="bg-emerald-50 dark:bg-slate-800 p-8 text-center border-b border-emerald-100 dark:border-slate-700 relative">
                    <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <h2 className="text-5xl font-kuran text-slate-800 dark:text-slate-100 mb-2">{word.arabic}</h2>
                    <p className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">{word.meaning}</p>
                </div>

                {/* Details */}
                <div className="p-6 space-y-4">
                    {/* Etymology */}
                    <div>
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Köken (Etimoloji)</h3>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {word.etymology || "Bu kelime için etimolojik veri bulunamadı."}
                        </p>
                    </div>

                    {/* Additional placeholder details if we had grammar etc */}
                    <div className="pt-2">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Transkripsiyon</h3>
                        <p className="text-slate-600 dark:text-slate-400 font-mono text-sm">
                            {word.turkish || "-"}
                        </p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                    <button onClick={onClose} className="text-emerald-600 dark:text-emerald-500 font-bold text-sm hover:underline">Kapat</button>
                </div>
            </div>
        </div>
    );
};
