
import React, { useState } from 'react';
import { VerseAnalysis, WordAnalysis } from '../types';
import WordDetail from './WordDetail';

interface SlideViewProps {
  verse: VerseAnalysis;
  totalVerses: number;
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
  nextSegment?: string | null; // Optional: "8-14" or null
  surahName: string;
  nextSurahName?: string | null; // New prop for next surah navigation
}

const SlideView: React.FC<SlideViewProps> = ({ verse, totalVerses, currentIndex, onNext, onPrev, onClose, nextSegment, surahName, nextSurahName }) => {
  const [selectedWord, setSelectedWord] = useState<WordAnalysis | null>(null);

  // Dynamic font size for longer verses
  const isLongText = verse.arabicText.length > 150;
  const arabicFontSize = isLongText ? "text-3xl md:text-5xl leading-loose" : "text-4xl md:text-6xl leading-loose";

  // Determine button state for the last slide
  const isLastSlide = currentIndex === totalVerses;
  const isSurahFinished = isLastSlide && !nextSegment;

  return (
    <div className="flex flex-col max-w-6xl mx-auto w-full relative">
      {/* Header / Navigation Indicator */}
      <div className="flex justify-between items-center mb-2 md:mb-4 shrink-0">
        <div className="bg-emerald-100 dark:bg-amber-900/30 text-emerald-800 dark:text-amber-200 px-4 py-1.5 rounded-full text-sm md:text-base font-bold border border-emerald-200 dark:border-amber-800 transition-colors">
          {surahName} {verse.verseNumber}. Ayet
        </div>
        <div className="flex items-center gap-2 md:gap-4">
           <div className="text-sm text-slate-400 font-bold">
             {currentIndex} / {totalVerses}
           </div>
           {/* Close Button */}
           <button 
             onClick={onClose}
             className="bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white text-slate-500 dark:text-slate-400 p-2 rounded-full transition-colors"
             title="Listeye Dön"
           >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
           </button>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row relative transition-colors duration-300">
        
        {/* Left Side: Text & Words */}
        <div className="flex-1 p-5 md:p-8 flex flex-col z-10">
            
            {/* Arabic Text Area */}
            <div className="mb-6 w-full shrink-0 flex flex-col items-center">
               <div className="relative w-full text-center group">
                 <p className={`${arabicFontSize} font-arabic text-slate-800 dark:text-slate-100 drop-shadow-sm py-2 px-2`} dir="rtl">
                   {verse.arabicText}
                 </p>
               </div>
            </div>

            {/* Translation & Pronunciation Area */}
            <div className="space-y-6 mb-8 max-w-3xl mx-auto text-center shrink-0 w-full">
              
              {/* Turkish Pronunciation */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-lg md:text-xl text-emerald-600 dark:text-amber-600 font-semibold tracking-wide transition-colors">
                  "{verse.turkishPronunciation}"
                </p>
              </div>
              
              {/* Turkish Translation */}
              <div className="relative group border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-serif italic leading-relaxed px-2">
                  {verse.turkishTranslation}
                </p>
              </div>
            </div>

            {/* Interactive Words Grid - Improved Colors for Visibility */}
            <div className="w-full mt-auto">
              <p className="text-xs uppercase tracking-widest text-slate-400 mb-3 font-bold text-center">Kelime Kelime Analiz (Detay için Tıklayın)</p>
              <div className="flex flex-wrap justify-center gap-3 pb-4">
                {verse.wordAnalysis.map((word, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedWord(word)}
                    className="flex flex-col items-center px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-sm hover:border-emerald-500 dark:hover:border-amber-500 hover:bg-emerald-50 dark:hover:bg-amber-900/20 rounded-lg transition-all duration-200 group min-w-[90px]"
                  >
                    <span className="font-arabic text-xl md:text-2xl text-slate-900 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-amber-600 mb-1 transition-colors">{word.arabic}</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-amber-600 uppercase tracking-tight transition-colors">{word.turkish}</span>
                  </button>
                ))}
              </div>
            </div>
        </div>

        {/* Right/Bottom Side: Context Panel */}
        <div className="md:w-80 bg-slate-50 dark:bg-slate-900 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 p-6 flex flex-col shrink-0 transition-colors">
           <div className="flex items-center gap-2 mb-3 text-emerald-600 dark:text-amber-600 font-title font-bold text-lg sticky top-0 bg-slate-50 dark:bg-slate-900 py-1 z-10 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
             Tarihsel Bağlam
           </div>
           <div className="flex-1 pr-2 mb-6">
             <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg md:text-xl">
               {verse.historicalContext}
             </p>
           </div>
           
           {/* Sources Footer */}
           <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Referans Kaynaklar</div>
              <ul className="text-xs text-slate-500 dark:text-slate-500 space-y-1">
                 <li className="flex items-center gap-1.5">
                   <span className="w-1 h-1 bg-emerald-500 dark:bg-amber-500 rounded-full transition-colors"></span>
                   Elmalılı Hamdi Yazır & Diyanet
                 </li>
                 <li className="flex items-center gap-1.5">
                   <span className="w-1 h-1 bg-emerald-500 dark:bg-amber-500 rounded-full transition-colors"></span>
                   Müfredat (R. el-İsfahani)
                 </li>
                 <li className="flex items-center gap-1.5">
                   <span className="w-1 h-1 bg-emerald-500 dark:bg-amber-500 rounded-full transition-colors"></span>
                   Taberi & Kurtubi Tefsirleri
                 </li>
              </ul>
           </div>
        </div>

      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between mt-4 px-2 pb-8 shrink-0">
        <button 
          onClick={onPrev}
          className={`flex items-center gap-2 px-5 py-3 md:px-6 md:py-3 rounded-xl font-bold transition-all bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-md hover:shadow-lg hover:text-emerald-600 dark:hover:text-amber-600`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          <span className="text-base hidden md:inline">Geri</span>
        </button>

        <button 
          onClick={onNext}
          className={`flex items-center gap-2 px-5 py-3 md:px-6 md:py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl ${
            isSurahFinished 
                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                : 'bg-emerald-600 dark:bg-amber-600 text-white shadow-emerald-600/30 dark:shadow-amber-600/30 hover:bg-emerald-700 dark:hover:bg-amber-700'
          }`}
        >
          <span className="text-base hidden md:inline">
             {isLastSlide && nextSegment 
                ? `Sonraki Bölüme Geç (${nextSegment})` 
                : isSurahFinished 
                    ? (nextSurahName ? `Sonraki Sure: ${nextSurahName}` : "Kuran'ı Tamamla")
                    : "İleri"
             }
          </span>
          {isSurahFinished ? (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          ) : (
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          )}
        </button>
      </div>

      {/* Modals */}
      {selectedWord && (
        <WordDetail word={selectedWord} onClose={() => setSelectedWord(null)} />
      )}
    </div>
  );
};

export default SlideView;
