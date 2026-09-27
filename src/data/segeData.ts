// T.C. Sanayi ve Teknoloji Bakanlığı İl SEGE Sıralamaları (2011, 2017, 2025)
// Kaynak: T.C. Sanayi ve Teknoloji Bakanlığı, Kalkınma Ajansları Genel Müdürlüğü
// İllerin ve Bölgelerin Sosyo-Ekonomik Gelişmişlik Sıralaması Araştırması (İl SEGE-2025)

export interface ProvinceSegeRecord {
  il: string;
  siralamalar: {
    "2011": number;
    "2017": number;
    "2025": number;
  };
}

export const SEGE_PROVINCES: ProvinceSegeRecord[] = [
  { il: "Adana", siralamalar: { "2011": 16, "2017": 27, "2025": 22 } },
  { il: "Adıyaman", siralamalar: { "2011": 66, "2017": 66, "2025": 69 } },
  { il: "Afyonkarahisar", siralamalar: { "2011": 43, "2017": 41, "2025": 42 } },
  { il: "Aksaray", siralamalar: { "2011": 55, "2017": 51, "2025": 48 } },
  { il: "Amasya", siralamalar: { "2011": 37, "2017": 38, "2025": 39 } },
  { il: "Ankara", siralamalar: { "2011": 2, "2017": 2, "2025": 2 } },
  { il: "Antalya", siralamalar: { "2011": 5, "2017": 5, "2025": 5 } },
  { il: "Ardahan", siralamalar: { "2011": 71, "2017": 67, "2025": 68 } },
  { il: "Artvin", siralamalar: { "2011": 44, "2017": 49, "2025": 41 } },
  { il: "Aydın", siralamalar: { "2011": 19, "2017": 15, "2025": 21 } },
  { il: "Ağrı", siralamalar: { "2011": 79, "2017": 80, "2025": 81 } },
  { il: "Balıkesir", siralamalar: { "2011": 22, "2017": 24, "2025": 18 } },
  { il: "Bartın", siralamalar: { "2011": 48, "2017": 46, "2025": 56 } },
  { il: "Batman", siralamalar: { "2011": 70, "2017": 72, "2025": 67 } },
  { il: "Bayburt", siralamalar: { "2011": 64, "2017": 65, "2025": 62 } },
  { il: "Bilecik", siralamalar: { "2011": 27, "2017": 19, "2025": 26 } },
  { il: "Bingöl", siralamalar: { "2011": 72, "2017": 71, "2025": 70 } },
  { il: "Bitlis", siralamalar: { "2011": 76, "2017": 76, "2025": 75 } },
  { il: "Bolu", siralamalar: { "2011": 11, "2017": 13, "2025": 16 } },
  { il: "Burdur", siralamalar: { "2011": 26, "2017": 32, "2025": 35 } },
  { il: "Bursa", siralamalar: { "2011": 6, "2017": 6, "2025": 6 } },
  { il: "Çanakkale", siralamalar: { "2011": 14, "2017": 20, "2025": 15 } },
  { il: "Çankırı", siralamalar: { "2011": 54, "2017": 55, "2025": 53 } },
  { il: "Çorum", siralamalar: { "2011": 50, "2017": 50, "2025": 43 } },
  { il: "Denizli", siralamalar: { "2011": 10, "2017": 10, "2025": 11 } },
  { il: "Diyarbakır", siralamalar: { "2011": 67, "2017": 68, "2025": 66 } },
  { il: "Düzce", siralamalar: { "2011": 35, "2017": 34, "2025": 29 } },
  { il: "Edirne", siralamalar: { "2011": 12, "2017": 21, "2025": 19 } },
  { il: "Elazığ", siralamalar: { "2011": 39, "2017": 42, "2025": 47 } },
  { il: "Erzincan", siralamalar: { "2011": 45, "2017": 47, "2025": 46 } },
  { il: "Erzurum", siralamalar: { "2011": 59, "2017": 61, "2025": 55 } },
  { il: "Eskişehir", siralamalar: { "2011": 7, "2017": 7, "2025": 7 } },
  { il: "Gaziantep", siralamalar: { "2011": 30, "2017": 30, "2025": 30 } },
  { il: "Giresun", siralamalar: { "2011": 52, "2017": 53, "2025": 51 } },
  { il: "Gümüşhane", siralamalar: { "2011": 62, "2017": 64, "2025": 65 } },
  { il: "Hakkâri", siralamalar: { "2011": 80, "2017": 78, "2025": 77 } },
  { il: "Hatay", siralamalar: { "2011": 46, "2017": 39, "2025": 50 } },
  { il: "Isparta", siralamalar: { "2011": 21, "2017": 16, "2025": 25 } },
  { il: "İstanbul", siralamalar: { "2011": 1, "2017": 1, "2025": 1 } },
  { il: "İzmir", siralamalar: { "2011": 3, "2017": 3, "2025": 3 } },
  { il: "Iğdır", siralamalar: { "2011": 69, "2017": 70, "2025": 73 } },
  { il: "Kahramanmaraş", siralamalar: { "2011": 60, "2017": 58, "2025": 63 } },
  { il: "Karabük", siralamalar: { "2011": 28, "2017": 22, "2025": 28 } },
  { il: "Karaman", siralamalar: { "2011": 32, "2017": 35, "2025": 36 } },
  { il: "Kars", siralamalar: { "2011": 68, "2017": 69, "2025": 71 } },
  { il: "Kastamonu", siralamalar: { "2011": 47, "2017": 48, "2025": 49 } },
  { il: "Kayseri", siralamalar: { "2011": 17, "2017": 17, "2025": 17 } },
  { il: "Kilis", siralamalar: { "2011": 63, "2017": 62, "2025": 52 } },
  { il: "Kocaeli", siralamalar: { "2011": 4, "2017": 4, "2025": 4 } },
  { il: "Konya", siralamalar: { "2011": 20, "2017": 14, "2025": 14 } },
  { il: "Kütahya", siralamalar: { "2011": 38, "2017": 37, "2025": 31 } },
  { il: "Kırklareli", siralamalar: { "2011": 15, "2017": 18, "2025": 23 } },
  { il: "Kırıkkale", siralamalar: { "2011": 41, "2017": 33, "2025": 38 } },
  { il: "Kırşehir", siralamalar: { "2011": 40, "2017": 43, "2025": 40 } },
  { il: "Malatya", siralamalar: { "2011": 42, "2017": 44, "2025": 44 } },
  { il: "Manisa", siralamalar: { "2011": 23, "2017": 23, "2025": 20 } },
  { il: "Mardin", siralamalar: { "2011": 74, "2017": 74, "2025": 72 } },
  { il: "Mersin", siralamalar: { "2011": 24, "2017": 25, "2025": 13 } },
  { il: "Muğla", siralamalar: { "2011": 8, "2017": 8, "2025": 8 } },
  { il: "Muş", siralamalar: { "2011": 81, "2017": 79, "2025": 80 } },
  { il: "Nevşehir", siralamalar: { "2011": 36, "2017": 40, "2025": 33 } },
  { il: "Niğde", siralamalar: { "2011": 56, "2017": 57, "2025": 60 } },
  { il: "Ordu", siralamalar: { "2011": 61, "2017": 60, "2025": 54 } },
  { il: "Osmaniye", siralamalar: { "2011": 53, "2017": 54, "2025": 57 } },
  { il: "Rize", siralamalar: { "2011": 34, "2017": 36, "2025": 32 } },
  { il: "Sakarya", siralamalar: { "2011": 18, "2017": 11, "2025": 12 } },
  { il: "Samsun", siralamalar: { "2011": 33, "2017": 31, "2025": 27 } },
  { il: "Şanlıurfa", siralamalar: { "2011": 73, "2017": 73, "2025": 79 } },
  { il: "Siirt", siralamalar: { "2011": 77, "2017": 75, "2025": 76 } },
  { il: "Sinop", siralamalar: { "2011": 51, "2017": 52, "2025": 59 } },
  { il: "Sivas", siralamalar: { "2011": 49, "2017": 45, "2025": 45 } },
  { il: "Şırnak", siralamalar: { "2011": 78, "2017": 81, "2025": 78 } },
  { il: "Tekirdağ", siralamalar: { "2011": 9, "2017": 9, "2025": 10 } },
  { il: "Tokat", siralamalar: { "2011": 57, "2017": 56, "2025": 61 } },
  { il: "Trabzon", siralamalar: { "2011": 31, "2017": 26, "2025": 24 } },
  { il: "Tunceli", siralamalar: { "2011": 58, "2017": 59, "2025": 58 } },
  { il: "Uşak", siralamalar: { "2011": 25, "2017": 29, "2025": 34 } },
  { il: "Van", siralamalar: { "2011": 75, "2017": 77, "2025": 74 } },
  { il: "Yalova", siralamalar: { "2011": 13, "2017": 12, "2025": 9 } },
  { il: "Yozgat", siralamalar: { "2011": 65, "2017": 63, "2025": 64 } },
  { il: "Zonguldak", siralamalar: { "2011": 29, "2017": 28, "2025": 37 } }
];

