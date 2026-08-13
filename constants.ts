
export const ENABLE_DEVELOPER_TOOLS = true; // YAYINA ALIRKEN 'false', VERİ ÜRETİRKEN 'true' YAPIN

// Start Verse for each Juz (1-30)
// Format: [SurahID, VerseID]
export const JUZ_START_VERSES = [
  { juz: 1, surah: 1, verse: 1 },
  { juz: 2, surah: 2, verse: 142 },
  { juz: 3, surah: 2, verse: 253 },
  { juz: 4, surah: 3, verse: 93 },
  { juz: 5, surah: 4, verse: 24 },
  { juz: 6, surah: 4, verse: 148 },
  { juz: 7, surah: 5, verse: 82 },
  { juz: 8, surah: 6, verse: 111 },
  { juz: 9, surah: 7, verse: 88 },
  { juz: 10, surah: 8, verse: 41 },
  { juz: 11, surah: 9, verse: 93 },
  { juz: 12, surah: 11, verse: 6 },
  { juz: 13, surah: 12, verse: 53 },
  { juz: 14, surah: 15, verse: 1 },
  { juz: 15, surah: 17, verse: 1 },
  { juz: 16, surah: 18, verse: 75 },
  { juz: 17, surah: 21, verse: 1 },
  { juz: 18, surah: 23, verse: 1 },
  { juz: 19, surah: 25, verse: 21 },
  { juz: 20, surah: 27, verse: 56 },
  { juz: 21, surah: 29, verse: 46 },
  { juz: 22, surah: 33, verse: 31 },
  { juz: 23, surah: 36, verse: 28 },
  { juz: 24, surah: 39, verse: 32 },
  { juz: 25, surah: 41, verse: 47 },
  { juz: 26, surah: 46, verse: 1 },
  { juz: 27, surah: 51, verse: 31 },
  { juz: 28, surah: 58, verse: 1 },
  { juz: 29, surah: 67, verse: 1 },
  { juz: 30, surah: 78, verse: 1 },
];

export const getJuzForVerse = (surahId: number, verseNo: number): number => {
  // Iterate backwards to find the standard juz
  for (let i = JUZ_START_VERSES.length - 1; i >= 0; i--) {
    const start = JUZ_START_VERSES[i];
    if (surahId > start.surah || (surahId === start.surah && verseNo >= start.verse)) {
      return start.juz;
    }
  }
  return 1;
};

// Returns range of Juzs in a Surah (e.g., "1-3" or "30")
export const getJuzRangeForSurah = (surah: SurahInfo): string => {
  const startJuz = getJuzForVerse(surah.id, 1);
  const endJuz = getJuzForVerse(surah.id, surah.verseCount);
  if (startJuz === endJuz) return `${startJuz}`;
  return `${startJuz}-${endJuz}`;
}

export interface SurahInfo {
  id: number;
  name: string;
  meaning: string;
  verseCount: number;
  description: string;
}

