
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PresentationData, GlobalSearchResult } from "../types";
import { ENABLE_DEVELOPER_TOOLS } from '../constants';

let aiInstance: GoogleGenAI | null = null;
const getAI = (): GoogleGenAI => {
  if (!aiInstance) {
    const key = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in environment variables.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

const wordAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    arabic: { type: Type.STRING, description: "The specific Arabic word from the verse." },
    turkish: { type: Type.STRING, description: "Turkish pronunciation of the word." },
    meaning: { type: Type.STRING, description: "Meaning of the word in Turkish." },
    etymology: { type: Type.STRING, description: "Etymological root (e.g., K-T-B) and linguistic origin explanation." }
  },
  required: ["arabic", "turkish", "meaning", "etymology"]
};

const verseAnalysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    verseNumber: { type: Type.INTEGER },
    arabicText: { type: Type.STRING },
    turkishPronunciation: { type: Type.STRING },
    turkishTranslation: { type: Type.STRING },
    historicalContext: { type: Type.STRING, description: "Brief historical context/Asbab al-Nuzul." },
    wordAnalysis: {
      type: Type.ARRAY,
      items: wordAnalysisSchema,
      description: "Analysis of ALL meaningful words in the verse sequence (word-by-word analysis)."
    }
  },
  required: ["verseNumber", "arabicText", "turkishPronunciation", "turkishTranslation", "historicalContext", "wordAnalysis"]
};

const presentationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    introduction: { type: Type.STRING, description: "A brief introduction to the section." },
    verses: {
      type: Type.ARRAY,
      items: verseAnalysisSchema
    }
  },
  required: ["title", "introduction", "verses"]
};

const searchResultSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    results: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          surahName: { type: Type.STRING, description: "Exact Surah Name (e.g. Bakara, Ali İmran)" },
          verseNumber: { type: Type.INTEGER },
          text: { type: Type.STRING, description: "Turkish translation of the verse content containing the keyword." },
          reasoning: { type: Type.STRING, description: "Brief explanation of how this verse relates to the search term." }
        },
        required: ["surahName", "verseNumber", "text", "reasoning"]
      }
    }
  },
  required: ["results"]
};