// Normalize Turkish characters for case-insensitive matching
function normalizeCityName(name: string): string {
  return name
    .trim()
    .replace(/İ/g, 'i')
    .replace(/I/g, 'ı')
    .replace(/ı/g, 'i')
    .replace(/â/g, 'a')
    .replace(/Â/g, 'a')
    .toLowerCase();
}

// Map from normalized province name to SEGE record
const SEGE_BY_NAME = new Map<string, ProvinceSegeRecord>();
SEGE_PROVINCES.forEach((p) => {
  SEGE_BY_NAME.set(normalizeCityName(p.il), p);
});

// Plate code to SEGE record lookup
import { PROVINCE_CODES } from './regions';

const SEGE_BY_CODE = new Map<string, ProvinceSegeRecord>();
Object.entries(PROVINCE_CODES).forEach(([code, name]) => {
  const norm = normalizeCityName(name);
  const rec = SEGE_BY_NAME.get(norm);
  if (rec) {
    SEGE_BY_CODE.set(code, rec);
  }
});

/**
 * Belirtilen ilin SEGE sıralamasını döner (Varsayılan güncel 2025)
 * @param code İl plaka kodu ("1" - "81")
 * @param year Sıralama yılı (2025, 2017, 2011)
 * @returns 1 (En gelişmiş) ile 81 (En az gelişmiş) arası resmi sıralama
 */
export function getProvinceSegeRank(code: string, year: '2025' | '2017' | '2011' = '2025'): number {
  const normCode = String(parseInt(code, 10) || 1);
  const rec = SEGE_BY_CODE.get(normCode);
  if (rec && rec.siralamalar[year]) {
    return rec.siralamalar[year];
  }
  return 40; // Fallback median
}

/**
 * Belirtilen ilin 2011, 2017 ve 2025 SEGE sıralama geçmişini döner
 */
export function getProvinceSegeHistory(code: string): { '2011': number; '2017': number; '2025': number } | null {
  const normCode = String(parseInt(code, 10) || 1);
  const rec = SEGE_BY_CODE.get(normCode);
  return rec ? rec.siralamalar : null;
}
