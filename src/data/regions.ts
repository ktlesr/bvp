export interface RegionAgency {
  code: string;
  level1: string;
  level1Name: string;
  agency: string;
  shortCode: string;
  provinces: string[];
}

export const REGIONS: RegionAgency[] = [
  { code: "TR10", level1: "TR1 İstanbul", level1Name: "İstanbul", agency: "İstanbul Kalkınma Ajansı", shortCode: "İSTKA", provinces: ["İstanbul"] },
  { code: "TR21", level1: "TR2 Batı Marmara", level1Name: "Batı Marmara", agency: "Trakya Kalkınma Ajansı", shortCode: "TRAKYAKA", provinces: ["Tekirdağ", "Edirne", "Kırklareli"] },
  { code: "TR22", level1: "TR2 Batı Marmara", level1Name: "Batı Marmara", agency: "Güney Marmara Kalkınma Ajansı", shortCode: "GMKA", provinces: ["Balıkesir", "Çanakkale"] },
  { code: "TR31", level1: "TR3 Ege", level1Name: "Ege", agency: "İzmir Kalkınma Ajansı", shortCode: "İZKA", provinces: ["İzmir"] },
  { code: "TR32", level1: "TR3 Ege", level1Name: "Ege", agency: "Güney Ege Kalkınma Ajansı", shortCode: "GEKA", provinces: ["Aydın", "Denizli", "Muğla"] },
  { code: "TR33", level1: "TR3 Ege", level1Name: "Ege", agency: "Zafer Kalkınma Ajansı", shortCode: "ZAFER", provinces: ["Afyonkarahisar", "Kütahya", "Manisa", "Uşak"] },
  { code: "TR41", level1: "TR4 Doğu Marmara", level1Name: "Doğu Marmara", agency: "Bursa Eskişehir Bilecik Kalkınma Ajansı", shortCode: "BEBKA", provinces: ["Bursa", "Eskişehir", "Bilecik"] },
  { code: "TR42", level1: "TR4 Doğu Marmara", level1Name: "Doğu Marmara", agency: "Doğu Marmara Kalkınma Ajansı", shortCode: "MARKA", provinces: ["Kocaeli", "Sakarya", "Düzce", "Bolu", "Yalova"] },
  { code: "TR51", level1: "TR5 Batı Anadolu", level1Name: "Batı Anadolu", agency: "Ankara Kalkınma Ajansı", shortCode: "ANKARAKA", provinces: ["Ankara"] },
  { code: "TR52", level1: "TR5 Batı Anadolu", level1Name: "Batı Anadolu", agency: "Mevlana Kalkınma Ajansı", shortCode: "MEVKA", provinces: ["Konya", "Karaman"] },
  { code: "TR61", level1: "TR6 Akdeniz", level1Name: "Akdeniz", agency: "Batı Akdeniz Kalkınma Ajansı", shortCode: "BAKA", provinces: ["Antalya", "Isparta", "Burdur"] },
  { code: "TR62", level1: "TR6 Akdeniz", level1Name: "Akdeniz", agency: "Çukurova Kalkınma Ajansı", shortCode: "ÇKA", provinces: ["Adana", "Mersin"] },
  { code: "TR63", level1: "TR6 Akdeniz", level1Name: "Akdeniz", agency: "Doğu Akdeniz Kalkınma Ajansı", shortCode: "DOĞAKA", provinces: ["Hatay", "Kahramanmaraş", "Osmaniye"] },
  { code: "TR71", level1: "TR7 Orta Anadolu", level1Name: "Orta Anadolu", agency: "Ahiler Kalkınma Ajansı", shortCode: "AHİKA", provinces: ["Kırıkkale", "Aksaray", "Niğde", "Nevşehir", "Kırşehir"] },
  { code: "TR72", level1: "TR7 Orta Anadolu", level1Name: "Orta Anadolu", agency: "Orta Anadolu Kalkınma Ajansı", shortCode: "ORAN", provinces: ["Kayseri", "Sivas", "Yozgat"] },
  { code: "TR81", level1: "TR8 Batı Karadeniz", level1Name: "Batı Karadeniz", agency: "Batı Karadeniz Kalkınma Ajansı", shortCode: "BAKKA", provinces: ["Zonguldak", "Karabük", "Bartın"] },
  { code: "TR82", level1: "TR8 Batı Karadeniz", level1Name: "Batı Karadeniz", agency: "Kuzey Anadolu Kalkınma Ajansı", shortCode: "KUZKA", provinces: ["Kastamonu", "Çankırı", "Sinop"] },
  { code: "TR83", level1: "TR8 Batı Karadeniz", level1Name: "Batı Karadeniz", agency: "Orta Karadeniz Kalkınma Ajansı", shortCode: "OKA", provinces: ["Samsun", "Tokat", "Çorum", "Amasya"] },
  { code: "TR90", level1: "TR9 Doğu Karadeniz", level1Name: "Doğu Karadeniz", agency: "Doğu Karadeniz Kalkınma Ajansı", shortCode: "DOKA", provinces: ["Trabzon", "Ordu", "Giresun", "Rize", "Artvin", "Gümüşhane"] },
  { code: "TRA1", level1: "TRA Kuzeydoğu Anadolu", level1Name: "TRA Kuzeydoğu Anadolu", agency: "Kuzeydoğu Anadolu Kalkınma Ajansı", shortCode: "KUDAKA", provinces: ["Erzurum", "Erzincan", "Bayburt"] },
  { code: "TRA2", level1: "TRA Kuzeydoğu Anadolu", level1Name: "TRA Kuzeydoğu Anadolu", agency: "Serhat Kalkınma Ajansı", shortCode: "SERKA", provinces: ["Kars", "Ağrı", "Iğdır", "Ardahan"] },
  { code: "TRB1", level1: "TRB Ortadoğu Anadolu", level1Name: "TRB Ortadoğu Anadolu", agency: "Fırat Kalkınma Ajansı", shortCode: "FKA", provinces: ["Malatya", "Elazığ", "Bingöl", "Tunceli"] },
  { code: "TRB2", level1: "TRB Ortadoğu Anadolu", level1Name: "TRB Ortadoğu Anadolu", agency: "Doğu Anadolu Kalkınma Ajansı", shortCode: "DAKA", provinces: ["Van", "Muş", "Bitlis", "Hakkâri"] },
  { code: "TRC1", level1: "TRC Güneydoğu Anadolu", level1Name: "TRC Güneydoğu Anadolu", agency: "İpekyolu Kalkınma Ajansı", shortCode: "İKA", provinces: ["Gaziantep", "Adıyaman", "Kilis"] },
  { code: "TRC2", level1: "TRC Güneydoğu Anadolu", level1Name: "TRC Güneydoğu Anadolu", agency: "Karacadağ Kalkınma Ajansı", shortCode: "KARACADAĞ", provinces: ["Şanlıurfa", "Diyarbakır"] },
  { code: "TRC3", level1: "TRC Güneydoğu Anadolu", level1Name: "TRC Güneydoğu Anadolu", agency: "Dicle Kalkınma Ajansı", shortCode: "DİKA", provinces: ["Mardin", "Batman", "Şırnak", "Siirt"] },
];

