
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchSurahAnalysis } from '../services/geminiService';
import { SURAHS, ENABLE_DEVELOPER_TOOLS } from '../constants';
import { saveToDB, getFromDB, getDBStats, initDB } from '../services/storage';
import { DATASET_VERSION } from '../services/embeddedDataset';

interface DataManagerProps {
  onClose: () => void;
  onDataImported: () => void;
}

const PACKAGES = [
  {
    id: 'namaz',
    name: 'Kısa Namaz Sureleri',
    description: 'Fatiha, Fil-Nas arası sureler (Namazda okunanlar). Tam analiz.',
    items: ['Fâtiha', 'Fîl', 'Kureyş', 'Mâûn', 'Kevser', 'Kâfirûn', 'Nasr', 'Tebbet', 'İhlâs', 'Felâk', 'Nâs']
  },
  {
    id: 'muhim',
    name: 'Mühim Sureler',
    description: 'Yasin, Mülk, Nebe, Fetih, Rahman, Cuma, Kıyâme. (Özet Analiz)',
    items: ['Yâsîn', 'Mülk', 'Nebe\'', 'Fetih', 'Rahmân', 'Cuma', 'Kıyâme']
  },
  {
    id: 'amme',
    name: 'Amme Cüzü (Son Cüz)',
    description: 'Nebe suresinden Nas suresine kadar. (Kısa sureler tam, uzunlar özet)',
    items: SURAHS.filter(s => s.id >= 78).map(s => s.name)
  },
  {
    id: 'full_quran_summary',
    name: 'TÜM KURAN (Sadece Özetler)',
    description: 'Tüm sureleri indirir. Uzun surelerin sadece "Özet" bölümünü alır. Hızlı ve ekonomik.',
    items: SURAHS.map(s => s.name)
  },
  // Removed detailed segmented download as we now use full surah data logic

];

interface DownloadTask {
  surahName: string;
  segment?: string;
}