export const SURAHS: SurahInfo[] = [
  {
    id: 1,
    name: "Fâtiha",
    meaning: "Açılış, Başlangıç",
    verseCount: 7,
    description: "Kuran'ın özeti, Allah'a övgü, dua ve hidayet talebini içeren temel sure."
  },
  {
    id: 2,
    name: "Bakara",
    meaning: "Sığır, İnek",
    verseCount: 286,
    description: "İslam hukukunun temelleri, iman esasları, İsrailoğulları kıssaları ve Ayetü'l-Kürsi'yi barındıran en uzun sure."
  },
  {
    id: 3,
    name: "Âl-i İmrân",
    meaning: "İmran Ailesi",
    verseCount: 200,
    description: "Tevhid inancı, Uhud Savaşı, Hz. Meryem ve Hz. İsa'nın kıssası ile Hristiyanlarla diyalog konuları."
  },
  {
    id: 4,
    name: "Nisâ",
    meaning: "Kadınlar",
    verseCount: 176,
    description: "Kadın hakları, miras hukuku, evlilik, yetimler ve toplumsal düzenlemeler üzerine hükümler."
  },
  {
    id: 5,
    name: "Mâide",
    meaning: "Sofrâ",
    verseCount: 120,
    description: "Helal-haram yiyecekler, abdest, sözleşmelere sadakat ve Hristiyanlık inancının reddi."
  },
  {
    id: 6,
    name: "En'âm",
    meaning: "Hayvanlar",
    verseCount: 165,
    description: "Allah'ın birliği, putperestliğin reddi, peygamberlerin mücadelesi ve yaratılış delilleri."
  },
  {
    id: 7,
    name: "A'râf",
    meaning: "Yüksek Yerler",
    verseCount: 206,
    description: "Peygamber kıssaları (Ad, Semud, Medyen), şeytanın hileleri ve A'raf ehlinin durumu."
  },
  {
    id: 8,
    name: "Enfâl",
    meaning: "Savaş Ganimetleri",
    verseCount: 75,
    description: "Bedir Savaşı, savaş hukuku, ganimetlerin paylaşımı ve Allah'a tevekkül."
  },
  {
    id: 9,
    name: "Tevbe",
    meaning: "Tövbe",
    verseCount: 129,
    description: "Münafıkların durumu, cihat, müşriklerle ilişkiler ve samimi tövbenin önemi."
  },
  {
    id: 10,
    name: "Yûnus",
    meaning: "Yunus Peygamber",
    verseCount: 109,
    description: "Vahiy, peygamberlik, öldükten sonra diriliş ve Hz. Yunus ile kavminin kıssası."
  },
  {
    id: 11,
    name: "Hûd",
    meaning: "Hud Peygamber",
    verseCount: 123,
    description: "Geçmiş kavimlerin (Ad, Semud, Lut) helak olma sebepleri ve peygamberlerin tevhid mücadelesi."
  },
  {
    id: 12,
    name: "Yûsuf",
    meaning: "Yusuf Peygamber",
    verseCount: 111,
    description: "Hz. Yusuf'un hayatı, sabrı, kardeşleriyle imtihanı ve rüya tabirleri ('Kıssaların en güzeli')."
  },
  {
    id: 13,
    name: "Ra'd",
    meaning: "Gök Gürültüsü",
    verseCount: 43,
    description: "Tabiat olaylarındaki ilahi kudret, vahyin hakikati ve kalplerin ancak Allah'ı anmakla huzur bulacağı."
  },
  {
    id: 14,
    name: "İbrâhîm",
    meaning: "İbrahim Peygamber",
    verseCount: 52,
    description: "Hz. İbrahim'in tevhid mücadelesi, duası ve vahyin insanlığı karanlıktan aydınlığa çıkarması."
  },
  {
    id: 15,
    name: "Hicr",
    meaning: "Taşlı Yer",
    verseCount: 99,
    description: "Kuran'ın korunmuşluğu, insanın yaratılışı, şeytanın isyanı ve helak edilen kavimler."
  },
  {
    id: 16,
    name: "Nahl",
    meaning: "Bal Arısı",
    verseCount: 128,
    description: "Allah'ın nimetleri (özellikle arı), şükür, adalet, iyilik ve ahiret sorumluluğu."
  },
  {
    id: 17,
    name: "İsrâ",
    meaning: "Gece Yürüyüşü",
    verseCount: 111,
    description: "Miraç hadisesi, İsrailoğulları, ana-baba hakkı ve ahlaki davranış kuralları."
  },
  {
    id: 18,
    name: "Kehf",
    meaning: "Mağara",
    verseCount: 110,
    description: "Ashab-ı Kehf, Hz. Musa ve Hızır kıssası, Zülkarneyn ve Deccal fitnesine karşı uyarılar."
  },
  {
    id: 19,
    name: "Meryem",
    meaning: "Hz. Meryem",
    verseCount: 98,
    description: "Hz. Meryem, Hz. İsa, Hz. Zekeriya ve diğer peygamberlerin rahmetle anılması."
  },
  {
    id: 20,
    name: "Tâhâ",
    meaning: "Tâ-Hâ Harfleri",
    verseCount: 135,
    description: "Hz. Musa'nın Firavun ile mücadelesi, sihirbazlar olayı ve kıyamet sahneleri."
  },
  {
    id: 21,
    name: "Enbiyâ",
    meaning: "Peygamberler",
    verseCount: 112,
    description: "Peygamberlerin ortak mesajı olan tevhid ve kainatın yaratılışındaki düzen."
  },
  {
    id: 22,
    name: "Hac",
    meaning: "Hac İbadeti",
    verseCount: 78,
    description: "Hac ibadeti, kurban, kıyamet dehşeti ve Allah yolunda cihat."
  },
  {
    id: 23,
    name: "Mü'minûn",
    meaning: "İnananlar",
    verseCount: 118,
    description: "Kurtuluşa eren müminlerin özellikleri, insanın yaratılış evreleri ve ahiret."
  },
  {
    id: 24,
    name: "Nûr",
    meaning: "Işık, Nur",
    verseCount: 64,
    description: "Aile mahremiyeti, iffet, Nur ayeti ve toplumsal ahlak kuralları."
  },
  {
    id: 25,
    name: "Furkân",
    meaning: "Hakkı Batıldan Ayıran",
    verseCount: 77,
    description: "Kuran'ın vahiy oluşu, peygambere yöneltilen itirazlar ve Rahman'ın has kullarının özellikleri."
  },
  {
    id: 26,
    name: "Şu'arâ",
    meaning: "Şairler",
    verseCount: 227,
    description: "Peygamberlerin tebliğ mücadelesi ve inkar eden şairlerin yerilmesi."
  },
  {
    id: 27,
    name: "Neml",
    meaning: "Karınca",
    verseCount: 93,
    description: "Hz. Süleyman, Belkıs (Sebâ Melikesi) kıssası ve Kuran'ın hidayet rehberi oluşu."
  },
  {
    id: 28,
    name: "Kasas",
    meaning: "Kıssalar, Hikayeler",
    verseCount: 88,
    description: "Hz. Musa'nın çocukluğu ve gençliği, Karun'un akıbeti ve dünya malının geçiciliği."
  },
  {
    id: 29,
    name: "Ankebût",
    meaning: "Örümcek",
    verseCount: 69,
    description: "İman imtihanı, münafıklık ve putperestliğin örümcek ağı gibi çürük olması."
  },
  {
    id: 30,
    name: "Rûm",
    meaning: "Romalılar",
    verseCount: 60,
    description: "Rumların zaferi haberi, kainattaki deliller ve ahiret hayatının gerçekliği."
  },
  {
    id: 31,
    name: "Lokmân",
    meaning: "Lokman Hekim",
    verseCount: 34,
    description: "Hz. Lokman'ın oğluna öğütleri, şirkten sakınma ve ahlaki erdemler."
  },
  {
    id: 32,
    name: "Secde",
    meaning: "Secde Etmek",
    verseCount: 30,
    description: "Yaratılış, öldükten sonra diriliş ve müminlerin gece ibadetleri."
  },
  {
    id: 33,
    name: "Ahzâb",
    meaning: "Gruplar, Müttefikler",
    verseCount: 73,
    description: "Hendek Savaşı, Peygamberin ailesi, evlatlık müessesesi ve tesettür emri."
  },
  {
    id: 34,
    name: "Sebe'",
    meaning: "Sebe Halkı",
    verseCount: 54,
    description: "Sebe halkının nankörlüğü, Hz. Davud ve Süleyman'ın şükrü, kıyamet tartışmaları."
  },
  {
    id: 35,
    name: "Fâtır",
    meaning: "Yaratan",
    verseCount: 45,
    description: "Meleklerin yaratılışı, Allah'ın kudreti ve insanın acizliği."
  },
  {
    id: 36,
    name: "Yâsîn",
    meaning: "Yâ-Sîn Harfleri",
    verseCount: 83,
    description: "Kuran'ın kalbi; vahiy, peygamberlik, öldükten sonra diriliş ve kıyamet sahneleri."
  },
  {
    id: 37,
    name: "Sâffât",
    meaning: "Sıra Sıra Duranlar",
    verseCount: 182,
    description: "Melekler, cinler, Hz. İbrahim ve İsmail'in kurban imtihanı."
  },
  {
    id: 38,
    name: "Sâd",
    meaning: "Sâd Harfi",
    verseCount: 88,
    description: "Hz. Davud, Süleyman ve Eyyub'un sabrı; kibir ve şeytanın isyanı."
  },
  {
    id: 39,
    name: "Zümer",
    meaning: "Zümreler, Gruplar",
    verseCount: 75,
    description: "Tevhid, ihlas, ölüm anı ve insanların gruplar halinde cennet veya cehenneme sevki."
  },
  {
    id: 40,
    name: "Mü'min",
    meaning: "İnanan (Gâfir)",
    verseCount: 85,
    description: "Allah'ın bağışlayıcılığı, Firavun ailesindeki mümin adam ve duanın önemi."
  },
  {
    id: 41,
    name: "Fussilet",
    meaning: "Açıklanmış",
    verseCount: 54,
    description: "Kuran'ın açıklayıcılığı, insanın organlarının şahitliği ve doğruluk (istikamet)."
  },
  {
    id: 42,
    name: "Şûrâ",
    meaning: "Danışma",
    verseCount: 53,
    description: "İşlerin istişare ile yapılması, vahyin ortak kaynağı ve birliği."
  },
  {
    id: 43,
    name: "Zuhruf",
    meaning: "Altın, Süs",
    verseCount: 89,
    description: "Dünya hayatının geçici süsü, taklidin zararları ve Hz. İsa hakkında gerçekler."
  },
  {
    id: 44,
    name: "Duhân",
    meaning: "Duman",
    verseCount: 59,
    description: "Kıyamet alameti olarak duman, Kadir gecesi ve Firavun'un helakı."
  },
  {
    id: 45,
    name: "Câsiye",
    meaning: "Diz Çöken",
    verseCount: 37,
    description: "Kıyamet günü milletlerin diz çökerek hesap vermesi ve kibrin sonu."
  },
  {
    id: 46,
    name: "Ahkâf",
    meaning: "Kum Tepeleri",
    verseCount: 35,
    description: "Ad kavmi, cinlerin Kuran dinlemesi ve ana-baba hakkı."
  },
  {
    id: 47,
    name: "Muhammed",
    meaning: "Hz. Muhammed",
    verseCount: 38,
    description: "Savaş hükümleri, münafıkların tanınması ve amellerin boşa gitmesi."
  },
  {
    id: 48,
    name: "Fetih",
    meaning: "Fetih, Zafer",
    verseCount: 29,
    description: "Hudeybiye Barışı, fetih müjdesi ve Müslümanların birbirine merhameti."
  },
  {
    id: 49,
    name: "Hucurât",
    meaning: "Odalar",
    verseCount: 18,
    description: "Müslümanlar arası kardeşlik hukuku, gıybet, tecessüs ve ırkçılığın reddi."
  },
  {
    id: 50,
    name: "Kâf",
    meaning: "Kâf Harfi",
    verseCount: 45,
    description: "Ölüm, diriliş, insanın her sözünün kaydedilmesi ve cennet-cehennem tasviri."
  },
  {
    id: 51,
    name: "Zâriyât",
    meaning: "Rüzgarlar",
    verseCount: 60,
    description: "Rızık verenin Allah olduğu, cinlerin ve insanların kulluk için yaratıldığı."
  },
  {
    id: 52,
    name: "Tûr",
    meaning: "Tur Dağı",
    verseCount: 49,
    description: "İnkar edenlerin azabı, cennet nimetleri ve peygamberin kahin olmadığı."
  },
  {
    id: 53,
    name: "Necm",
    meaning: "Yıldız",
    verseCount: 62,
    description: "Vahyin kaynağı, Miraç hadisesi ve putların reddi."
  },
  {
    id: 54,
    name: "Kamer",
    meaning: "Ay",
    verseCount: 55,
    description: "Ayın yarılması mucizesi ve geçmiş kavimlerin 'Tadın azabımı' diye uyarılması."
  },
  {
    id: 55,
    name: "Rahmân",
    meaning: "Çok Merhametli",
    verseCount: 78,
    description: "Allah'ın sayısız nimetleri, 'Rabbinizin hangi nimetini yalanlarsınız?' uyarısı."
  },
  {
    id: 56,
    name: "Vâkıa",
    meaning: "Olay, Kıyamet",
    verseCount: 96,
    description: "Kıyamet koptuğunda insanların üç sınıfı: Öncüler, sağdakiler ve soldakiler."
  },
  {
    id: 57,
    name: "Hadîd",
    meaning: "Demir",
    verseCount: 29,
    description: "Allah'ın ilmi, infak, münafıkların durumu ve demirin indirilmesi."
  },
  {
    id: 58,
    name: "Mücâdele",
    meaning: "Tartışma",
    verseCount: 22,
    description: "Zıhar adeti, gizli konuşmalar ve Allah'ın her şeyi işitmesi."
  },
  {
    id: 59,
    name: "Haşr",
    meaning: "Toplanma",
    verseCount: 24,
    description: "Yahudi sürgünü, ganimet dağıtımı ve Allah'ın güzel isimleri (Esma-ül Hüsna)."
  },
  {
    id: 60,
    name: "Mümtehine",
    meaning: "İmtihan Edilen",
    verseCount: 13,
    description: "Müslümanların gayrimüslimlerle ilişkileri, dostluk ve düşmanlık ölçüleri."
  },
  {
    id: 61,
    name: "Saff",
    meaning: "Sıra, Saf",
    verseCount: 14,
    description: "Allah yolunda kenetlenmiş duvar gibi saf tutarak mücadele etmek."
  },
  {
    id: 62,
    name: "Cuma",
    meaning: "Cuma Günü",
    verseCount: 11,
    description: "Cuma namazının önemi, alışverişin bırakılması ve Yahudilerin iddiasının reddi."
  },
  {
    id: 63,
    name: "Münâfikûn",
    meaning: "İkiyüzlüler",
    verseCount: 11,
    description: "Münafıkların özellikleri, yalan yere yemin etmeleri ve içten pazarlıkları."
  },
  {
    id: 64,
    name: "Teğâbün",
    meaning: "Aldanma",
    verseCount: 18,
    description: "Kıyamet günü kimin kazandığının, kimin kaybettiğinin ortaya çıkması."
  },
  {
    id: 65,
    name: "Talâk",
    meaning: "Boşanma",
    verseCount: 12,
    description: "Boşanma hukuku, iddet süresi ve takva sahiplerine Allah'ın çıkış yolu göstermesi."
  },
  {
    id: 66,
    name: "Tahrîm",
    meaning: "Haram Kılma",
    verseCount: 12,
    description: "Peygamberin aile hayatı, sır saklama ve samimi tövbe (Tövbe-i Nasuh)."
  },
  {
    id: 67,
    name: "Mülk",
    meaning: "Hükümranlık",
    verseCount: 30,
    description: "Kainattaki nizam, hayatın ve ölümün imtihan için yaratılması (Tebareke)."
  },
  {
    id: 68,
    name: "Kalem",
    meaning: "Kalem",
    verseCount: 52,
    description: "Peygamberin yüksek ahlakı, bahçe sahipleri kıssası ve nazar."
  },
  {
    id: 69,
    name: "Hâkka",
    meaning: "Gerçekleşecek Olan",
    verseCount: 52,
    description: "Kıyametin dehşeti, amel defterlerinin verilmesi ve Kuran'ın ciddiyeti."
  },
  {
    id: 70,
    name: "Meâric",
    meaning: "Yükseliş Yolları",
    verseCount: 44,
    description: "Kıyamet gününün uzunluğu, insanın sabırsızlığı ve namaz kılanların özellikleri."
  },
  {
    id: 71,
    name: "Nûh",
    meaning: "Nuh Peygamber",
    verseCount: 28,
    description: "Hz. Nuh'un kavmini uyarışı, tufan ve inkar edenlerin helakı."
  },
  {
    id: 72,
    name: "Cin",
    meaning: "Cinler",
    verseCount: 28,
    description: "Cinlerin Kuran dinleyip iman etmeleri ve gaybı Allah'tan başkasının bilmemesi."
  },
  {
    id: 73,
    name: "Müzzemmil",
    meaning: "Örtünüp Bürünen",
    verseCount: 20,
    description: "Gece namazı, Kuran'ı tane tane okumak ve sabır tavsiyesi."
  },
  {
    id: 74,
    name: "Müddessir",
    meaning: "Gizlenen",
    verseCount: 56,
    description: "Tebliğ görevi, temizlik, cehennem (Sekar) tasviri ve inatçı inkarcılar."
  },
  {
    id: 75,
    name: "Kıyâme",
    meaning: "Kıyamet",
    verseCount: 40,
    description: "Ölüm anı, kemiklerin birleştirilmesi ve insanın başıboş bırakılmayacağı."
  },
  {
    id: 76,
    name: "İnsân",
    meaning: "İnsan",
    verseCount: 31,
    description: "İnsanın yaratılışı, iyilerin (Ebrar) cennetteki mükafatları ve fedakarlıkları."
  },
  {
    id: 77,
    name: "Mürselât",
    meaning: "Gönderilenler",
    verseCount: 50,
    description: "Kıyamet alametleri ve yalanlayanların o günkü perişan hali."
  },
  {
    id: 78,
    name: "Nebe'",
    meaning: "Haber",
    verseCount: 40,
    description: "Büyük haber (kıyamet), cehennem azabı ve cennet mükafatı (Amme cüzü başlangıcı)."
  },
  {
    id: 79,
    name: "Nâziât",
    meaning: "Söküp Çıkaranlar",
    verseCount: 46,
    description: "Can alan melekler, Firavun'un ibretlik sonu ve kıyamet saati."
  },
  {
    id: 80,
    name: "Abese",
    meaning: "Yüzünü Ekşitti",
    verseCount: 42,
    description: "Görme engelli sahabi, uyarının herkese yapılması ve kıyamette kaçış."
  },
  {
    id: 81,
    name: "Tekvîr",
    meaning: "Dürülme",
    verseCount: 29,
    description: "Güneşin dürülmesi, yıldızların dökülmesi ve diri diri gömülen kız çocukları."
  },
  {
    id: 82,
    name: "İnfitâr",
    meaning: "Yarılma",
    verseCount: 19,
    description: "Göklerin yarılması, yazıcı melekler ve insanın Rabbine karşı aldanışı."
  },
  {
    id: 83,
    name: "Mutaffifîn",
    meaning: "Ölçüde Hile Yapanlar",
    verseCount: 36,
    description: "Ticarette hile yapanlar, siccin (kötülerin kaydı) ve illiyyin (iyilerin kaydı)."
  },
  {
    id: 84,
    name: "İnşikâk",
    meaning: "Yarılma",
    verseCount: 25,
    description: "Kıyamet kopuşu ve amel defterinin sağdan veya arkadan verilmesi."
  },
  {
    id: 85,
    name: "Bürûc",
    meaning: "Burçlar",
    verseCount: 22,
    description: "Hendek ashabı (inananların yakılması) ve Allah'ın çetin yakalayışı."
  },
  {
    id: 86,
    name: "Târık",
    meaning: "Gece Gelen",
    verseCount: 17,
    description: "İnsanın neden yaratıldığına bakması ve göğün koruyuculuğu."
  },
  {
    id: 87,
    name: "A'lâ",
    meaning: "En Yüce",
    verseCount: 19,
    description: "Allah'ı tesbih etme, Kuran'ın kolaylaştırılması ve İbrahim'in sayfaları."
  },
  {
    id: 88,
    name: "Gâşiye",
    meaning: "Kuşatan",
    verseCount: 26,
    description: "Dehşetiyle her şeyi kuşatan kıyamet, cehennemdekiler ve cennettekiler."
  },
  {
    id: 89,
    name: "Fecr",
    meaning: "Tan Yeri",
    verseCount: 30,
    description: "Eski kavimlerin helakı, imtihan ve 'Ey huzura ermiş nefis' hitabı."
  },
  {
    id: 90,
    name: "Beled",
    meaning: "Şehir",
    verseCount: 20,
    description: "Mekke'ye yemin, insanı zorlukların kuşatması ve sarp yokuşu aşmak."
  },
  {
    id: 91,
    name: "Şems",
    meaning: "Güneş",
    verseCount: 15,
    description: "Nefsini arındıranın kurtuluşa ereceği, Semud kavminin azgınlığı."
  },
  {
    id: 92,
    name: "Leyl",
    meaning: "Gece",
    verseCount: 21,
    description: "Cömertlik yapanla cimrilik yapanın yollarının ayrılması."
  },
  {
    id: 93,
    name: "Duhâ",
    meaning: "Kuşluk Vakti",
    verseCount: 11,
    description: "Peygambere teselli, Rabbinin onu terk etmediği ve yetimi koruma emri."
  },
  {
    id: 94,
    name: "İnşirâh",
    meaning: "Genişleme",
    verseCount: 8,
    description: "Göğsün genişletilmesi, her zorlukla beraber bir kolaylığın olması."
  },
  {
    id: 95,
    name: "Tîn",
    meaning: "İncir",
    verseCount: 8,
    description: "İnsanın en güzel biçimde yaratılması (Ahsen-i Takvim) ve aşağıların aşağısına düşmesi."
  },
  {
    id: 96,
    name: "Alak",
    meaning: "Kan Pıhtısı",
    verseCount: 19,
    description: "İlk inen sure; 'Oku' emri, kalemin öğreticiliği ve nankör insan."
  },
  {
    id: 97,
    name: "Kadir",
    meaning: "Kadir Gecesi",
    verseCount: 5,
    description: "Bin aydan hayırlı olan Kadir Gecesi ve Kuran'ın indirilişi."
  },
  {
    id: 98,
    name: "Beyyine",
    meaning: "Delil",
    verseCount: 8,
    description: "Apaçık delil (Peygamber), ehli kitabın ayrılığa düşmesi ve ihlas."
  },
  {
    id: 99,
    name: "Zilzâl",
    meaning: "Deprem",
    verseCount: 8,
    description: "Yerin sarsılması ve zerre kadar hayrın veya şerrin karşılığının görülmesi."
  },
  {
    id: 100,
    name: "Âdiyât",
    meaning: "Koşan Atlar",
    verseCount: 11,
    description: "İnsanın Rabbine karşı nankörlüğü ve dünya malına düşkünlüğü."
  },
  {
    id: 101,
    name: "Kâria",
    meaning: "Vuran Felaket",
    verseCount: 11,
    description: "Kıyametin gürültüsü ve tartısı ağır veya hafif gelenler."
  },
  {
    id: 102,
    name: "Tekâsür",
    meaning: "Çoğaltma Yarışı",
    verseCount: 8,
    description: "Çoklukla övünmenin insanı oyalaması ve kabir ziyareti."
  },
  {
    id: 103,
    name: "Asr",
    meaning: "Zaman",
    verseCount: 3,
    description: "Zamana yemin ve insanın hüsranda olması (ancak iman edenler hariç)."
  },
  {
    id: 104,
    name: "Hümeze",
    meaning: "Arkadan Çekiştiren",
    verseCount: 9,
    description: "İnsanları alaya alan, mal biriktirip sayanların sonu (Hutame ateşi)."
  },
  {
    id: 105,
    name: "Fîl",
    meaning: "Fil",
    verseCount: 5,
    description: "Fil vakası, Kabe'yi yıkmaya gelen ordunun ebabil kuşlarıyla helakı."
  },
  {
    id: 106,
    name: "Kureyş",
    meaning: "Kureyş Kabilesi",
    verseCount: 4,
    description: "Kureyş'e verilen güven ve rızık nimeti için Allah'a kulluk etmeleri."
  },
  {
    id: 107,
    name: "Mâûn",
    meaning: "Yardım",
    verseCount: 7,
    description: "Dini yalanlayanlar, yetimi itip kakanlar ve gösteriş için namaz kılanlar."
  },
  {
    id: 108,
    name: "Kevser",
    meaning: "Bol Nimet",
    verseCount: 3,
    description: "Peygambere kevserin verilmesi, namaz kılıp kurban kesme emri."
  },
  {
    id: 109,
    name: "Kâfirûn",
    meaning: "İnkar Edenler",
    verseCount: 6,
    description: "İbadette şirk kabul etmeme, 'Sizin dininiz size, benim dinim bana'."
  },
  {
    id: 110,
    name: "Nasr",
    meaning: "Yardım",
    verseCount: 3,
    description: "Allah'ın yardımının gelmesi, insanların fevç fevç dine girmesi."
  },
  {
    id: 111,
    name: "Tebbet",
    meaning: "Kurumasın",
    verseCount: 5,
    description: "Ebu Leheb'in ve karısının Peygambere düşmanlıkları ve acı sonları."
  },
  {
    id: 112,
    name: "İhlâs",
    meaning: "Samimiyet",
    verseCount: 4,
    description: "Tevhid inancının temeli: Allah birdir, doğmamış ve doğurulmamıştır."
  },
  {
    id: 113,
    name: "Felâk",
    meaning: "Sabah",
    verseCount: 5,
    description: "Yaratılanların şerrinden, karanlığın ve hasetçinin şerrinden Allah'a sığınma."
  },
  {
    id: 114,
    name: "Nâziât",
    meaning: "İnsanlar",
    verseCount: 6,
    description: "İnsanların ve cinlerin vesvesesinden insanların Rabbine sığınma."
  }
];
