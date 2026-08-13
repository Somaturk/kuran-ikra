
import React, { useEffect, useState } from 'react';

const messages = [
  "Ayetler taranıyor...",
  "Etimolojik kökler inceleniyor...",
  "Tarihsel bağlam araştırılıyor...",
  "Arapça lugat kontrol ediliyor...",
  "Tefsir kaynakları derleniyor...",
  "Sunum hazırlanıyor..."
];

interface LoadingSpinnerProps {
  progress?: number;
  message?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ progress = 0, message }) => {
  const [messageIndex, setMessageIndex] = useState(0);
  const [minProgress, setMinProgress] = useState(0);

  // Message rotation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Warm-up animation: Slowly go from 0 to 30% over 10 seconds
  // Calculation: 30 / (10000ms / 50ms) = 0.15 increment per tick
  useEffect(() => {
    const timer = setInterval(() => {
      setMinProgress(prev => {
        if (prev >= 30) {
          clearInterval(timer);
          return 30;
        }
        return prev + 0.15;
      });
    }, 50); // Update every 50ms
    return () => clearInterval(timer);
  }, []);

  // Use the real progress, but ensure we show at least the warm-up progress
  // This prevents the needle from staying at 0 while waiting for the first chunk
  const effectiveProgress = Math.max(progress, minProgress);

  // Clamp visual progress between 0 and 99 until finished
  const visualProgress = Math.min(Math.max(0, effectiveProgress), 99);

  // Calculate needle rotation (Starts at -120deg, ends at 120deg for a 240deg arc)
  const rotation = -120 + (visualProgress / 100) * 240;

  // Calculate stroke dashoffset for the progress bar
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * (240 / 360);
  const strokeDashoffset = arcLength - (visualProgress / 100) * arcLength;

  return (
    // Added CSS variables for gradient colors to handle switching inside SVG defs
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden relative transition-colors duration-300 [--gauge-start:#34d399] [--gauge-end:#059669] dark:[--gauge-start:#f59e0b] dark:[--gauge-end:#b45309]">
      {/* Background decoration - Adapted for Light/Dark */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400 dark:bg-amber-600 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-emerald-300 dark:bg-amber-800 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* GAUGE / METER COMPONENT */}
      <div className="relative w-64 h-64 mb-6 z-10 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--gauge-start)" />
              <stop offset="100%" stopColor="var(--gauge-end)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Track - Light Mode: Slate-200, Dark Mode: Slate-800 */}
          <path
            d="M 20 75 A 40 40 0 1 1 80 75"
            fill="none"
            className="stroke-slate-200 dark:stroke-slate-800 transition-colors duration-300"
            strokeWidth="8"
            strokeLinecap="round"
          />

          {/* Progress Bar (Colored) */}
          <path
            d="M 20 75 A 40 40 0 1 1 80 75"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={arcLength + " " + circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
            filter="url(#glow)"
          />

          {/* Tick Marks (Decorations) */}
          <g className="stroke-slate-400 dark:stroke-slate-600 transition-colors duration-300" strokeWidth="1">
            <line x1="50" y1="10" x2="50" y2="15" transform="rotate(-120 50 50)" />
            <line x1="50" y1="10" x2="50" y2="15" transform="rotate(-60 50 50)" />
            <line x1="50" y1="10" x2="50" y2="15" transform="rotate(0 50 50)" />
            <line x1="50" y1="10" x2="50" y2="15" transform="rotate(60 50 50)" />
            <line x1="50" y1="10" x2="50" y2="15" transform="rotate(120 50 50)" />
          </g>

          {/* Thematic Needle (Rub el Hizb Center + Elegant Pointer) */}
          <g transform={`rotate(${rotation} 50 50)`} style={{ transition: 'transform 0.3s ease-out' }}>
            {/* The Needle Body - Green (Light) / Amber (Dark) */}
            <path d="M 50 15 L 53 50 L 50 55 L 47 50 Z" className="fill-emerald-600 dark:fill-amber-600 stroke-emerald-700 dark:stroke-amber-700 transition-colors" strokeWidth="0.5" filter="url(#shadow)" />

            {/* Center Cap: Rub el Hizb (8-pointed star) */}
            {/* Square 1 */}
            <rect x="46" y="46" width="8" height="8" rx="1" className="fill-white dark:fill-slate-800 stroke-emerald-500 dark:stroke-amber-500 transition-colors" strokeWidth="1" />
            {/* Square 2 (Rotated 45 deg) */}
            <rect x="46" y="46" width="8" height="8" rx="1" className="fill-white dark:fill-slate-800 stroke-emerald-500 dark:stroke-amber-500 transition-colors" strokeWidth="1" transform="rotate(45 50 50)" />

            {/* Inner Dot */}
            <circle cx="50" cy="50" r="2" className="fill-emerald-400 dark:fill-amber-500 transition-colors" />
          </g>
        </svg>

        {/* Digital Percentage Counter in Center-Bottom */}
        <div className="absolute top-[60%] flex flex-col items-center">
          <span className="text-3xl font-bold text-slate-800 dark:text-white font-title tabular-nums transition-colors">
            {Math.floor(visualProgress)}%
          </span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">YÜKLENİYOR</span>
        </div>
      </div>

      {/* Rotating Messages */}
      <div className="h-8 z-10 text-center px-4 mb-2">
        <h2 className="text-xl md:text-2xl font-title text-emerald-700 dark:text-amber-500 animate-fade-in transition-all duration-500">
          {message || messages[messageIndex]}
        </h2>
      </div>

      {/* Caching Information Note - Light Mode: White bg, Dark Mode: Slate bg */}
      <div className="z-10 max-w-xs mx-auto text-center px-4 animate-fade-in opacity-80 mt-6">
        <div className="bg-white/60 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-200 dark:border-slate-700/50 backdrop-blur-sm shadow-sm transition-colors">
          <p className="text-emerald-600 dark:text-amber-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            ⚡ Akıllı Hafıza Sistemi
          </p>
          <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
            Bu bölüm ilk kez analiz edildiği için işlem biraz zaman alabilir.
            Veriler cihazınıza kaydedilecek ve <span className="text-slate-800 dark:text-slate-200 font-semibold">sonraki okumalarınızda anında açılacaktır.</span>
          </p>
        </div>
      </div>

      {/* FLOATING TRANSPARENT FULL-WIDTH FOOTER */}
      <div className="fixed bottom-0 left-0 w-full z-50 pointer-events-none">
        <div className="w-full bg-slate-200/90 dark:bg-slate-950/80 backdrop-blur-md border-t border-slate-300 dark:border-slate-800/50 py-1 flex flex-col items-center justify-center pointer-events-auto shadow-lg">
          <div className="flex items-center gap-1 opacity-90 scale-75 origin-bottom">
            {/* [ 1 ] Symbol */}
            <div className="flex items-center justify-center font-sans tracking-tighter leading-none select-none">
              <span className="text-red-600 mr-0.5 text-lg font-black">[</span>
              <span className="text-black dark:text-white mt-0.5 text-sm font-light italic">1</span>
              <span className="text-red-600 ml-0.5 text-lg font-black">]</span>
            </div>
            {/* Text */}
            <span className="text-slate-900 dark:text-slate-200 font-black text-[13px] tracking-[0.25em] font-sans border-l border-black dark:border-slate-600 pl-2 h-4 flex items-center">
              ONE YAZILIM
            </span>
          </div>
          {/* Author Text */}
          <p className="text-[8px] text-slate-700 dark:text-slate-400 font-medium tracking-widest -mt-0.5 pb-0.5">
            Turgay IŞIK tarafından hazırlanmıştır
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