// Helper for retrying requests on 429 errors
async function generateWithRetry<T>(operation: () => Promise<T>, retries = 5, initialDelay = 3000): Promise<T> {
  let delay = initialDelay;
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isQuotaError = error.status === 429 || 
                           (error.message && error.message.includes('429')) || 
                           (error.message && error.message.includes('quota')) ||
                           (error.message && error.message.includes('RESOURCE_EXHAUSTED'));
      
      if (isQuotaError && i < retries - 1) {
        console.warn(`Quota hit, retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff (3s, 6s, 12s, 24s...)
        continue;
      }
      throw error;
    }
  }
  throw new Error("API kotası aşıldı. Lütfen daha sonra tekrar deneyin veya işlemi yavaşlatın.");
}

export const fetchSurahAnalysis = async (surahName: string, segment?: string, onProgress?: (progress: number) => void): Promise<PresentationData> => {
  // SAFETY GUARD: Disable API in production mode
  if (!ENABLE_DEVELOPER_TOOLS) {
      throw new Error("API calls are disabled in Production Mode. Please use offline data.");
  }

  let specificInstruction = "";
  
  if (segment === "özet") {
    specificInstruction = `${surahName} Suresi'nin en hayati, en çok bilinen ve ana mesajı taşıyan 3-5 ayetini seçip özet bir seçki olarak analiz et.`;
  } else if (segment) {
    specificInstruction = `${surahName} Suresi'nin sadece ${segment}. ayetleri arasını analiz et. Eğer sure bitiyorsa, belirtilen son ayete kadar git.`;
  } else {
    specificInstruction = `${surahName} Suresi'nin tamamını analiz et.`;
  }

  const prompt = `
    ${specificInstruction}
    
    TALİMATLAR (KELİME KELİME ANALİZ):
    1. Seçilen aralıktaki veya seçkideki her ayeti işle.
    2. **KRİTİK TALİMAT:** "Word-by-word" (Kelime kelime) analiz yapmanı istiyorum. 
    3. Ayette geçen **TÜM İSİM, FİİL ve ANLAM TAŞIYAN EDATLARI** (Zâlike, Kitabu, La, Raybe, Fihi, Hüden, Lil, Muttekin gibi) ayetteki sırasına göre tek tek nesne olarak oluştur.
    4. Sadece basit bağlaçları ("ve" gibi) atlayabilirsin, ancak anlamı etkileyen her kelime listede olmalı.
    5. Kelime listesi eksik olmamalıdır.
    6. **ETİMOLOJİK AÇIKLAMALAR:** Çok kısa ve öz olmalı. Maksimum 2 cümle ile kökü ve manayı ver. Uzun ansiklopedik bilgi verme. Hız çok önemli.
    
    KAYNAKÇA VE METODOLOJİ:
    - Etimoloji için: **Ragıb el-İsfahani (Müfredat)** ve **İbn Manzur (Lisanü'l-Arab)** eserlerini baz al.
    - Tefsir ve Meal için: **Taberi**, **Kurtubi**, **İbn Kesir**, **Elmalılı Hamdi Yazır** ve **TDV İslam Ansiklopedisi** görüşlerini sentezle.
    - Tarihsel Bağlam için: Güvenilir **Siyer** ve **Esbab-ı Nüzul** kaynaklarını kullan.

    Format ve Dil:
    - Türkçe yanıt ver.
    - Ton: Akademik, dilbilimsel (etimolojik) ve manevi derinlikte.
    - Kuran terminolojisine sadık kal.
  `;

  return generateWithRetry(async () => {
    try {
      // STREAMING REQUEST
      const result = await getAI().models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: presentationSchema,
          systemInstruction: "Sen Kuran tefsiri, Arapça belagat ve etimoloji (kökenbilim) uzmanısın. Ayetleri kelime kelime parçalayarak (sarf ve nahiv) derinlemesine analiz edersin.",
        },
      });

      let fullText = "";
      // Estimate length: Summary ~8k chars, Segment ~25k chars
      const estimatedLength = segment === "özet" ? 8000 : 25000;

      for await (const chunk of result) {
          const chunkText = chunk.text;
          if (chunkText) {
              fullText += chunkText;
              if (onProgress) {
                  const currentLength = fullText.length;
                  // Calculate progress logarithmically to feel natural
                  let percentage = Math.min(Math.floor((currentLength / estimatedLength) * 100), 99);
                  // Ensure it never shows 0 once started
                  percentage = Math.max(percentage, 1);
                  onProgress(percentage);
              }
          }
      }

      if (!fullText) throw new Error("No response from Gemini");
      
      let jsonString = fullText;
      // Cleanup markdown if present
      if (jsonString.startsWith("```json")) {
          jsonString = jsonString.replace(/^```json/, "").replace(/```$/, "");
      } else if (jsonString.startsWith("```")) {
          jsonString = jsonString.replace(/^```/, "").replace(/```$/, "");
      }

      return JSON.parse(jsonString) as PresentationData;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  });
};

export const searchQuranWithAI = async (query: string): Promise<GlobalSearchResult[]> => {
  // SAFETY GUARD: Disable API in production mode
  if (!ENABLE_DEVELOPER_TOOLS) {
      throw new Error("API calls are disabled in Production Mode.");
  }

  const prompt = `
    Kuran-ı Kerim içerisinde "${query}" kelimesini ara.

    GÖREV:
    1. ÖNCELİKLE TAM EŞLEŞME: Türkçe mealinde birebir "${query}" kelimesi geçen ayetleri bul. (Örneğin "Kübra" aranıyorsa, içinde "kübra" veya "büyük" anlamında bu kökten türeyen kelimelerin geçtiği ayetleri getir).
    2. Eğer birebir kelime yoksa, bu konuyu en iyi anlatan ayetleri bul.
    3. En fazla 15 adet sonuç döndür.
    4. Surah ismi tam ve doğru Türkçe yazılışıyla olmalı.
    5. "text" alanında ayetin Türkçe mealini tam olarak ver ki kullanıcı aradığı kelimeyi içinde görebilsin.
    6. "reasoning" kısmında: Eğer kelime geçiyorsa "İçinde ... kelimesi geçmektedir" şeklinde belirt.
  `;

  return generateWithRetry(async () => {
    try {
      const result = await getAI().models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: searchResultSchema,
        }
      });

      const response = JSON.parse(result.text);
      return response.results || [];
    } catch (error) {
      console.error("Search Error:", error);
      return [];
    }
  });
};
