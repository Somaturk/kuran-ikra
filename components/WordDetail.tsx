
import React from 'react';
import { WordAnalysis } from '../types';

interface WordDetailProps {
  word: WordAnalysis;
  onClose: () => void;
}

const WordDetail: React.FC<WordDetailProps> = ({ word, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden border border-emerald-500/30 dark:border-amber-500/30 transform transition-all scale-100" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-emerald-600 dark:bg-amber-600 p-4 text-white flex justify-between items-center transition-colors">
          <h3 className="font-title text-xl">Kelime Analizi</h3>
          <button onClick={onClose} className="hover:bg-emerald-700 dark:hover:bg-amber-700 p-1 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-center border-b border-slate-200 dark:border-slate-700 pb-4">
            <p className="text-6xl font-arabic text-emerald-600 dark:text-amber-600 mb-3 transition-colors">{word.arabic}</p>
            <p className="text-xl font-bold text-slate-700 dark:text-slate-200">{word.turkish}</p>
            <p className="text-slate-500 italic text-lg">{word.meaning}</p>
          </div>
          
          <div>
            <h4 className="font-bold text-emerald-600 dark:text-amber-600 mb-2 flex items-center gap-2 text-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>
              Etimolojik Köken
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
              {word.etymology}
            </p>
          </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-900 p-3 text-center text-sm text-slate-400">
          Kapatmak için dışarı tıklayın
        </div>
      </div>
    </div>
  );
};

export default WordDetail;
