import { getProvinceExport } from './tradeData';
import { getProvinceOSB } from './osbData';
import { getWomenShare } from './womenTradeData';
import { getProvinceOverview } from './demographyData';

export type MapMetricType = 
  | 'export' 
  | 'women'
  | 'osb' 
  | 'osb_area'
  | 'osb_parsel'
  | 'osb_active'
  | 'population' 
  | 'gdp'
  | 'ses'
  | 'employment'
  | 'unemployment'
  | 'education'
  | 'hospital_beds'
  | 'clean_water'
  | 'waste_service';

export interface CatalogItem {
  id: MapMetricType;
  label: string;
  shortLabel: string;
  desc: string;
  unit: string;
  badge: string;
}

export interface CatalogCategory {
  name: string;
  icon: string;
  items: CatalogItem[];
}

export const METRIC_CATALOG: CatalogCategory[] = [
  {
    name: 'DIŞ TİCARET & KÜRESEL REKABET',
    icon: 'ship',
    items: [
      {
        id: 'export',
        label: 'Yıllık İhracat Hacmi',
        shortLabel: 'İHRACAT',
        desc: 'İl bazında 2025 resmi toplam ihracat tutarı',
        unit: '$ (Dolar)',
        badge: 'TİM / Ticaret Bak.'
      },
      {
        id: 'women',
        label: 'Kadın İhracatçı & Girişimci',
        shortLabel: 'KADIN PAYI %',
        desc: 'İhracatta kadın ortaklı/yönetimli firma payı',
        unit: '% Oran',
        badge: 'Kadın İstihdamı'
      }
    ]
  },
  {
    name: 'SANAYİ & OSB ALTYAPISI',
    icon: 'factory',
    items: [
      {
        id: 'osb',
        label: 'Toplam OSB Sayısı',
        shortLabel: 'OSB SAYISI',
        desc: 'Bakanlık tescilli organize sanayi bölgesi adedi',
        unit: 'Adet OSB',
        badge: 'OSBÜK / Sanayi Bak.'
      },
      {
        id: 'osb_area',
        label: 'Toplam OSB Alanı',
        shortLabel: 'OSB ALANI',
        desc: 'Organize sanayi bölgelerinin kapladığı toplam yüzölçümü',
        unit: 'Hektar (Ha)',
        badge: 'Sanayi Alanı'
      },
      {
        id: 'osb_parsel',
        label: 'Sanayi Parsel Sayısı',
        shortLabel: 'SANAYİ PARSELİ',
        desc: 'Üretime hazır ve tahsis edilmiş sanayi parselleri',
        unit: 'Parsel',
        badge: 'Üretim Parseli'
      },
      {
        id: 'osb_active',
        label: 'İşletmedeki Aktif OSB',
        shortLabel: 'AKTİF OSB',
        desc: 'Fabrikaların fiilen üretime geçtiği aktif OSB sayısı',
        unit: 'Aktif OSB',
        badge: 'Faal Üretim'
      }
    ]
  },
  {
    name: 'DEMOGRAFİ & ŞEHİRLEŞME',
    icon: 'users',
    items: [
      {
        id: 'population',
        label: 'Toplam İl Nüfusu',
        shortLabel: 'NÜFUS',
        desc: 'TÜİK Adrese Dayalı Nüfus Kayıt Sistemi (ADNKS)',
        unit: 'Kişi',
        badge: 'TÜİK ADNKS'
      }
    ]
  },
  {
    name: 'EKONOMİ, REFAH & KALKINMA',
    icon: 'trending-up',
    items: [
      {
        id: 'gdp',
        label: 'Kişi Başına GSYH',
        shortLabel: 'GSYH/KİŞİ',
        desc: 'Kişi başına düşen gayrisafi yurtiçi hasıla düzeyi',
        unit: '$ / Kişi',
        badge: 'TÜİK İl GSYH'
      },
      {
        id: 'ses',
        label: 'SEGE Gelişmişlik Endeksi',
        shortLabel: 'SEGE SKORU',
        desc: 'Sanayi ve Teknoloji Bakanlığı İllerin SEGE Skoru',
        unit: 'Endeks Puanı',
        badge: 'Kalkınma Ajansları'
      }
    ]
  },
  {
    name: 'İSTİHDAM & İŞGÜCÜ PİYASASI',
    icon: 'briefcase',
    items: [
      {
        id: 'employment',
        label: 'İstihdam Oranı',
        shortLabel: 'İSTİHDAM %',
        desc: '15+ yaş nüfusun çalışma hayatına katılım oranı',
        unit: '% Oran',
        badge: 'TÜİK İşgücü'
      },
      {
        id: 'unemployment',
        label: 'İşsizlik Oranı',
        shortLabel: 'İŞSİZLİK %',
        desc: 'İl bazında iş arayan kayıtlı işsizlik payı',
        unit: '% Oran',
        badge: 'TÜİK İşgücü'
      }
    ]
  },
  {
    name: 'EĞİTİM, SAĞLIK & YAŞAM KALİTESİ',
    icon: 'heart-pulse',
    items: [
      {
        id: 'education',
        label: 'Ortalama Eğitim Süresi',
        shortLabel: 'EĞİTİM YILI',
        desc: '25 yaş üzeri nüfusun ortalama tamamladığı eğitim yılı',
        unit: 'Yıl',
        badge: 'MEB / TÜİK'
      },
      {
        id: 'hospital_beds',
        label: '100K Kişiye Yatak Sayısı',
        shortLabel: 'HASTANE YATAĞI',
        desc: 'Sağlık Bakanlığı 100.000 nüfus başına düşen yatak kapasitesi',
        unit: 'Yatak / 100K',
        badge: 'Sağlık Bak.'
      },
      {
        id: 'clean_water',
        label: 'Şebeke Suyu Erişim Oranı',
        shortLabel: 'SU ERİŞİMİ %',
        desc: 'İçme ve kullanma şebeke suyuna erişen nüfus payı',
        unit: '% Oran',
        badge: 'Çevre & Şehircilik'
      },
      {
        id: 'waste_service',
        label: 'Belediye Atık Hizmeti',
        shortLabel: 'ATIK HİZMETİ %',
        desc: 'Düzenli belediye atık toplama hizmeti kapsama payı',
        unit: '% Oran',
        badge: 'Yerel Yönetimler'
      }
    ]
  }
];

