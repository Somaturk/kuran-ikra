
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'kuran_read_status';

export const useReadStatus = () => {
    const [readVerses, setReadVerses] = useState<Set<string>>(new Set());
    const [lastRead, setLastRead] = useState<{ surahId: number; verseId: number } | null>(null);

    // Initialize from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                setReadVerses(new Set(parsed.verses || []));
                setLastRead(parsed.lastRead || null);
            }
        } catch (error) {
            console.error('Failed to load read status:', error);
        }
    }, []);

    // Persist to localStorage whenever state changes
    useEffect(() => {
        try {
            const data = {
                verses: Array.from(readVerses),
                lastRead
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save read status:', error);
        }
    }, [readVerses, lastRead]);

    const markAsRead = useCallback((surahId: number, verseId: number) => {
        const key = `${surahId}:${verseId}`;
        setReadVerses(prev => {
            const newSet = new Set(prev);
            newSet.add(key);
            return newSet;
        });
        setLastRead({ surahId, verseId });
    }, []);

    const markAsUnread = useCallback((surahId: number, verseId: number) => {
        const key = `${surahId}:${verseId}`;
        setReadVerses(prev => {
            const newSet = new Set(prev);
            newSet.delete(key);
            return newSet;
        });
    }, []);

    const isRead = useCallback((surahId: number, verseId: number) => {
        return readVerses.has(`${surahId}:${verseId}`);
    }, [readVerses]);

    const getReadCountForSurah = useCallback((surahId: number) => {
        let count = 0;
        readVerses.forEach(key => {
            if (key.startsWith(`${surahId}:`)) {
                count++;
            }
        });
        return count;
    }, [readVerses]);

    return {
        readVerses,
        lastRead,
        markAsRead,
        markAsUnread,
        isRead,
        getReadCountForSurah
    };
};
