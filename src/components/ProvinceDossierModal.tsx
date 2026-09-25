import React, { useState } from 'react';
import { X, Search, MapPin, Building, Users, Factory, Award, TrendingUp, Layers } from 'lucide-react';
import { PROVINCE_CODES, REGIONS } from '../data/regions';
import { getProvinceExport, EXPORT_USD_DATA } from '../data/tradeData';
import { getProvinceOSB } from '../data/osbData';
import { getWomenShare } from '../data/womenTradeData';
import { getProvinceOverview } from '../data/demographyData';

interface ProvinceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
}

export const ProvinceDossierModal: React.FC<ProvinceDossierModalProps> = ({
  isOpen,
  onClose,
  selectedProvinceCode,
  onSelectProvince
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const currentName = PROVINCE_CODES[selectedProvinceCode] || 'ADANA';
  const region = REGIONS.find((r) => r.provinces.some((p) => p.toLowerCase() === currentName.toLowerCase()));

  const exportVal = getProvinceExport(selectedProvinceCode, 3); // 2025
  const osb = getProvinceOSB(selectedProvinceCode);
  const womenShare = getWomenShare(selectedProvinceCode, 7);
  const stats = getProvinceOverview(selectedProvinceCode);

  // Filter 81 provinces for the search dropdown
  const filteredProvinces = Object.entries(PROVINCE_CODES).filter(([code, name]) => {
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || code.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#051126] border border-cyan-400/50 shadow-[0_0_35px_rgba(0,242,254,0.3)] rounded-sm flex flex-col overflow-hidden text-slate-100 font-['Rajdhani']">
        {/* Corner Angle Accents */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-400 z-10" />
        <span className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-400 z-10" />
        <span className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-cyan-400 z-10" />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-cyan-400 z-10" />

        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-[#092248] via-[#040e24] to-[#040e24] border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-4 bg-cyan-400 rounded-xs shadow-[0_0_8px_#00f2fe]" />
            <h2 className="text-lg font-bold font-['Orbitron'] tracking-wider text-white uppercase">
              {currentName} — İL PROFİLİ VE DETAY DOSYASI
            </h2>
            <span className="px-2 py-0.5 text-xs font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 rounded-xs">
              PLAKA: {selectedProvinceCode}
            </span>
            {region && (
              <span className="hidden sm:inline-block text-xs font-mono px-2 py-0.5 bg-slate-800 text-cyan-300 border border-slate-700 rounded-xs">
                {region.shortCode} ({region.level1Name})
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-cyan-500/20 text-cyan-300 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Province Quick Search Bar */}
        <div className="p-3 bg-[#030919] border-b border-cyan-500/15 flex items-center gap-2">
          <Search className="w-4 h-4 text-cyan-400 ml-2" />
          <input
            type="text"
            placeholder="81 İl arasında ara (Örn: Bursa, 16, İzmir, Ankara)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-sm text-cyan-200 placeholder-cyan-500/40 outline-none font-mono"
          />
        </div>

        {/* Search Results Drawer if user is typing */}
        {searchTerm && (
          <div className="max-h-40 overflow-y-auto bg-[#07193b] border-b border-cyan-500/20 p-2 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-1 text-xs">
            {filteredProvinces.slice(0, 16).map(([code, name]) => (
              <button
                key={code}
                onClick={() => {
                  onSelectProvince(code);
                  setSearchTerm('');
                }}
                className={`p-1.5 rounded-xs text-left font-semibold truncate transition-colors flex items-center justify-between ${
                  code === selectedProvinceCode 
                    ? 'bg-cyan-500 text-slate-950 font-bold' 
                    : 'text-cyan-200 hover:bg-cyan-900/50'
                }`}
              >
                <span>{name}</span>
                <span className="font-mono text-[10px] opacity-75">{code}</span>
              </button>
            ))}
          </div>
        )}

        {/* Modal Main Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
              <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                <span>2025 Yıllık İhracat</span>
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                ${(exportVal / 1e6).toFixed(1)}M
              </div>
              <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                ${exportVal.toLocaleString('tr-TR')}
              </div>
            </div>

            <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
              <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                <span>Organize Sanayi (OSB)</span>
                <Factory className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                {osb.count} <span className="text-xs text-cyan-300 font-normal">Bölge</span>
              </div>
              <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                {osb.areaHa.toLocaleString('tr-TR')} Hektar Alan
              </div>
            </div>

            <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
              <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                <span>Kadın İhracat Payı</span>
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                %{womenShare.toFixed(1)}
              </div>
              <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                Kadın İstihdam & Yönetim Payı
              </div>
            </div>

            <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
              <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                <span>Kişi Başı GSYH</span>
                <Users className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                ${stats.gdpPerCapitaUsd.toLocaleString('tr-TR')}
              </div>
              <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                Nüfus: {stats.population.toLocaleString('tr-TR')}
              </div>
            </div>
          </div>

          {/* OSB Breakdown Detail Table */}
          <div className="bg-[#061736]/70 border border-cyan-500/20 p-4 rounded-xs">
            <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Sanayi Bölgeleri (OSB) Fiili Durum ve Tür Dağılımı
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                <span className="text-slate-400 block mb-1">Toplam Parsel Sayısı</span>
                <span className="font-['Orbitron'] text-base font-bold text-cyan-200">{osb.parsels}</span>
              </div>
              <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                <span className="text-slate-400 block mb-1">Faaliyetteki / İşletmede</span>
                <span className="font-['Orbitron'] text-base font-bold text-emerald-400">{osb.isletmede} OSB</span>
              </div>
              <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                <span className="text-slate-400 block mb-1">Altyapı & Planlama</span>
                <span className="font-['Orbitron'] text-base font-bold text-cyan-300">{osb.altyapi + osb.planlama} OSB</span>
              </div>
              <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                <span className="text-slate-400 block mb-1">Karma / İhtisas / TDİ</span>
                <span className="font-['Orbitron'] text-base font-bold text-amber-300">
                  {osb.karma} / {osb.ihtisas} / {osb.tdiosb}
                </span>
              </div>
            </div>
          </div>

          {/* Demographics & Public Infrastructure Indicators */}
          <div className="bg-[#061736]/70 border border-cyan-500/20 p-4 rounded-xs">
            <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-cyan-400" />
              Sosyo-Demografik ve Altyapı Göstergeleri
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                <span className="text-slate-400 block text-[11px]">İstihdam Oranı</span>
                <span className="font-mono text-sm font-bold text-white">%{stats.employmentRate}</span>
              </div>
              <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                <span className="text-slate-400 block text-[11px]">İşsizlik Oranı</span>
                <span className="font-mono text-sm font-bold text-rose-400">%{stats.unemploymentRate}</span>
              </div>
              <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                <span className="text-slate-400 block text-[11px]">Ort. Eğitim Süresi</span>
                <span className="font-mono text-sm font-bold text-white">{stats.avgEducationYears} Yıl</span>
              </div>
              <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                <span className="text-slate-400 block text-[11px]">SES Seviye Skoru</span>
                <span className="font-mono text-sm font-bold text-cyan-300">{stats.sesScore} / 100</span>
              </div>
              <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                <span className="text-slate-400 block text-[11px]">Hastane Yatak / 100k</span>
                <span className="font-mono text-sm font-bold text-white">{stats.hospitalBedsPer100k} Yatak</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer with Action */}
        <div className="px-5 py-3 bg-[#030919] border-t border-cyan-500/20 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Kaynaklar: TÜİK Dış Ticaret · OSBÜK · Sanayi ve Teknoloji Bakanlığı
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xs bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors uppercase tracking-wider"
          >
            Tamam / Paneli İncele
          </button>
        </div>
      </div>
    </div>
  );
};
