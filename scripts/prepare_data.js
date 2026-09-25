const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, '../public/data');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Indicator catalog
const indicatorsCatalog = [
  { id: "DIS-TICARET-IHRACAT-USD", category: "Dış Ticaret", name: "Genel İhracat (USD)", unit: "$", icon: "TrendingUp", defaultYear: 2025 },
  { id: "DIS-TICARET-ITHALAT-USD", category: "Dış Ticaret", name: "Genel İthalat (USD)", unit: "$", icon: "TrendingDown", defaultYear: 2025 },
  { id: "FAALIYET-IHRACAT-USD", category: "Dış Ticaret", name: "Faaliyet İllerine Göre İhracat (USD)", unit: "$", icon: "Building", defaultYear: 2025 },
  { id: "KADIN-IHR-TOPLAM-IHRACAT", category: "Kadın İstihdamı & Dış Ticaret", name: "Firma Toplam İhracatı (USD)", unit: "$", icon: "Users", defaultYear: 2025 },
  { id: "KADIN-IHR-KADINLARIN-KATKISI", category: "Kadın İstihdamı & Dış Ticaret", name: "Kadınların İhracata Katkısı (USD)", unit: "$", icon: "Award", defaultYear: 2025 },
  { id: "KADIN-IHR-KADINLARIN-PAYI", category: "Kadın İstihdamı & Dış Ticaret", name: "Kadınların İhracattaki Payı (%)", unit: "%", icon: "Percent", defaultYear: 2025 },
  { id: "OSB-COUNT", category: "Sanayi & OSB", name: "Organize Sanayi Bölgesi Sayısı", unit: "Adet", icon: "Factory", defaultYear: 2024 },
  { id: "OSB-AREA-HA", category: "Sanayi & OSB", name: "Toplam OSB Alanı (Hektar)", unit: "ha", icon: "Maximize", defaultYear: 2024 },
  { id: "OSB-PARSELS", category: "Sanayi & OSB", name: "Toplam Sanayi Parseli", unit: "Parsel", icon: "Layers", defaultYear: 2024 },
  { id: "OSB-DURUM-ISLETMEDE", category: "Sanayi & OSB", name: "Faaliyetteki / İşletmede OSB", unit: "Adet", icon: "CheckCircle", defaultYear: 2024 }
];

fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(indicatorsCatalog, null, 2));
console.log('Catalog written successfully');
