
import React, { useEffect, useState, useRef } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
}

const SNAP_COLLAPSED = 35; // 35% height
const SNAP_HALF = 60;      // 60% height
const SNAP_FULL = 92;      // 92% height
const CLOSE_THRESHOLD = 20; // Close if dragged below 20%

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children, icon }) => {
    const [sheetHeight, setSheetHeight] = useState(SNAP_COLLAPSED); // Initial open height
    const [isDragging, setIsDragging] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Refs for drag tracking
    const startY = useRef<number>(0);
    const startHeight = useRef<number>(0);
    const sheetRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setSheetHeight(SNAP_HALF); // Start at half height
            document.body.style.overflow = 'hidden';
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300);
            document.body.style.overflow = '';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        startY.current = e.touches[0].clientY;
        startHeight.current = sheetHeight;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;

        const deltaY = e.touches[0].clientY - startY.current;
        const windowHeight = window.innerHeight;
        const deltaPercentage = (deltaY / windowHeight) * 100;

        // Subtract delta because dragging down (positive delta) decreases height
        let newHeight = startHeight.current - deltaPercentage;

        // Clamp
        if (newHeight > 100) newHeight = 100;
        if (newHeight < 0) newHeight = 0;

        setSheetHeight(newHeight);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);

        // Snap Logic
        if (sheetHeight < CLOSE_THRESHOLD) {
            onClose();
        } else if (sheetHeight < (SNAP_COLLAPSED + SNAP_HALF) / 2) {
            setSheetHeight(SNAP_COLLAPSED);
        } else if (sheetHeight < (SNAP_HALF + SNAP_FULL) / 2) {
            setSheetHeight(SNAP_HALF);
        } else {
            setSheetHeight(SNAP_FULL);
        }
    };

    // Close on backdrop click (if not processed by child)
    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    if (!isVisible) return null;

    return (
        <div
            className={`fixed inset-0 z-[70] flex flex-col justify-end lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
            onClick={handleBackdropClick}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Sheet Content */}
            <div
                ref={sheetRef}
                className={`relative bg-white dark:bg-slate-900 w-full rounded-t-3xl shadow-2xl flex flex-col will-change-transform ${!isDragging ? 'transition-[height] duration-300 ease-out' : 'transition-none'}`}
                style={{ height: `${sheetHeight}%` }}
                onClick={(e) => e.stopPropagation()} // Prevent click through
            >
                {/* Drag Handle Area */}
                <div
                    className="w-full h-8 flex items-center justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-6 pb-3 pt-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
                    <div className="flex items-center gap-3">
                        {icon}
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto p-6 safe-area-pb overscroll-contain">
                    {children}
                </div>
            </div>
        </div>
    );
};
