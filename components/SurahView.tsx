
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { VerseAnalysis, PresentationData, WordAnalysis } from '../types';
import { SurahInfo, getJuzForVerse, getJuzRangeForSurah } from '../constants';
import { VerseDetailView } from './VerseDetailView';
import { useReadStatus } from '../hooks/useReadStatus';

// --- LAZY VERSE COMPONENT ---
// Renders placeholder until visible
const LazyVerse = ({ verse, onClick, isActive, isRead, surahId }: { verse: VerseAnalysis, onClick: () => void, isActive: boolean, isRead: boolean, surahId: number }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setIsVisible(true);
                observer.disconnect();
            }
        }, { rootMargin: '300px' }); // Load when 300px close

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    // Also force visible if "active" (e.g. jumped to)
    useEffect(() => {
        if (isActive && !isVisible) setIsVisible(true);
    }, [isActive]);

    return (
        <div ref={ref} id={`verse-${verse.verseNumber}`} className="min-h-[180px]">
            {isVisible ? (
                <VerseItem verse={verse} onClick={onClick} isRead={isRead} surahId={surahId} />
            ) : (
                <div className="py-8 px-4 border-b border-slate-100 dark:border-slate-800 animate-pulse bg-slate-50/50 dark:bg-slate-900/20">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800"></div>
                        <div className="flex-1 space-y-4">
                            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
                            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-2/3 ml-auto"></div>
                            <div className="h-16 bg-slate-200 dark:bg-slate-800 rounded w-full mt-4"></div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SurahViewProps {
    surah: SurahInfo;
    fullData: PresentationData;
    summaryData?: PresentationData;
    onBack: () => void;
    initialTab?: 'verses' | 'summary' | 'juz';
}

export const SurahView: React.FC<SurahViewProps> = ({
    surah,
    fullData,
    summaryData,
    onBack,
    initialTab = 'verses'
}) => {
    const [activeTab, setActiveTab] = useState<'verses' | 'summary' | 'juz'>(initialTab);

    // Read Status Hook
    const { isRead } = useReadStatus();

    const [selectedJuz, setSelectedJuz] = useState<number | null>(null);
    const [selectedVerseIndex, setSelectedVerseIndex] = useState<number | null>(null);

    // Control Bar State
    const [jumpInput, setJumpInput] = useState("");
    const [localSearch, setLocalSearch] = useState("");

    // Scroll Restoration
    const verseRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const contentRef = useRef<HTMLDivElement>(null);

    // Helpers for Navigation
    const handleVerseClick = (index: number) => {
        setSelectedVerseIndex(index);
        // Save to local storage
        localStorage.setItem(`lastVerse_${surah.id}`, index.toString());
    };

    const handleNextVerse = () => {
        if (selectedVerseIndex !== null && selectedVerseIndex < displayedVerses.length - 1) {
            handleVerseClick(selectedVerseIndex + 1);
        }
    };

    const handlePrevVerse = () => {
        if (selectedVerseIndex !== null && selectedVerseIndex > 0) {
            handleVerseClick(selectedVerseIndex - 1);
        }
    };

    const handleJumpToVerse = (e: React.FormEvent) => {
        e.preventDefault();
        const vNum = parseInt(jumpInput);
        if (!isNaN(vNum)) {
            // Find index in displayedVerses
            const idx = displayedVerses.findIndex(v => v.verseNumber === vNum);
            if (idx !== -1) {
                // Open detail view for it
                handleVerseClick(idx);
                setJumpInput("");

                // Also try to scroll list if we close detail
                setTimeout(() => {
                    const el = document.getElementById(`verse-${vNum}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            } else {
                alert("Ayet bulunamadı.");
            }
        }
    };



    // Derive unique juzs in this surah
    const surahJuzs = useMemo(() => {
        const juzs = new Set<number>();
        fullData.verses.forEach(v => {
            if (v.juz) juzs.add(v.juz);
        });
        return Array.from(juzs).sort((a, b) => a - b);
    }, [fullData]);

    // Filter verses
    const displayedVerses = useMemo(() => {
        if (activeTab === 'summary' && summaryData) {
            return summaryData.verses;
        }
        if (selectedJuz && activeTab === 'juz') {
            return fullData.verses.filter(v => v.juz === selectedJuz);
        }
        // 'verses' tab or 'juz' tab with no specific selection (show all or assume logic)
        // If 'juz' tab is active but no juz selected, maybe show list of Juzs?
        return fullData.verses;
    }, [activeTab, selectedJuz, fullData, summaryData]);

    // Restore Position Effect
    useEffect(() => {
        // Check for specific jump target first
        const jumpTarget = localStorage.getItem('jumpToVerse');
        if (jumpTarget) {
            const idx = displayedVerses.findIndex(v => v.verseNumber === parseInt(jumpTarget));
            if (idx !== -1) {
                // Wait for render
                setTimeout(() => {
                    handleVerseClick(idx);
                    const el = document.getElementById(`verse-${jumpTarget}`);
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 500);
            }
            // Clear it so we don't jump again on refresh
            localStorage.removeItem('jumpToVerse');
            return;
        }

        const saved = localStorage.getItem(`lastVerse_${surah.id}`);
        if (saved && activeTab === 'verses') {
            const idx = parseInt(saved);
            if (!isNaN(idx)) {
                // Optional: Auto Open Detail? Or Just Scroll? 
                // User said "otomatik odakla/işaretle". Detail view popover is invasive on load.
                // Let's scroll to it.
                // Need to wait for rendering. 
                setTimeout(() => {
                    const verseNum = displayedVerses[idx]?.verseNumber;
                    if (verseNum) {
                        const el = document.getElementById(`verse-${verseNum}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                }, 1000); // 1s delay for content to settle
            }
        }
    }, [surah.id, activeTab, displayedVerses]);

    // Handle Tab Change
    const handleTabChange = (tab: 'verses' | 'summary' | 'juz') => {
        setActiveTab(tab);
        if (tab === 'juz' && surahJuzs.length > 0 && !selectedJuz) {
            // Auto select first juz? Or show list.
            // Let's keep it null to show list.
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
            {/* Detail View Overlay */}
            {selectedVerseIndex !== null && displayedVerses[selectedVerseIndex] && (
                <VerseDetailView
                    verse={displayedVerses[selectedVerseIndex]}
                    surahName={surah.name}
                    onClose={() => setSelectedVerseIndex(null)}
                    onNext={handleNextVerse}
                    onPrev={handlePrevVerse}
                    hasNext={selectedVerseIndex < displayedVerses.length - 1}
                    hasPrev={selectedVerseIndex > 0}
                />
            )}
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 shadow-sm sticky top-0 z-20">
                <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
                </button>

                <div className="text-center">
                    <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 font-title">{surah.name} Suresi</h1>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono tracking-tight">Sure: {surah.name} • Ayet: {surah.verseCount} • Cüz: {getJuzRangeForSurah(surah)}</p>
                </div>

                <div className="w-10"></div> {/* Spacer for alignment */}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-[73px] z-10">
                <TabButton active={activeTab === 'summary'} onClick={() => handleTabChange('summary')} label="Özet" />
                <TabButton active={activeTab === 'verses'} onClick={() => handleTabChange('verses')} label="Ayetler" />
                <TabButton active={activeTab === 'juz'} onClick={() => handleTabChange('juz')} label="Cüzler" />
            </div>

            {/* CONTROL BAR (Sticky below tabs) */}
            {activeTab === 'verses' && (
                <div className="sticky top-[125px] z-10 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-2 overflow-x-auto shadow-sm">
                    <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
                        {/* Jump */}
                        <form onSubmit={handleJumpToVerse} className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <input
                                type="number"
                                placeholder="Git..."
                                value={jumpInput}
                                onChange={e => setJumpInput(e.target.value)}
                                className="w-12 h-7 bg-transparent text-center text-sm font-bold focus:outline-none dark:text-white"
                            />
                            <button type="submit" className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </button>
                        </form>

                        {/* Search */}
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Ayetlerde ara..."
                                value={localSearch}
                                onChange={e => setLocalSearch(e.target.value)}
                                className="w-full h-9 pl-8 pr-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white focus:ring-1 focus:ring-emerald-500"
                            />
                            <svg className="absolute left-2.5 top-2.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>

                        {/* Quick Filter Info (Optional badge) */}
                        <div className="hidden sm:block text-xs font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                            {displayedVerses.length} SONUÇ
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-900">

                {/* Juz Selection List (Only active if 'juz' tab and no specific juz selected for view - actually let's just make 'juz' tab show filter chips) */}
                {activeTab === 'juz' && (
                    <div className="p-4 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Görüntülemek istediğiniz cüzü seçin:</p>
                        <div className="flex flex-wrap gap-2">
                            {surahJuzs.map(j => (
                                <button
                                    key={j}
                                    onClick={() => setSelectedJuz(j === selectedJuz ? null : j)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedJuz === j
                                        ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500'
                                        }`}
                                >
                                    {j}. Cüz
                                </button>
                            ))}
                            <button
                                onClick={() => setSelectedJuz(null)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${selectedJuz === null
                                    ? 'bg-slate-800 dark:bg-slate-700 text-white'
                                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                                    }`}
                            >
                                Tümü
                            </button>
                        </div>
                    </div>
                )}

                <div className="divide-y divide-slate-200 dark:divide-slate-800 px-4 md:px-0 max-w-3xl mx-auto bg-white dark:bg-slate-950 shadow-xl min-h-screen">
                    {activeTab === 'summary' && (
                        <div className="p-8 space-y-6">
                            {(summaryData || surah.description) ? (
                                <>
                                    {/* Summary Header Info Clone */}
                                    <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
                                        <h2 className="text-2xl font-bold font-title text-emerald-700 dark:text-emerald-500 mb-2">{surah.name}</h2>
                                        <p className="text-sm font-mono text-slate-500">Sure: {surah.name} • Ayet: {surah.verseCount} • Cüz: {getJuzRangeForSurah(surah)}</p>
                                    </div>

                                    {/* Description */}
                                    <div className="prose dark:prose-invert max-w-none">
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Genel Bakış</h3>
                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                                            {surah.description}
                                        </p>

                                        {/* Additional Summary Data if available */}
                                        {summaryData && summaryData.verses && summaryData.verses.length > 0 && (
                                            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                                <h4 className="font-bold text-emerald-600 dark:text-emerald-500 mb-2">Özet Ayetler</h4>
                                                <p className="text-sm text-slate-500 mb-2">Bu sure için seçilmiş özet ayetler veya temalar:</p>
                                                {/* If summaryData is just verses, we might render them slightly differently or just list them here if formatted as text? 
                                                    Actually summaryData is PresentationData (verses). 
                                                    If "Özet" tab is active, the main list logic below renders summaryData.verses!
                                                    So here we just show the static description. 
                                                    The list below handles the verses.
                                                */}
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="p-10 text-center text-slate-500">Bu sure için özet bilgisi bulunamadı.</div>
                            )}
                        </div>
                    )}

                    {/* Only show VerseItem list if NOT summary tab OR if it IS summary tab and we want to show the summary verses list below the description */}
                    {(activeTab === 'verses' || activeTab === 'juz' || (activeTab === 'summary' && summaryData)) && displayedVerses
                        .filter(v => !localSearch || v.turkishTranslation.toLowerCase().includes(localSearch.toLowerCase()) || v.verseNumber.toString() === localSearch)
                        .map((verse, idx) => (
                            <LazyVerse
                                key={verse.verseNumber}
                                verse={verse}
                                isActive={selectedVerseIndex === idx}
                                onClick={() => handleVerseClick(idx)}
                                isRead={isRead(surah.id, verse.verseNumber)}
                                surahId={surah.id}
                            />
                        ))}

                    {displayedVerses.length === 0 && (
                        <div className="p-10 text-center text-slate-500">Veri bulunamadı.</div>
                    )}

                    {/* Padding bottom for mobile */}
                    <div className="h-24"></div>
                </div>
            </div>
        </div>
    );
};

const TabButton = ({ active, onClick, label, disabled }: { active: boolean, onClick: () => void, label: string, disabled?: boolean }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex-1 py-3 text-sm font-medium transition-all relative ${active
            ? 'text-emerald-700 dark:text-emerald-400 font-bold'
            : disabled ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
    >
        {label}
        {active && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 dark:bg-emerald-500 rounded-t-full"></div>
        )}
    </button>
)

const VerseItem = ({ verse, onClick, isRead, surahId }: { verse: VerseAnalysis, onClick: () => void, isRead: boolean, surahId: number }) => {
    return (
        <div onClick={onClick} className="py-8 px-4 md:px-8 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer relative">
            <div className="flex items-start gap-4 mb-4">
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-mono font-bold border shadow-sm shrink-0 mt-1 transition-colors ${isRead
                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-500 border-emerald-200 dark:border-emerald-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}>
                    {isRead ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    ) : verse.verseNumber}
                </span>

                <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-widest pt-2">
                    {verse.juz && (
                        <span className="px-2 py-0.5 rounded text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold">
                            Cüz {verse.juz}
                        </span>
                    )}
                    {isRead && (
                        <span className="px-2 py-0.5 rounded text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 font-bold flex items-center gap-1">
                            OKUNDU
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <p className="text-right font-kuran text-3xl md:text-4xl leading-[2.0] md:leading-[2.2] text-slate-800 dark:text-slate-200" dir="rtl">
                    {verse.arabicText}
                </p>

                <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base italic leading-relaxed">
                    {verse.turkishPronunciation}
                </p>

                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 md:p-6 rounded-2xl border-l-4 border-emerald-500 dark:border-emerald-600">
                    <p className="text-slate-800 dark:text-slate-100 text-base md:text-lg leading-relaxed font-medium">
                        {verse.turkishTranslation}
                    </p>
                </div>
            </div>

            <button className="mt-4 text-xs font-bold text-emerald-600 dark:text-emerald-500 hover:underline">
                Detaylı İncele &gt;
            </button>
        </div>
    )
}