// Pure function: calculate province metric without depending on React closures
export function computeProvinceMetric(code: string, metric: MapMetricType): number {
  const osb = getProvinceOSB(code);
  const dem = getProvinceOverview(code);

  switch (metric) {
    case 'export':
      return getProvinceExport(code, 3); // 2025
    case 'women':
      return getWomenShare(code, 7);
    case 'osb':
      return osb.count;
    case 'osb_area':
      return Math.round(osb.areaHa);
    case 'osb_parsel':
      return osb.parsels;
    case 'osb_active':
      return osb.isletmede;
    case 'population':
      return dem.population;
    case 'gdp':
      return dem.gdpPerCapitaUsd;
    case 'ses':
      return dem.sesScore;
    case 'employment':
      return dem.employmentRate;
    case 'unemployment':
      return dem.unemploymentRate;
    case 'education':
      return dem.avgEducationYears;
    case 'hospital_beds':
      return dem.hospitalBedsPer100k;
    case 'clean_water':
      return dem.cleanWaterPct;
    case 'waste_service':
      return dem.wasteServicePct;
    default:
      return getProvinceExport(code, 3);
  }
}

export function getCategoryLabel(metric: MapMetricType): string {
  switch (metric) {
    case 'export': return 'İhracat Hacmi';
    case 'women': return 'Kadın İhracat';
    case 'osb': return 'Sanayi Bölgesi';
    case 'osb_area': return 'OSB Alanı (Ha)';
    case 'osb_parsel': return 'Sanayi Parseli';
    case 'osb_active': return 'Aktif OSB';
    case 'population': return 'Toplam Nüfus';
    case 'gdp': return 'GSYH / Kişi';
    case 'ses': return 'SEGE Skoru';
    case 'employment': return 'İstihdam Oranı';
    case 'unemployment': return 'İşsizlik Oranı';
    case 'education': return 'Eğitim Süresi';
    case 'hospital_beds': return 'Hastane Yatağı';
    case 'clean_water': return 'Su Erişimi';
    case 'waste_service': return 'Atık Hizmeti';
    default: return 'Gösterge';
  }
}

export function formatMetricDisplay(metric: MapMetricType, val: number): string {
  switch (metric) {
    case 'export':
      if (val >= 1e9) return `$${(val / 1e9).toFixed(2)} Milyar`;
      if (val >= 1e6) return `$${(val / 1e6).toFixed(1)} Milyon`;
      return `$${val.toLocaleString('tr-TR')}`;
    case 'women':
      return `%${val.toFixed(1)} Kadın Payı`;
    case 'osb':
      return `${val} OSB Bölgesi`;
    case 'osb_area':
      return `${Math.round(val).toLocaleString('tr-TR')} Hektar`;
    case 'osb_parsel':
      return `${val.toLocaleString('tr-TR')} Parsel`;
    case 'osb_active':
      return `${val} Aktif OSB`;
    case 'population':
      if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M Kişi`;
      return `${(val / 1e3).toFixed(0)}K Kişi`;
    case 'gdp':
      return `$${val.toLocaleString('tr-TR')} GSYH`;
    case 'ses':
      return `${val.toFixed(1)} SEGE Skoru`;
    case 'employment':
      return `%${val.toFixed(1)} İstihdam`;
    case 'unemployment':
      return `%${val.toFixed(1)} İşsizlik`;
    case 'education':
      return `${val.toFixed(1)} Yıl Eğitim`;
    case 'hospital_beds':
      return `${val} Yatak / 100K`;
    case 'clean_water':
      return `%${val.toFixed(1)} Su Erişimi`;
    case 'waste_service':
      return `%${val.toFixed(1)} Atık Hizmeti`;
    default:
      return String(val);
  }
}

export function getMetricTitle(metric: MapMetricType): string {
  switch (metric) {
    case 'export': return 'İHRACAT LİDERLERİ';
    case 'women': return 'KADIN PAYI LİDERLERİ';
    case 'osb': return 'OSB SAYISI LİDERLERİ';
    case 'osb_area': return 'OSB ALANI LİDERLERİ';
    case 'osb_parsel': return 'SANAYİ PARSELİ LİDERLERİ';
    case 'osb_active': return 'AKTİF OSB LİDERLERİ';
    case 'population': return 'NÜFUS LİDERLERİ';
    case 'gdp': return 'GSYH / KİŞİ LİDERLERİ';
    case 'ses': return 'SEGE GELİŞMİŞLİK LİDERLERİ';
    case 'employment': return 'İSTİHDAM ORANI LİDERLERİ';
    case 'unemployment': return 'EN YÜKSEK İŞSİZLİK';
    case 'education': return 'EĞİTİM SÜRESİ LİDERLERİ';
    case 'hospital_beds': return 'HASTANE YATAĞI LİDERLERİ';
    case 'clean_water': return 'SU ERİŞİMİ LİDERLERİ';
    case 'waste_service': return 'ATIK HİZMETİ LİDERLERİ';
    default: return 'SIRALAMA';
  }
}
