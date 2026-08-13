
import React, { useState, useEffect } from 'react';


import { WordDetailModal } from './WordDetailModal';
import { BottomSheet } from './BottomSheet';
import { VerseAnalysis, WordAnalysis } from '../types';
import { useReadStatus } from '../hooks/useReadStatus';

interface VerseDetailViewProps {
    verse: VerseAnalysis;
    surahName: string;
    surahId: number;
    onClose: () => void;
    onNext?: () => void;
    onPrev?: () => void;
    hasPrev: boolean;
    hasNext: boolean;
}

// AccordionItem removed in favor of BottomSheet


export const VerseDetailView: React.FC<VerseDetailViewProps> = ({
    verse,
    surahName,
    surahId,
    onClose,
    onNext,
    onPrev,
    hasPrev,
    hasNext
}) => {
    const [selectedWord, setSelectedWord] = useState<WordAnalysis | null>(null);
    const [activeTab, setActiveTab] = useState<'context' | 'references'>('context');

    // Read Status
    const { markAsRead } = useReadStatus();

    // Mark as read on mount or when verse changes
    useEffect(() => {
        markAsRead(surahId, verse.verseNumber);
    }, [surahId, verse.verseNumber, markAsRead]);

    // Mobile Sheet States
    const [activeSheet, setActiveSheet] = useState<'context' | 'references' | null>(null);

    const handleWordClick = (word: WordAnalysis) => {
        setSelectedWord(word);
    };

    return (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 flex flex-col animate-fade-in">
            {/* Modal for Word Details */}
            {selectedWord && (
                <WordDetailModal word={selectedWord} onClose={() => setSelectedWord(null)} />
            )}

            {/* Top Bar */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
                <button onClick={onClose} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-amber-500 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                    <span className="font-bold hidden md:inline">Listeye Dön</span>
                </button>
                <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white font-title">{surahName} {verse.verseNumber}. Ayet</h2>
                </div>
                <div className="w-20"></div> {/* Spacer */}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-900">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row h-full">

                    {/* LEFT PANEL: Verse & Analysis */}
                    <div className="flex-1 p-4 md:p-8 overflow-y-auto">
                        <div className="max-w-3xl mx-auto space-y-10">

                            {/* Verse Body */}
                            <div className="space-y-6 text-center">
                                <p className="font-kuran text-5xl md:text-6xl leading-[2.5] md:leading-[2.5] text-slate-800 dark:text-slate-100 dir-rtl py-4" dir="rtl">
                                    {verse.arabicText}
                                </p>
                                <p className="text-slate-600 dark:text-slate-400 italic text-lg opacity-90 leading-relaxed max-w-2xl mx-auto">
                                    {verse.turkishPronunciation}
                                </p>
                                <div className="bg-amber-50 dark:bg-amber-900/10 p-6 md:p-8 rounded-2xl shadow-sm border-l-4 border-emerald-500 dark:border-amber-500 text-left">
                                    <p className="text-slate-900 dark:text-slate-100 text-xl md:text-2xl leading-relaxed font-medium font-serif">
                                        {verse.turkishTranslation}
                                    </p>
                                </div>
                            </div>

                            {/* Word Analysis - Buttons */}
                            {verse.wordAnalysis && verse.wordAnalysis.length > 0 && (
                                <div className="pt-8 border-t border-slate-200 dark:border-slate-800/50">
                                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 text-center">Ayetin Kelimeleri</h3>
                                    <div className="flex flex-wrap justify-center gap-3 md:gap-4" dir="rtl">
                                        {verse.wordAnalysis.map((w, i) => (
                                            <button
                                                key={i}
                                                onClick={() => handleWordClick(w)}
                                                className="group flex flex-col items-center bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-amber-900/20 active:scale-95 transition-all p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-amber-700 shadow-sm min-w-[70px] md:min-w-[80px]"
                                            >
                                                <span className="text-2xl font-kuran text-slate-800 dark:text-slate-100 mb-1 group-hover:text-emerald-700 dark:group-hover:text-amber-400 transition-colors">{w.arabic}</span>
                                                <span className="text-[11px] font-bold text-emerald-700 dark:text-amber-500 bg-emerald-100 dark:bg-amber-900/40 px-2 py-0.5 rounded-full">{w.meaning}</span>
                                                {w.turkish && <span className="text-[9px] text-slate-400 mt-1 opacity-70">{w.turkish}</span>}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-center text-slate-400 mt-4">Kelimelerin üzerine tıklayarak etimolojik detayları görebilirsiniz.</p>
                                    <p className="text-[10px] text-center text-slate-400/70 mt-1 font-mono uppercase tracking-wide">Arapça köken – klasik kullanım</p>
                                </div>
                            )}

                            {/* MOBILE ACTION BUTTONS (Below Word Analysis) */}
                            <div className="lg:hidden mt-8 grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => setActiveSheet('context')}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex flex-col gap-2"
                                >
                                    <div className="p-2 w-fit rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Tarihsel Bağlam</span>
                                    <span className="text-xs text-slate-500">İniş sebebi ve detaylar</span>
                                </button>

                                <button
                                    onClick={() => setActiveSheet('references')}
                                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex flex-col gap-2"
                                >
                                    <div className="p-2 w-fit rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-500">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>
                                    </div>
                                    <span className="font-bold text-slate-700 dark:text-slate-200">Referanslar</span>
                                    <span className="text-xs text-slate-500">Kaynak ve tefsirler</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT PANEL (Desktop) / BOTTOM ACCORDION (Mobile) */}
                    <div className="lg:w-[400px] xl:w-[450px] bg-white dark:bg-slate-950 lg:border-l border-slate-200 dark:border-slate-800 p-0 lg:overflow-y-auto shadow-xl lg:shadow-none z-20 
                        w-full border-t lg:border-t-0"
                    >

                        {/* DESKTOP TABS */}
                        <div className="hidden lg:flex items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-900 sticky top-0 bg-white dark:bg-slate-950 z-10">
                            <button onClick={() => setActiveTab('context')} className={`text-sm font-bold flex-1 py-2 rounded-lg transition-colors ${activeTab === 'context' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Tarihsel Bağlam</button>
                            <button onClick={() => setActiveTab('references')} className={`text-sm font-bold flex-1 py-2 rounded-lg transition-colors ${activeTab === 'references' ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white' : 'text-slate-500'}`}>Referanslar</button>
                        </div>



                        {/* DESKTOP CONTENT (Classic Panel) */}
                        <div className="hidden lg:block p-6 space-y-6">
                            {/* Context Content */}
                            <div className={`${activeTab === 'context' ? 'block' : 'hidden'}`}>
                                <div className="prose prose-slate dark:prose-invert prose-sm max-w-none">
                                    {verse.historicalContext ? (
                                        <p className="leading-relaxed text-slate-700 dark:text-slate-300">
                                            {verse.historicalContext}
                                        </p>
                                    ) : (
                                        <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-500 italic">
                                            Bu ayet için özel tarihsel bağlam verisi bulunamadı.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* References Content */}
                            <div className={`${activeTab === 'references' ? 'block' : 'hidden'}`}>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                                        <p className="font-bold text-emerald-800 dark:text-emerald-400 text-sm mb-1">Elmalılı Hamdi Yazır</p>
                                        <p className="text-xs text-emerald-600 dark:text-emerald-500">Hak Dini Kur’an Dili</p>
                                    </div>

                                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <p className="font-bold text-slate-800 dark:text-slate-300 text-sm mb-1">Diyanet İşleri Başkanlığı</p>
                                        <p className="text-xs text-slate-500">Kur'an Yolu Tefsiri</p>
                                    </div>

                                    <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                                        <p className="font-bold text-slate-800 dark:text-slate-300 text-sm mb-1">İbn Kesir</p>
                                        <p className="text-xs text-slate-500">Tefsirü'l-Kur'ani'l-Azim</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Navigation Bar */}
            <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 p-4 safe-area-pb z-30">
                <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
                    <button
                        onClick={onPrev}
                        disabled={!hasPrev}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold w-full min-h-[60px] justify-center transition-all border border-transparent ${!hasPrev
                                ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-300 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'
                            }`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m15 18-6-6 6-6" /></svg>
                        <span className="text-center text-sm md:text-base">Önceki</span>
                    </button>

                    <button
                        onClick={onNext}
                        disabled={!hasNext}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold w-full min-h-[60px] justify-center transition-all border ${!hasNext
                                ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-300 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                                : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                            }`}
                    >
                        <span className="text-center text-sm md:text-base">Sonraki Ayet</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m9 18 6-6-6-6" /></svg>
                    </button>
                </div>
            </div>
            {/* Bottom Sheets for Mobile */}
            <BottomSheet
                isOpen={activeSheet === 'context'}
                onClose={() => setActiveSheet(null)}
                title="Tarihsel Bağlam"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>}
            >
                <div className="prose prose-slate dark:prose-invert max-w-none">
                    {verse.historicalContext ? (
                        <p className="leading-relaxed text-slate-700 dark:text-slate-300 text-lg">
                            {verse.historicalContext}
                        </p>
                    ) : (
                        <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-2xl text-slate-500 italic">
                            Bu ayet için özel tarihsel bağlam verisi bulunamadı.
                        </div>
                    )}
                </div>
            </BottomSheet>

            <BottomSheet
                isOpen={activeSheet === 'references'}
                onClose={() => setActiveSheet(null)}
                title="Referans Kaynaklar"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"></path><path d="M7 7h.01"></path></svg>}
            >
                <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 mt-2 shrink-0"></div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">Elmalılı Hamdi Yazır</p>
                            <p className="text-sm text-slate-500">Hak Dini Kur’an Dili (Orijinal/Sadeleştirilmiş)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0"></div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">Diyanet İşleri Başkanlığı</p>
                            <p className="text-sm text-slate-500">Kur'an Yolu Tefsiri ve Meali</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        <div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-700 mt-2 shrink-0"></div>
                        <div>
                            <p className="font-bold text-slate-800 dark:text-slate-200 text-lg">İbn Kesir</p>
                            <p className="text-sm text-slate-500">Tefsirü'l-Kur'ani'l-Azim</p>
                        </div>
                    </div>
                </div>
            </BottomSheet>

        </div>
    );
};