const DataManager: React.FC<DataManagerProps> = ({ onClose, onDataImported }) => {
  const [activeTab, setActiveTab] = useState<'download' | 'backup'>('download');
  const [stats, setStats] = useState({ surahCount: 0, totalSize: '0 MB' });
  const [isExporting, setIsExporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  // Download State
  const [downloadStatus, setDownloadStatus] = useState<{ current: number; total: number; currentItem: string; percent: number } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const stopDownloadRef = useRef(false);

  // Selector Mode State
  const [isSelectorMode, setIsSelectorMode] = useState(false);
  const [selectedSurahIds, setSelectedSurahIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    refreshStats();
  }, []);

  const refreshStats = async () => {
    try {
      const dbStats = await getDBStats();
      setStats({
        surahCount: dbStats.count,
        totalSize: (dbStats.size / (1024 * 1024)).toFixed(2) + ' MB'
      });
    } catch (e) {
      console.error("Stats error", e);
    }
  };

  const getCacheKey = (surahName: string, segment?: string) => {
    return `kuran_analiz_${surahName.replace(/\s/g, '').toLowerCase()}_${segment || 'full'}`;
  };

  // Helper to calculate task count for a surah
  const getTaskCountForSurah = (surahId: number) => {
    const s = SURAHS.find(x => x.id === surahId);
    if (!s) return 0;
    if (s.verseCount <= 7) return 1;
    // 1 Summary + Segments
    return 1 + getSegments(s.verseCount).filter(seg => seg.value !== 'özet').length;
  };

  // Selector Stats
  const selectionStats = useMemo(() => {
    let totalTasks = 0;
    selectedSurahIds.forEach(id => {
      totalTasks += getTaskCountForSurah(id);
    });
    // 10 seconds per task (includes delay)
    const estimatedSeconds = totalTasks * 12;
    const hours = Math.floor(estimatedSeconds / 3600);
    const minutes = Math.floor((estimatedSeconds % 3600) / 60);

    return { totalTasks, timeString: `${hours > 0 ? `${hours} sa ` : ''}${minutes} dk` };
  }, [selectedSurahIds]);


  const toggleSurahSelection = (id: number) => {
    const newSet = new Set(selectedSurahIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSurahIds(newSet);
  };

  const selectAll = () => {
    if (selectedSurahIds.size === SURAHS.length) {
      setSelectedSurahIds(new Set());
    } else {
      setSelectedSurahIds(new Set(SURAHS.map(s => s.id)));
    }
  };

  const handlePackageClick = (pkgId: string, pkgItems: string[]) => {
    if (pkgId === 'full_quran_detailed') {
      setIsSelectorMode(true);
      // Default select first few to show example, or all? Let's select none initially to let user choose
      setSelectedSurahIds(new Set());
    } else {
      handleBatchDownload(pkgItems);
    }
  };

  const startDetailedDownload = () => {
    if (selectedSurahIds.size === 0) return;

    const itemsToDownload: string[] = [];
    // We pass a special marker object or just handle it inside handleBatchDownload
    // Let's construct a special queue inside handleBatchDownload, 
    // but here we just pass a flag or list of names.
    // Actually, let's reuse handleBatchDownload but pass a special "selector_mode" flag

    // Construct the queue right here to pass to processor
    let queue: DownloadTask[] = [];

    // Sort IDs to download in order
    const sortedIds = Array.from(selectedSurahIds).sort((a: number, b: number) => a - b);

    sortedIds.forEach(id => {
      const s = SURAHS.find(x => x.id === id);
      if (s) {
        queue.push({ surahName: s.name, segment: 'full' });
      }
    });

    processQueue(queue);
    setIsSelectorMode(false);
  };

  const handleBatchDownload = async (pkgItems: string[]) => {
    let queue: DownloadTask[] = [];

    // Standard packages logic
    pkgItems.forEach(name => {
      const surahInfo = SURAHS.find(s => s.name === name);
      if (surahInfo) {
        // Default logic: Summary or Full? For packages let's assume Summary if specified or default behaviour
        // But for "Full Quran Summary" package, we strictly want summary.
        // Actually the packages define names.

        // If package is full_quran_summary (which maps to items as names), we might need to know intent.
        // But here items are just names.
        // Let's rely on packet ID logic if needed, but for now simple 'summary' check

        // Wait, the "summary" segments logic in App.tsx used 'özet'.
        // If we really want just summary:
        if (surahInfo.verseCount > 7) {
          queue.push({ surahName: name, segment: "summary" }); // standardized to 'summary'
        } else {
          queue.push({ surahName: name, segment: "full" });
        }
      }
    });

    processQueue(queue);
  };

  const processQueue = async (queue: DownloadTask[]) => {
    setIsDownloading(true);
    stopDownloadRef.current = false;

    let completed = 0;
    const total = queue.length;

    for (let i = 0; i < total; i++) {
      if (stopDownloadRef.current) break;

      const task = queue[i];
      const cacheKey = getCacheKey(task.surahName, task.segment);
      const displayTitle = `${task.surahName} ${task.segment ? `(${task.segment})` : ''}`;

      setDownloadStatus({
        current: i + 1,
        total: total,
        currentItem: displayTitle,
        percent: Math.round(((i) / total) * 100)
      });

      // Check if already exists in DB
      const existing = await getFromDB(cacheKey);
      if (existing) {
        completed++;
        continue;
      }

      try {
        // Fetch data
        const result = await fetchSurahAnalysis(task.surahName, task.segment);

        // Save to IndexedDB
        await saveToDB(cacheKey, result);

        completed++;
        refreshStats();
        onDataImported(); // Notify App to update checkmarks

        // DELAY: 10 Seconds to strictly prevent Rate Limits (429)
        if (i < total - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }

      } catch (err) {
        console.error(`Error downloading ${displayTitle}`, err);
        // Cool down for 20 seconds on error before continuing
        await new Promise(resolve => setTimeout(resolve, 20000));
      }
    }

    setIsDownloading(false);
    setDownloadStatus(null);
    if (!stopDownloadRef.current) {
      alert("İndirme işlemi tamamlandı.");
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const db = await initDB();
      const tx = db.transaction('surah_analyses', 'readonly');
      const store = tx.objectStore('surah_analyses');
      const req = store.getAll();

      req.onsuccess = () => {
        const allData = req.result;

        const keyReq = store.getAllKeys();
        keyReq.onsuccess = () => {
          const keys = keyReq.result;
          const exportData: Record<string, any> = {};
          keys.forEach((k, idx) => {
            exportData[k as string] = allData[idx];
          });

          const dataStr = JSON.stringify(exportData, null, 2);
          const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
          const exportFileDefaultName = `kuran_analiz_yedek_${new Date().toISOString().slice(0, 10)}.json`;

          const linkElement = document.createElement('a');
          linkElement.setAttribute('href', dataUri);
          linkElement.setAttribute('download', exportFileDefaultName);
          linkElement.click();
          setIsExporting(false);
        };
      };

    } catch (error) {
      console.error("Export failed", error);
      setIsExporting(false);
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const files = event.target.files;
    if (!files || files.length === 0) return;

    fileReader.readAsText(files[0], "UTF-8");
    fileReader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        let importedCount = 0;

        const promises = Object.keys(json).map(async (key) => {
          if (key.startsWith('kuran_analiz_')) {
            await saveToDB(key, json[key]);
            importedCount++;
          }
        });

        await Promise.all(promises);

        refreshStats();
        onDataImported();
        alert(`${importedCount} adet analiz başarıyla yüklendi.`);
        onClose();
      } catch (error) {
        setImportError("Dosya formatı geçersiz veya bozuk.");
      }
    };
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="text-xl font-title text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
            İçerik ve Veri Yöneticisi
          </h3>
          {!isDownloading && (
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          )}
        </div>

        {/* Tabs - Only show if not downloading and not selecting */}
        {!isDownloading && !isSelectorMode && (
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('download')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'download' ? 'bg-slate-800 text-amber-500 border-b-2 border-amber-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              İçerik İndir
            </button>
            <button
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-3 text-sm font-bold uppercase tracking-wide transition-colors ${activeTab === 'backup' ? 'bg-slate-800 text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Yedekle / Geri Yükle
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 relative">

          {/* --- SELECTOR MODE --- */}
          {isSelectorMode && !isDownloading ? (
            <div className="h-full flex flex-col">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-900 z-10 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-white font-bold text-lg">Sure Seçimi</h4>
                  <p className="text-slate-400 text-xs">Detaylı indirmek istediklerinizi seçin</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={selectAll} className="text-xs text-amber-500 hover:text-amber-400 font-bold px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                    {selectedSurahIds.size === SURAHS.length ? 'Hepsini Kaldır' : 'Tümünü Seç'}
                  </button>
                  <button onClick={() => setIsSelectorMode(false)} className="text-xs text-slate-400 hover:text-white px-3 py-1 bg-slate-800 rounded-lg border border-slate-700">
                    Vazgeç
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 flex-1 overflow-y-auto pb-20">
                {SURAHS.map(surah => {
                  const isSelected = selectedSurahIds.has(surah.id);
                  const taskCount = getTaskCountForSurah(surah.id);
                  return (
                    <div
                      key={surah.id}
                      onClick={() => toggleSurahSelection(surah.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col relative ${isSelected ? 'bg-amber-900/30 border-amber-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`font-bold text-sm ${isSelected ? 'text-amber-500' : 'text-slate-300'}`}>{surah.id}. {surah.name}</span>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1">{surah.verseCount} Ayet • ~{taskCount} Parça</span>
                    </div>
                  );
                })}
              </div>

              {/* Selector Footer */}
              <div className="absolute bottom-0 left-0 right-0 bg-slate-950 p-4 border-t border-slate-800 flex justify-between items-center">
                <div>
                  <p className="text-white text-sm font-bold">{selectionStats.totalTasks} Dosya İndirilecek</p>
                  <p className="text-emerald-400 text-xs">Tahmini Süre: {selectionStats.timeString}</p>
                </div>
                <button
                  onClick={startDetailedDownload}
                  disabled={selectedSurahIds.size === 0}
                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${selectedSurahIds.size === 0 ? 'bg-slate-800 text-slate-500' : 'bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/40'}`}
                >
                  İndirmeyi Başlat
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* --- DOWNLOAD TAB --- */}
              {activeTab === 'download' && (
                <div className="space-y-4">
                  {!isDownloading && (
                    <div className="bg-amber-900/20 border border-amber-900/50 p-3 rounded-lg text-xs text-amber-200/80 mb-4">
                      <strong>Bilgi:</strong> İndirme işlemi sırasında "Kota Aşıldı" (429) hatasını önlemek için her parça arasında 10 saniye otomatik bekleme süresi vardır.
                    </div>
                  )}

                  {isDownloading ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto mb-4"></div>
                      <h4 className="text-white font-bold text-lg mb-1">İndiriliyor...</h4>
                      <p className="text-amber-500 font-mono text-sm mb-4">
                        {downloadStatus?.currentItem} ({downloadStatus?.current} / {downloadStatus?.total})
                      </p>
                      <div className="w-full bg-slate-800 rounded-full h-2 mb-4">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(downloadStatus!.current / downloadStatus!.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-slate-500 mb-6">
                        Lütfen pencereyi kapatmayın. Arka planda çalışmaya devam ediyor.
                      </div>
                      <button
                        onClick={() => stopDownloadRef.current = true}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-600/50 rounded-lg hover:bg-red-600 hover:text-white transition-colors text-sm"
                      >
                        İptal Et
                      </button>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {PACKAGES.map(pkg => (
                        <div key={pkg.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-amber-500/50 transition-colors group">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-white text-lg group-hover:text-amber-500 transition-colors">{pkg.name}</h4>
                          </div>
                          <p className="text-slate-400 text-xs mb-4">{pkg.description}</p>
                          <button
                            onClick={() => handlePackageClick(pkg.id, pkg.items)}
                            className={`w-full py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${pkg.id === 'full_quran_detailed' ? 'bg-amber-700 hover:bg-amber-600 text-white shadow-lg' : 'bg-slate-700 hover:bg-amber-600 hover:text-white text-slate-300'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                            {pkg.id === 'full_quran_detailed' ? 'Seç ve İndir' : 'Paketi İndir'}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* --- BACKUP TAB --- */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-xs uppercase font-bold">Kayıtlı Veri</p>
                      <p className="text-2xl font-bold text-white">{stats.surahCount} <span className="text-sm font-normal text-slate-500">Adet</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-400 text-xs uppercase font-bold">Veritabanı</p>
                      <p className="text-emerald-400 font-mono">{stats.totalSize}</p>
                    </div>
                  </div>

                  <div>
                    <button
                      onClick={handleExport}
                      disabled={isExporting || stats.surahCount === 0}
                      className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${stats.surahCount === 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20'
                        }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                      Yedek Dosyası İndir (.json)
                    </button>
                    <p className="text-center text-xs text-slate-500 mt-2">Tüm verilerinizi tek dosya olarak bilgisayarınıza indirir.</p>
                  </div>

                  <div className="border-t border-slate-700"></div>

                  {ENABLE_DEVELOPER_TOOLS ? (
                    <div>
                      <label className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 border-dashed text-slate-300 font-bold flex items-center justify-center gap-2 cursor-pointer transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                        Yedek Dosyası Yükle
                        <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                      </label>
                      {importError && <p className="text-red-500 text-xs mt-2 text-center">{importError}</p>}
                    </div>
                  ) : (
                    <div className="text-center py-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                      <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Veri Sürümü</p>
                      <p className="text-amber-500 font-mono font-bold text-lg">{DATASET_VERSION}</p>
                      <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-emerald-500">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                        <span>Güncel</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default DataManager;
