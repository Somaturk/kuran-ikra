
import React, { useState, useEffect, useRef } from 'react';
import { SURAHS, ENABLE_DEVELOPER_TOOLS, SurahInfo } from './constants';
import { fetchSurahAnalysis, searchQuranWithAI } from './services/geminiService';
import { getFromDB, saveToDB, getKeysFromDB, seedDatabase } from './services/storage';
import { ensureEmbeddedDatasetLoaded } from './services/embeddedDataset';
import { INITIAL_DATA } from './data/initialData';
import { PresentationData, GlobalSearchResult } from './types';
import { SurahView } from './components/SurahView';
import LoadingSpinner from './components/LoadingSpinner';
import DataManager from './components/DataManager';
import { useReadStatus } from './hooks/useReadStatus';

interface LastReadState {
    surahId: number;
    surahName: string;
    segment?: string;
    slideIndex: number;
    timestamp: number;
}

const App: React.FC = () => {
    // Navigation & Data State
    const [view, setView] = useState<'home' | 'analysis' | 'search'>('home');
    const [activeSurah, setActiveSurah] = useState<SurahInfo | null>(null);
    const [presentationData, setPresentationData] = useState<PresentationData | null>(null);
    const [summaryData, setSummaryData] = useState<PresentationData | undefined>(undefined); // New state for summary
    const [currentSlideIndex, setCurrentSlideIndex] = useState(1); // Still useful for scrolling to verse? Or remove?
    // Let's keep it if we want to restore position.

    // Read Status Hook
    const { getReadCountForSurah, lastRead: globalLastRead } = useReadStatus();

    // Splash Screen State
    const [showSplash, setShowSplash] = useState(true);

    // Theme State
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            if (saved) return saved === 'dark';
            return false;
        }
        return false;
    });

    // Font Size State
    const [fontSizeLevel, setFontSizeLevel] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('fontSizeLevel');
            return saved ? parseInt(saved) : 0;
        }
        return 0;
    });

    // Loading State
    const [isLoading, setIsLoading] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState<string | undefined>(undefined);

    // Search State
    const [searchQuery, setSearchQuery] = useState("");
    const [aiSearchQuery, setAiSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<GlobalSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Cache & Modals State
    const [cachedKeys, setCachedKeys] = useState<Set<string>>(new Set());
    const [showDataManager, setShowDataManager] = useState(false);

    // Scroll State
    const [showScrollUp, setShowScrollUp] = useState(false);
    const [showScrollDown, setShowScrollDown] = useState(false);

    // Init Logic
    useEffect(() => {
        const init = async () => {
            try {
                // Embedded Dataset Check
                setIsLoading(true);
                setLoadingMessage("Veriler hazırlanıyor...");
                await ensureEmbeddedDatasetLoaded();
                setLoadingMessage(undefined); // Reset to default rotation or defined messages

                await seedDatabase(INITIAL_DATA);
                refreshCache();
            } catch (e) {
                console.error("Init failed", e);
            } finally {
                setIsLoading(false);
            }
        };
        init();

        const splashTimer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);
        return () => clearTimeout(splashTimer);
    }, []);

    // Theme Logic
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    // Font Size Logic
    useEffect(() => {
        const newSize = 16 + (fontSizeLevel * 1);
        document.documentElement.style.fontSize = `${newSize}px`;
        localStorage.setItem('fontSizeLevel', fontSizeLevel.toString());
    }, [fontSizeLevel]);

    // Scroll Logic
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollUp(window.scrollY > 100);
            const docHeight = document.documentElement.scrollHeight;
            const winHeight = window.innerHeight;
            const scrollPos = window.scrollY;
            const isNotAtBottom = scrollPos + winHeight < docHeight - 50;
            setShowScrollDown(docHeight > winHeight && isNotAtBottom);
        };

        window.addEventListener('scroll', handleScroll);
        handleScroll();
        return () => window.removeEventListener('scroll', handleScroll);
    }, [view, searchResults, presentationData]);


    const refreshCache = async () => {
        const keys = await getKeysFromDB();
        setCachedKeys(new Set(keys));
    };

    const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    const scrollDown = () => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });

    const getCacheKey = (surahName: string, suffix: string = 'full') => {
        return `kuran_analiz_${surahName}_${suffix}`;
    };

    const loadAnalysis = async (surah: SurahInfo, targetVerseId?: number) => {
        setIsLoading(true);
        setLoadingProgress(0);
        setActiveSurah(surah);
        setPresentationData(null);
        setSummaryData(undefined);

        // Store targetVerseId in session/local state if needed to jump?
        // Actually, SurahView handles jumping if we pass a prop or use ref.
        // For now, we'll rely on the Resume Logic in SurahView or add a way to pass it.
        // Let's store it transiently.
        if (targetVerseId) {
            localStorage.setItem('jumpToVerse', targetVerseId.toString());
        }

        try {
            // Load Full Data
            const fullKey = getCacheKey(surah.name, 'full');
            const fullData = await getFromDB(fullKey);

            // Load Summary Data (Optional)
            const summaryKey = getCacheKey(surah.name, 'summary');
            const summaryData = await getFromDB(summaryKey);

            if (fullData) {
                setPresentationData(fullData);
                if (summaryData) setSummaryData(summaryData);
                setView('analysis');
                refreshCache();
            } else {
                if (ENABLE_DEVELOPER_TOOLS) {
                    // Try to fetch? But we want to forbid external calls for now as per user rule "No AI calls" for main content
                    // User said: "Public Data Setup... No AI calls..."
                    alert("Veri bulunamadı. Lütfen sayfayı yenileyip verilerin yüklenmesini bekleyin.");
                } else {
                    alert("Veri bulunamadı.");
                }
                setActiveSurah(null);
            }

        } catch (error) {
            console.error(error);
            alert("Hata oluştu.");
            setActiveSurah(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResumeClick = () => {
        if (!globalLastRead) return;
        const surah = SURAHS.find(s => s.id === globalLastRead.surahId);
        if (surah) {
            loadAnalysis(surah, globalLastRead.verseId);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiSearchQuery.trim()) return;
        if (!ENABLE_DEVELOPER_TOOLS) { alert("Çevrimdışı modda AI araması yapılamaz."); return; }
        setIsSearching(true);
        setView('search');
        try {
            const results = await searchQuranWithAI(aiSearchQuery);
            setSearchResults(results);
        } catch (error) {
            alert("Arama hatası.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearchResultClick = (result: GlobalSearchResult) => {
        const surah = SURAHS.find(s => s.name === result.surahName || s.name.includes(result.surahName));
        if (!surah) { alert("Sure bulunamadı"); return; }
        // For now just load logic, ideally jump to verse
        loadAnalysis(surah);
    };

    const handleSurahClick = (surah: SurahInfo) => {
        loadAnalysis(surah);
    };

    const highlightText = (text: string, highlight: string) => {
        if (!highlight.trim()) return text;
        const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === highlight.toLowerCase() ?
                <span key={i} className="bg-yellow-300 dark:bg-yellow-600 text-black dark:text-white font-bold px-1 rounded mx-0.5">{part}</span> : part
        );
    };

    const normalizeText = (text: string) => {
        return text.toLowerCase()
            .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
            .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c')
            .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/'/g, '');
    };

    const localFilter = view === 'home' && searchQuery
        ? SURAHS.filter(s => {
            const query = normalizeText(searchQuery);
            return normalizeText(s.name).includes(query) ||
                normalizeText(s.meaning).includes(query) ||
                s.id.toString() === searchQuery;
        })
        : SURAHS;

    // --- RENDER ---
    if (showSplash) {
        return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f172a] transition-colors duration-500">
                <div className="relative w-32 h-32 flex items-center justify-center bg-white dark:bg-[#0f172a] rounded-full shadow-2xl animate-fade-in scale-125 mb-10 transition-colors">
                    <div className="absolute inset-0 rounded-full border-[6px] border-emerald-400 dark:border-[#785c32] transition-colors"></div>
                    <div className="absolute inset-[10px] rounded-full border-[2px] border-amber-500 dark:border-[#0f766e] transition-colors"></div>
                    <div className="flex items-center justify-center z-10 w-full h-full pb-2">
                        <span className="font-arabic text-emerald-700 dark:text-[#fea500] font-bold text-4xl leading-none mt-2 mr-2 transition-colors">اق</span>
                        <span className="font-serif text-emerald-700 dark:text-[#fea500] font-normal text-5xl leading-none tracking-tighter transition-colors">RA</span>
                    </div>
                </div>
                <h1 className="text-3xl font-bold font-title text-emerald-600 dark:text-white tracking-widest animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    KURAN
                </h1>
                <p className="text-emerald-500 dark:text-amber-500 text-sm tracking-[0.3em] uppercase mt-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    DERİN ANALİZ
                </p>
                <div className="absolute bottom-0 left-0 w-full z-50 pointer-events-none animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-300 dark:border-slate-800/50 py-1 flex flex-col items-center justify-center pointer-events-auto shadow-lg">
                        <div className="flex items-center gap-1 scale-75 origin-bottom">
                            <div className="flex items-center justify-center font-sans tracking-tighter leading-none select-none">
                                <span className="text-red-600 mr-0.5 text-lg font-black">[</span>
                                <span className="text-black dark:text-white mt-0.5 text-sm font-light italic">1</span>
                                <span className="text-red-600 ml-0.5 text-lg font-black">]</span>
                            </div>
                            <span className="text-black dark:text-slate-200 font-black text-[13px] tracking-[0.25em] font-sans border-l border-black dark:border-slate-600 pl-2 h-4 flex items-center">
                                ONE YAZILIM
                            </span>
                        </div>
                        <p className="text-[8px] text-slate-700 dark:text-slate-400 font-medium tracking-widest -mt-0.5 pb-0.5">
                            Turgay IŞIK tarafından hazırlanmıştır
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (isLoading) { return <LoadingSpinner progress={loadingProgress} message={loadingMessage} />; }
    if (view === 'analysis' && presentationData && activeSurah) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
                <SurahView
                    surah={activeSurah}
                    fullData={presentationData}
                    summaryData={summaryData}
                    onBack={() => setView('home')}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-sans selection:bg-emerald-500/30 dark:selection:bg-amber-500/30 transition-colors duration-300 pb-24">
            {/* HEADER */}
            <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
                <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setView('home'); setSearchQuery(""); }}>
                        <div className="relative w-14 h-14 flex items-center justify-center bg-white dark:bg-[#0f172a] rounded-full shadow-lg group shrink-0 mr-3 transition-colors border-[3px] border-emerald-400 dark:border-[#785c32]">
                            <div className="absolute inset-[5px] rounded-full border border-amber-500 dark:border-[#0f766e] transition-colors"></div>
                            <div className="flex items-center justify-center z-10 w-full h-full pb-1">
                                <span className="font-arabic text-emerald-700 dark:text-[#fea500] font-bold text-xl leading-none mt-1 mr-1 transition-colors">اق</span>
                                <span className="font-serif text-emerald-700 dark:text-[#fea500] font-normal text-2xl leading-none tracking-tighter transition-colors">RA</span>
                            </div>
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-emerald-600 dark:text-white tracking-wide font-title">KURAN <span className="text-emerald-500 dark:text-amber-500">DERİN ANALİZ</span></h1>
                        </div>
                    </div>
                    <div className="w-full md:w-auto flex-1 max-w-lg space-y-2">
                        <input type="text" placeholder="Sure Ara..." value={searchQuery} onChange={(e) => { setView('home'); setSearchQuery(e.target.value); }} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg py-2 pl-10 pr-4 text-xs focus:outline-none focus:border-emerald-500 dark:focus:border-amber-500 transition-all placeholder:text-slate-500 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-200" />
                        <svg className="absolute left-3 top-2 text-slate-400 dark:text-slate-500" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 overflow-hidden">
                            <button onClick={() => setFontSizeLevel(prev => Math.max(prev - 2, -2))} className="p-2.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 font-bold text-xs border-r border-slate-300 dark:border-slate-700">A-</button>
                            <button onClick={() => setFontSizeLevel(prev => Math.min(prev + 1, 4))} className="p-2.5 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm">A+</button>
                        </div>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2.5 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 text-emerald-600 dark:text-amber-500">{isDarkMode ? '☀' : '🌙'}</button>
                        {ENABLE_DEVELOPER_TOOLS && <button onClick={() => setShowDataManager(true)} className="px-3 py-2 bg-slate-200 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold">Veri Yönetimi</button>}
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* RESUME CARD */}
                {globalLastRead && view === 'home' && (
                    <div onClick={handleResumeClick} className="bg-gradient-to-r from-emerald-100 to-white dark:from-amber-900/30 dark:to-slate-900 border border-emerald-200 dark:border-amber-700/50 rounded-2xl p-4 mb-6 cursor-pointer shadow-sm hover:shadow-md transition-all flex justify-between items-center group animate-fade-in">
                        <div className="flex items-center gap-4">
                            <div className="bg-emerald-500 dark:bg-amber-600 text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg></div>
                            <div>
                                <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-amber-500 tracking-wider mb-0.5">Son Okunan</p>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-none">
                                    {SURAHS.find(s => s.id === globalLastRead.surahId)?.name} {globalLastRead.verseId}. Ayet
                                </h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-amber-500 group-hover:translate-x-1 transition-transform">Devam Et &gt;</div>
                    </div>
                )}

                {/* SEARCH RESULTS VIEW */}
                {view === 'search' && ENABLE_DEVELOPER_TOOLS && (
                    <div className="animate-fade-in">
                        {/* ... search view ... */}
                    </div>
                )}

                {/* HOME VIEW (SURAH LIST) */}
                {view === 'home' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                        {localFilter.map((surah) => {
                            const readCount = getReadCountForSurah(surah.id);
                            const percentRead = Math.round((readCount / surah.verseCount) * 100);
                            const isFullyRead = readCount >= surah.verseCount;
                            const isStarted = readCount > 0;

                            return (
                                <div
                                    key={surah.id}
                                    onClick={() => handleSurahClick(surah)}
                                    className={`bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border ${isStarted ? 'border-amber-400/50 dark:border-amber-500/50 ring-1 ring-amber-400/30 dark:ring-amber-500/30' : 'border-slate-200 dark:border-slate-800'} hover:border-emerald-500/30 dark:hover:border-slate-700 rounded-2xl p-5 cursor-pointer transition-all group relative overflow-hidden shadow-sm hover:shadow-md ${isStarted ? 'shadow-amber-100 dark:shadow-amber-900/10' : ''}`}
                                >
                                    <div className="absolute top-0 right-0 p-4 opacity-30 dark:opacity-10 group-hover:opacity-40 dark:group-hover:opacity-20 transition-opacity">
                                        <span className="text-6xl font-black text-slate-200/50 dark:text-slate-800">{surah.id}</span>
                                    </div>

                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-inner ${isStarted ? 'bg-emerald-100 dark:bg-amber-900 text-emerald-700 dark:text-amber-400' : 'bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-emerald-600 dark:text-amber-500'}`}>
                                                {surah.id}
                                            </div>
                                            <div>
                                                <h3 className="text-slate-900 dark:text-white font-bold text-lg leading-none group-hover:text-emerald-600 dark:group-hover:text-amber-400 transition-colors">{surah.name}</h3>
                                                <span className="text-xs text-slate-500">{surah.meaning}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                            {/* READ STATUS BADGES */}
                                            {isStarted && (
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full border shadow-sm ${isFullyRead ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700/50 text-green-700 dark:text-green-400' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800/30 text-amber-600 dark:text-amber-500'}`} title={isFullyRead ? "Tamamlandı" : `${readCount}/${surah.verseCount} Okundu`}>
                                                    {isFullyRead ? (
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                                    ) : (
                                                        <span className="text-[9px] font-black">{percentRead}%</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-slate-600 dark:text-slate-400 text-xs line-clamp-2 mb-3 relative z-10 h-8">{surah.description}</p>
                                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold tracking-wider relative z-10 border-t border-slate-100 dark:border-slate-800/50 pt-3 mt-1">
                                        <span>{surah.verseCount} AYET</span>
                                        <span className="group-hover:translate-x-1 transition-transform text-emerald-600 dark:text-amber-600 flex items-center gap-1">
                                            {isStarted ? 'DEVAM ET' : 'BAŞLA'} &gt;
                                        </span>
                                    </div>
                                    {/* PROGRESS BAR */}
                                    {isStarted && !isFullyRead && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-amber-500/50" style={{ width: `${percentRead}%` }}></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* MODALS & FOOTER */}
                {/* Segment Modal Removed */}
                {showDataManager && <DataManager onClose={() => setShowDataManager(false)} onDataImported={refreshCache} />}


                <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
                    <div className="w-full bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-300 dark:border-slate-800/50 py-1 flex flex-col items-center justify-center pointer-events-auto shadow-lg">
                        <div className="flex items-center gap-1 opacity-100 scale-75 origin-bottom">
                            <div className="flex items-center justify-center font-sans tracking-tighter leading-none select-none">
                                <span className="text-red-600 mr-0.5 text-lg font-black">[</span>
                                <span className="text-black dark:text-white mt-0.5 text-sm font-light italic">1</span>
                                <span className="text-red-600 ml-0.5 text-lg font-black">]</span>
                            </div>
                            <span className="text-black dark:text-slate-200 font-black text-[13px] tracking-[0.25em] font-sans border-l border-black dark:border-slate-600 pl-2 h-4 flex items-center">ONE YAZILIM</span>
                        </div>
                        <p className="text-[8px] text-slate-700 dark:text-slate-400 font-medium tracking-widest -mt-0.5 pb-0.5">Turgay IŞIK tarafından hazırlanmıştır</p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
