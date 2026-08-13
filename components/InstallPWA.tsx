
import React, { useEffect, useState } from 'react';

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if already seen
    const hasSeenPrompt = sessionStorage.getItem('installPromptSeen');
    if (hasSeenPrompt) return;

    // Android / Desktop handling with Timeout Fallback
    // Even if 'beforeinstallprompt' doesn't fire (e.g. preview environment or error),
    // we still show the modal to instruct users on how to install manually.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Wait a bit before showing
      setTimeout(() => setShowInstallModal(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Fallback timer: If event doesn't fire in 3 seconds, show modal anyway
    const fallbackTimer = setTimeout(() => {
      if (!showInstallModal) {
         setShowInstallModal(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      clearTimeout(fallbackTimer);
    };
  }, [showInstallModal]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallModal(false);
      }
      setDeferredPrompt(null);
    } else {
      // If no prompt event (e.g. error or unsupported), we can't trigger it programmatically.
      // We rely on the UI instructions below.
      alert("Otomatik yükleme başlatılamadı. Lütfen tarayıcı menüsünden 'Uygulamayı Yükle' veya 'Ana Ekrana Ekle' seçeneğini kullanın.");
    }
  };

  const closePrompt = () => {
    setShowInstallModal(false);
    sessionStorage.setItem('installPromptSeen', 'true');
  };

  if (!showInstallModal) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl -ml-10 -mb-10"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
             {/* ONE YAZILIM Logo Mini */}
             <div className="flex items-center justify-center font-sans tracking-tighter leading-none select-none bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-red-600 mr-0.5 text-lg font-black">[</span>
                <span className="text-white mt-0.5 text-sm font-light italic">1</span>
                <span className="text-red-600 ml-0.5 text-lg font-black">]</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Uygulamayı Yükle</h3>
              <p className="text-slate-400 text-xs">ONE YAZILIM deneyimi</p>
            </div>
          </div>

          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Daha hızlı erişim ve tam ekran deneyimi için <strong>Kuran Derin Analiz</strong>'i ana ekranınıza eklemek ister misiniz?
          </p>

          {/* iOS Instructions */}
          {isIOS && (
            <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 mb-4 border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-bold">1</span>
                <span>Tarayıcının altındaki <span className="text-blue-400 font-bold">Paylaş</span> simgesine basın.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-bold">2</span>
                <span>Listeden <span className="text-white font-bold">Ana Ekrana Ekle</span> seçeneğini bulun.</span>
              </div>
            </div>
          )}

          {/* Android Manual Instructions (If auto prompt missing) */}
          {!isIOS && !deferredPrompt && (
             <div className="bg-slate-800 rounded-lg p-4 text-sm text-slate-300 mb-4 border border-slate-700">
               <div className="flex items-center gap-2 mb-2">
                 <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-bold">1</span>
                 <span>Tarayıcının sağ üstündeki <span className="text-white font-bold">3 Nokta (⋮)</span> menüsüne basın.</span>
               </div>
               <div className="flex items-center gap-2">
                 <span className="bg-slate-700 px-2 py-0.5 rounded text-xs font-bold">2</span>
                 <span><span className="text-white font-bold">Uygulamayı Yükle</span> veya <span className="text-white font-bold">Ana Ekrana Ekle</span> seçeneğine basın.</span>
               </div>
             </div>
          )}

          <div className="flex gap-3">
            <button 
              onClick={closePrompt}
              className="flex-1 px-4 py-3 rounded-xl text-slate-400 hover:bg-slate-800 font-medium transition-colors text-sm"
            >
              Şimdi Değil
            </button>
            
            {!isIOS && deferredPrompt && (
              <button 
                onClick={handleInstallClick}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold shadow-lg shadow-amber-900/20 transition-all text-sm"
              >
                Yükle
              </button>
            )}
            
            {/* For manual install cases (iOS or Android manual), just close since we showed instructions */}
            {(isIOS || (!isIOS && !deferredPrompt)) && (
               <button 
                onClick={closePrompt}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-white font-bold transition-all text-sm hover:bg-slate-700"
              >
                Tamam
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstallPWA;
