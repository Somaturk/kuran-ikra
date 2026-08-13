
export interface WordAnalysis {
  arabic: string;
  turkish: string;
  meaning: string;
  etymology: string;
}

export interface VerseAnalysis {
  verseNumber: number;
  arabicText: string;
  turkishPronunciation: string;
  turkishTranslation: string;
  historicalContext: string;
  wordAnalysis: WordAnalysis[];
  juz?: number;
  hizb?: number;
  rubu?: number;
}

export interface PresentationData {
  title: string;
  introduction: string;
  verses: VerseAnalysis[];
}

export interface GlobalSearchResult {
  surahName: string;
  verseNumber: number;
  text: string;
  reasoning: string; // Why this verse matched
}
