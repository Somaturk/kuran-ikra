import { saveToDB, clearDB, initDB } from './storage';
import { getJuzForVerse, SURAHS } from '../constants';
import { VerseAnalysis, PresentationData } from '../types';

// Helper for robust matching
const normalize = (text: string) => {
  return text.toLowerCase()
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ç/g, 'c')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ı/g, 'i')
    .replace(/[^a-z0-9]/g, ''); // Remove all non-alphanumeric (including spaces/dashes for comparison)
};

export const DATASET_VERSION = "2025-12-26-v3"; // Bumped version to force re-import with fix

export const ensureEmbeddedDatasetLoaded = async (): Promise<void> => {
  const currentVersion = localStorage.getItem('embeddedDataVersion');

  if (currentVersion === DATASET_VERSION) {
    console.log("Embedded dataset already loaded and up to date.");
    return;
  }

  console.log("Loading embedded dataset with transformation...");
  try {
    const response = await fetch('/Fullkuran.json');
    if (!response.ok) {
      throw new Error(`Failed to fetch dataset: ${response.statusText}`);
    }

    // Clear old data to avoid conflicts/leftovers
    // await clearDB(); // Optional: risky if user has other data, but per requirements we only trust public/Fullkuran.json
    // Safest is to just overwrite keys.

    const json = await response.json();
    const surahVersesMap: Record<string, VerseAnalysis[]> = {};
    const surahMetaMap: Record<string, any> = {};

    const keys = Object.keys(json);

    // 1. Group all segments by Surah
    for (const key of keys) {
      if (!key.startsWith('kuran_analiz_')) continue;

      const data = json[key] as PresentationData;
      if (!data || !data.verses) continue;

      // Extract Surah Name.
      // Format assumption: kuran_analiz_{Name}_{Segment}
      // Actually, looking at previous keys, it might be just the name if it was segmented.
      // But since we want to merge, let's look at the content.
      // The PresentationData doesn't explicitly have Surah ID usually.
      // We can infer Surah from the filename part or by looking up the content.

      // Strategy: Use the first verse's context or just string matching on the key.
      // Let's rely on the key splitting.
      // keys usually: "kuran_analiz_Bakara 1-7", "kuran_analiz_Bakara 8-14"
      // Split by last space? Or Regex.

      // Safer Strategy: Match against SURAHS list with normalization.
      const normalizedKey = key.replace('kuran_analiz_', '');
      const normalizedKeyClean = normalize(normalizedKey);

      const surahMatch = SURAHS.find(s => normalizedKeyClean.startsWith(normalize(s.name)));

      if (surahMatch) {
        const surahName = surahMatch.name;
        if (!surahVersesMap[surahName]) {
          surahVersesMap[surahName] = [];
          // Keep metadata from the first chunk found (usually fine)
          surahMetaMap[surahName] = { ...data, verses: [] };
        }
        surahVersesMap[surahName].push(...data.verses);
      } else {
        // Fallback for unknown keys, maybe just save as is?
        // Or maybe it's "ozet" etc.
        // If it contains "özet", we might want to keep it separate or ignore?
        // User said: "Özet" tab will exist.
        // We should preserve "Summary" segments as "kuran_analiz_{Name}_summary" or just keep original key if it's summary.
        if (normalizedKey.includes('özet') || normalizedKey.includes('Özet')) {
          await saveToDB(key, data);
        }
      }
    }

    // 2. Process, Sort, Enrich, and Save
    const promises: Promise<void>[] = [];
    let importedCount = 0;

    for (const surahName of Object.keys(surahVersesMap)) {
      const verses = surahVersesMap[surahName];

      // Sort by verse number
      verses.sort((a, b) => a.verseNumber - b.verseNumber);

      // Remove duplicates if any
      const uniqueVerses = verses.filter((v, i, self) =>
        i === self.findIndex((t) => t.verseNumber === v.verseNumber)
      );

      // Find Surah ID
      const surahInfo = SURAHS.find(s => s.name === surahName);
      if (!surahInfo) continue; // Should not happen

      // Enrich with Juz/Hizb
      const enrichedVerses = uniqueVerses.map(v => ({
        ...v,
        juz: getJuzForVerse(surahInfo.id, v.verseNumber),
        // hizb can be calculated similarly if we had mapping, for now just Juz is critical
      }));

      const fullData: PresentationData = {
        ...surahMetaMap[surahName],
        title: surahName, // Ensure clean title
        verses: enrichedVerses
      };

      // Save as "kuran_analiz_{Name}_full"
      // This is the key the new UI will look for.
      promises.push(saveToDB(`kuran_analiz_${surahName}_full`, fullData));
      importedCount++;
    }

    await Promise.all(promises);

    localStorage.setItem('embeddedDataVersion', DATASET_VERSION);
    console.log(`Success! Processed and imported ${importedCount} full Surahs.`);

  } catch (error) {
    console.error("Failed to load embedded dataset:", error);
    throw error;
  }
};