export const PROVINCE_CODES: Record<string, string> = {
  "1": "Adana", "2": "Adıyaman", "3": "Afyonkarahisar", "4": "Ağrı", "5": "Amasya", "6": "Ankara", "7": "Antalya", "8": "Artvin", "9": "Aydın", "10": "Balıkesir",
  "11": "Bilecik", "12": "Bingöl", "13": "Bitlis", "14": "Bolu", "15": "Burdur", "16": "Bursa", "17": "Çanakkale", "18": "Çankırı", "19": "Çorum", "20": "Denizli",
  "21": "Diyarbakır", "22": "Edirne", "23": "Elazığ", "24": "Erzincan", "25": "Erzurum", "26": "Eskişehir", "27": "Gaziantep", "28": "Giresun", "29": "Gümüşhane", "30": "Hakkâri",
  "31": "Hatay", "32": "Isparta", "33": "Mersin", "34": "İstanbul", "35": "İzmir", "36": "Kars", "37": "Kastamonu", "38": "Kayseri", "39": "Kırklareli", "40": "Kırşehir",
  "41": "Kocaeli", "42": "Konya", "43": "Kütahya", "44": "Malatya", "45": "Manisa", "46": "Kahramanmaraş", "47": "Mardin", "48": "Muğla", "49": "Muş", "50": "Nevşehir",
  "51": "Niğde", "52": "Ordu", "53": "Rize", "54": "Sakarya", "55": "Samsun", "56": "Siirt", "57": "Sinop", "58": "Sivas", "59": "Tekirdağ", "60": "Tokat",
  "61": "Trabzon", "62": "Tunceli", "63": "Şanlıurfa", "64": "Uşak", "65": "Van", "66": "Yozgat", "67": "Zonguldak", "68": "Aksaray", "69": "Bayburt", "70": "Karaman",
  "71": "Kırıkkale", "72": "Batman", "73": "Şırnak", "74": "Bartın", "75": "Ardahan", "76": "Iğdır", "77": "Yalova", "78": "Karabük", "79": "Kilis", "80": "Osmaniye", "81": "Düzce"
};

export const PROVINCE_TO_CODE: Record<string, string> = Object.entries(PROVINCE_CODES).reduce(
  (acc, [code, name]) => {
    acc[name] = code;
    return acc;
  },
  {} as Record<string, string>
);
