import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Search, 
  MapPin, 
  Building, 
  Users, 
  Factory, 
  Award, 
  TrendingUp, 
  Layers, 
  Globe, 
  ChevronRight, 
  ArrowRight, 
  Briefcase, 
  HeartPulse, 
  Droplets, 
  BarChart3,
  Sparkles,
  Check
} from 'lucide-react';
import { 
  PROVINCE_CODES, 
  PROVINCE_TO_CODE, 
  REGIONS, 
  REGION_CODES, 
  getRegionByCode, 
  getRegionForProvince,
  RegionAgency 
} from '../data/regions';
import { getProvinceExport } from '../data/tradeData';
import { getProvinceOSB, ProvinceOSB } from '../data/osbData';
import { getWomenShare } from '../data/womenTradeData';
import { getProvinceOverview, ProvinceOverview } from '../data/demographyData';
import { computeProvinceMetric, computeRegionMetric } from '../data/metricCatalog';

interface ProvinceDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
  selectedRegionCode?: string;
  onSelectRegion?: (code: string) => void;
  mapLevel?: 'province' | 'region';
  onMapLevelChange?: (level: 'province' | 'region') => void;
}

export const ProvinceDossierModal: React.FC<ProvinceDossierModalProps> = ({
  isOpen,
  onClose,
  selectedProvinceCode,
  onSelectProvince,
  selectedRegionCode,
  onSelectRegion,
  mapLevel = 'province',
  onMapLevelChange
}) => {
  // Modal active view tab: 'region' (26 İBBS-2 Bölge Karnesi) or 'province' (81 İl Karnesi)
  const [activeTab, setActiveTab] = useState<'province' | 'region'>(mapLevel);
  const [searchTerm, setSearchTerm] = useState('');

  // Sync active tab whenever the modal opens or mapLevel changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(mapLevel);
      setSearchTerm('');
    }
  }, [isOpen, mapLevel]);

  // Active province details
  const currentProvinceName = PROVINCE_CODES[selectedProvinceCode] || 'ADANA';
  const provinceRegion = getRegionForProvince(selectedProvinceCode) || REGIONS[0];

  // Active region details
  const currentRegionCode = selectedRegionCode || provinceRegion.code || 'TR10';
  const activeRegion = getRegionByCode(currentRegionCode) || provinceRegion;

  // --- REGIONAL AGGREGATION COMPUTATION ---
  const regionalData = useMemo(() => {
    const reg = activeRegion;
    const pCodes = reg.provinces.map((p) => PROVINCE_TO_CODE[p]).filter(Boolean);

    let totalExport = 0;
    let totalPopulation = 0;
    let totalAreaHa = 0;
    let totalParsels = 0;
    let totalKarma = 0;
    let totalIhtisas = 0;
    let totalTdi = 0;
    let totalIsletmede = 0;
    let totalPlanlama = 0;
    let totalAltyapi = 0;
    let totalKamulastirma = 0;
    let totalOsbCount = 0;

    const provincesList = pCodes.map((code) => {
      const name = PROVINCE_CODES[code];
      const exp = getProvinceExport(code, 3); // 2025
      const osb = getProvinceOSB(code);
      const wShare = getWomenShare(code, 7);
      const dem = getProvinceOverview(code);

      totalExport += exp;
      totalPopulation += dem.population;
      totalAreaHa += osb.areaHa;
      totalParsels += osb.parsels;
      totalKarma += osb.karma;
      totalIhtisas += osb.ihtisas;
      totalTdi += osb.tdiosb;
      totalIsletmede += osb.isletmede;
      totalPlanlama += osb.planlama;
      totalAltyapi += osb.altyapi;
      totalKamulastirma += osb.kamulastirma;
      totalOsbCount += osb.count;

      return {
        code,
        name,
        export: exp,
        osb,
        womenShare: wShare,
        overview: dem
      };
    });

    // Population-weighted demographic & quality-of-life indicators
    let weightedGdp = 0;
    let weightedEmployment = 0;
    let weightedUnemployment = 0;
    let weightedEducation = 0;
    let weightedSes = 0;
    let weightedHospitalBeds = 0;
    let weightedCleanWater = 0;
    let weightedWasteService = 0;
    let weightedWomen = 0;

    provincesList.forEach((p) => {
      const popWeight = totalPopulation > 0 ? p.overview.population / totalPopulation : 1 / provincesList.length;
      weightedGdp += p.overview.gdpPerCapitaUsd * popWeight;
      weightedEmployment += p.overview.employmentRate * popWeight;
      weightedUnemployment += p.overview.unemploymentRate * popWeight;
      weightedEducation += p.overview.avgEducationYears * popWeight;
      weightedSes += p.overview.sesScore * popWeight;
      weightedHospitalBeds += p.overview.hospitalBedsPer100k * popWeight;
      weightedCleanWater += p.overview.cleanWaterPct * popWeight;
      weightedWasteService += p.overview.wasteServicePct * popWeight;

      const expWeight = totalExport > 0 ? p.export / totalExport : 1 / provincesList.length;
      weightedWomen += p.womenShare * expWeight;
    });

    return {
      region: reg,
      provinces: provincesList,
      totalExport,
      totalPopulation,
      totalOsb: {
        count: totalOsbCount,
        areaHa: Math.round(totalAreaHa),
        parsels: totalParsels,
        karma: totalKarma,
        ihtisas: totalIhtisas,
        tdiosb: totalTdi,
        isletmede: totalIsletmede,
        planlama: totalPlanlama,
        altyapi: totalAltyapi,
        kamulastirma: totalKamulastirma
      },
      womenShare: weightedWomen,
      overview: {
        population: totalPopulation,
        gdpPerCapitaUsd: Math.round(weightedGdp),
        employmentRate: Number(weightedEmployment.toFixed(1)),
        unemploymentRate: Number(weightedUnemployment.toFixed(1)),
        avgEducationYears: Number(weightedEducation.toFixed(1)),
        sesScore: Number(weightedSes.toFixed(1)),
        hospitalBedsPer100k: Math.round(weightedHospitalBeds),
        cleanWaterPct: Number(weightedCleanWater.toFixed(1)),
        wasteServicePct: Number(weightedWasteService.toFixed(1))
      }
    };
  }, [activeRegion]);

  // Province-level individual metrics
  const provExportVal = getProvinceExport(selectedProvinceCode, 3); // 2025
  const provOsb = getProvinceOSB(selectedProvinceCode);
  const provWomenShare = getWomenShare(selectedProvinceCode, 7);
  const provStats = getProvinceOverview(selectedProvinceCode);

  // Filter 81 provinces for the search dropdown
  const filteredProvinces = Object.entries(PROVINCE_CODES).filter(([code, name]) => {
    const q = searchTerm.toLowerCase();
    return name.toLowerCase().includes(q) || code.includes(q);
  });

  // Filter 26 regions for region search
  const filteredRegions = REGIONS.filter((reg) => {
    const q = searchTerm.toLowerCase();
    return (
      reg.code.toLowerCase().includes(q) ||
      reg.agency.toLowerCase().includes(q) ||
      reg.shortCode.toLowerCase().includes(q) ||
      reg.level1Name.toLowerCase().includes(q) ||
      reg.provinces.some((p) => p.toLowerCase().includes(q))
    );
  });

  const handleSwitchTab = (tab: 'province' | 'region') => {
    setActiveTab(tab);
    setSearchTerm('');
    if (onMapLevelChange) {
      onMapLevelChange(tab);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
      <div className={`relative w-full max-w-4xl max-h-[92vh] bg-[#051126] border ${
        activeTab === 'region' ? 'border-amber-400/60 shadow-[0_0_35px_rgba(245,158,11,0.3)]' : 'border-cyan-400/50 shadow-[0_0_35px_rgba(0,242,254,0.3)]'
      } rounded-sm flex flex-col overflow-hidden text-slate-100 font-['Rajdhani'] transition-colors duration-300`}>
        
        {/* Corner Angle Accents */}
        <span className={`absolute top-0 left-0 w-3.5 h-3.5 border-t-2 border-l-2 ${activeTab === 'region' ? 'border-amber-400' : 'border-cyan-400'} z-10`} />
        <span className={`absolute top-0 right-0 w-3.5 h-3.5 border-t-2 border-r-2 ${activeTab === 'region' ? 'border-amber-400' : 'border-cyan-400'} z-10`} />
        <span className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-b-2 border-l-2 ${activeTab === 'region' ? 'border-amber-400' : 'border-cyan-400'} z-10`} />
        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-b-2 border-r-2 ${activeTab === 'region' ? 'border-amber-400' : 'border-cyan-400'} z-10`} />

        {/* Modal Top Bar with Tab Switcher */}
        <div className={`px-4 sm:px-5 py-3 ${
          activeTab === 'region' 
            ? 'bg-gradient-to-r from-[#2c1a05] via-[#1a1104] to-[#051126] border-b border-amber-500/30' 
            : 'bg-gradient-to-r from-[#092248] via-[#040e24] to-[#040e24] border-b border-cyan-500/20'
        } flex flex-wrap items-center justify-between gap-3`}>
          
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`w-2.5 h-5 rounded-xs shrink-0 ${
              activeTab === 'region' ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-cyan-400 shadow-[0_0_10px_#00f2fe]'
            }`} />
            
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-['Orbitron'] tracking-wider text-white uppercase truncate">
                  {activeTab === 'region' ? (
                    <>
                      <span>{activeRegion.code} · {activeRegion.agency.toUpperCase()}</span>
                      <span className="text-amber-400 font-mono text-xs ml-2 hidden sm:inline">({activeRegion.shortCode})</span>
                    </>
                  ) : (
                    <span>{currentProvinceName} — İL PROFİLİ VE DETAY KARNESİ</span>
                  )}
                </h2>

                <span className={`px-2 py-0.5 text-[11px] font-mono rounded-xs border font-bold ${
                  activeTab === 'region'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                    : 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30'
                }`}>
                  {activeTab === 'region' ? '26 İBBS-2 BÖLGE KARNESİ' : `PLAKA: ${selectedProvinceCode}`}
                </span>
              </div>

              <div className="text-[11px] font-mono text-slate-300/80 mt-0.5 flex items-center gap-2 truncate">
                {activeTab === 'region' ? (
                  <>
                    <span>Düzey 1: <strong className="text-amber-200">{activeRegion.level1Name}</strong></span>
                    <span>·</span>
                    <span>Kapsam: <strong className="text-white">{activeRegion.provinces.join(', ')}</strong> ({activeRegion.provinces.length} İl)</span>
                  </>
                ) : (
                  <>
                    <span>Bölge: <strong className="text-cyan-300">{provinceRegion.code} ({provinceRegion.agency})</strong></span>
                    <span>·</span>
                    <button
                      onClick={() => {
                        if (onSelectRegion) onSelectRegion(provinceRegion.code);
                        handleSwitchTab('region');
                      }}
                      className="text-amber-300 hover:text-amber-200 underline font-semibold flex items-center gap-0.5"
                    >
                      Bölge Karnesine Git <ArrowRight className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Controls: Tab Switcher (81 İl / 26 Bölge) & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center p-0.5 rounded-xs bg-[#030919] border border-cyan-500/30 font-mono text-xs">
              <button
                onClick={() => handleSwitchTab('region')}
                className={`flex items-center gap-1.5 px-3 py-1 font-['Rajdhani'] font-bold rounded-xs transition-all ${
                  activeTab === 'region'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 shadow-[0_0_10px_#f59e0b] font-black'
                    : 'text-amber-300/70 hover:text-amber-200 hover:bg-amber-950/40'
                }`}
                title="26 İBBS-2 Düzey 2 Bölge Karnesi (Kalkınma Ajansı Agregat Verileri)"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>26 BÖLGE</span>
              </button>

              <button
                onClick={() => handleSwitchTab('province')}
                className={`flex items-center gap-1.5 px-3 py-1 font-['Rajdhani'] font-bold rounded-xs transition-all ${
                  activeTab === 'province'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_#00f2fe] font-black'
                    : 'text-slate-300 hover:text-white hover:bg-cyan-950/40'
                }`}
                title="81 İl Seviyesinde Detaylı İl Karnesi"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>81 İL</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 hover:bg-cyan-500/20 text-slate-400 hover:text-white rounded transition-colors"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Fast Search & Selection Bar */}
        <div className="p-2.5 sm:p-3 bg-[#030919] border-b border-cyan-500/15 flex items-center gap-2">
          <Search className={`w-4 h-4 ml-2 shrink-0 ${activeTab === 'region' ? 'text-amber-400' : 'text-cyan-400'}`} />
          <input
            type="text"
            placeholder={
              activeTab === 'region'
                ? "26 Kalkınma Ajansı / İBBS-2 Bölgesi ara (Örn: MEVKA, TR52, Zafer, İzmir, Trakya, Bursa)..."
                : "81 İl arasında ara (Örn: Konya, Bursa, 16, İzmir, Ankara, Gaziantep)..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full bg-transparent text-sm placeholder-opacity-50 outline-none font-mono ${
              activeTab === 'region' ? 'text-amber-200 placeholder-amber-400/50' : 'text-cyan-200 placeholder-cyan-500/40'
            }`}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="text-xs font-mono text-slate-400 hover:text-white px-2 py-0.5"
            >
              Temizle
            </button>
          )}
        </div>

        {/* Search Results Drawer if user is typing */}
        {searchTerm && (
          <div className="max-h-44 overflow-y-auto bg-[#07193b] border-b border-cyan-500/20 p-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 text-xs">
            {activeTab === 'region' ? (
              filteredRegions.map((reg) => (
                <button
                  key={reg.code}
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(reg.code);
                    const firstProv = reg.provinces[0];
                    if (firstProv && PROVINCE_TO_CODE[firstProv]) {
                      onSelectProvince(PROVINCE_TO_CODE[firstProv]);
                    }
                    setSearchTerm('');
                  }}
                  className={`p-2 rounded-xs text-left transition-colors flex items-center justify-between border ${
                    reg.code === activeRegion.code
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300'
                      : 'bg-slate-900/60 border-slate-700/50 text-amber-200 hover:bg-amber-950/60 hover:border-amber-400/50'
                  }`}
                >
                  <div className="truncate mr-2">
                    <span className="font-bold block">{reg.shortCode} · {reg.agency}</span>
                    <span className="text-[10px] opacity-80 font-mono block truncate">
                      İller: {reg.provinces.join(', ')}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/30 shrink-0">
                    {reg.code}
                  </span>
                </button>
              ))
            ) : (
              filteredProvinces.slice(0, 18).map(([code, name]) => (
                <button
                  key={code}
                  onClick={() => {
                    onSelectProvince(code);
                    const reg = getRegionForProvince(code);
                    if (reg && onSelectRegion) onSelectRegion(reg.code);
                    setSearchTerm('');
                  }}
                  className={`p-1.5 rounded-xs text-left font-semibold truncate transition-colors flex items-center justify-between ${
                    code === selectedProvinceCode 
                      ? 'bg-cyan-500 text-slate-950 font-bold' 
                      : 'text-cyan-200 hover:bg-cyan-900/50'
                  }`}
                >
                  <span>{name}</span>
                  <span className="font-mono text-[10px] opacity-75">Plaka {code}</span>
                </button>
              ))
            )}
          </div>
        )}

        {/* Modal Main Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">

          {/* ========================================================= */}
          {/* TAB 1: 26 BÖLGE KARNESİ (BÖLGESEL AGREGAT VERİLER)        */}
          {/* ========================================================= */}
          {activeTab === 'region' && (
            <>
              {/* Regional Agency Header Card */}
              <div className="bg-gradient-to-r from-[#201504]/90 via-[#140e02]/90 to-[#07193b]/70 border border-amber-500/30 p-3.5 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.12)]">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-5 h-5 text-amber-400 animate-spin-slow" />
                    <span className="font-['Orbitron'] font-bold text-base text-white tracking-wide">
                      {activeRegion.agency} ({activeRegion.shortCode})
                    </span>
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded text-[11px] font-mono font-bold">
                      İBBS-2 KODU: {activeRegion.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 mt-1 font-mono">
                    Kalkınma Ajansı Faaliyet Bölgesi: <strong className="text-amber-200">{activeRegion.provinces.join(' · ')}</strong>
                  </div>
                </div>

                {/* Quick Province Badges (Clickable) */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-mono text-slate-400 mr-1">Bölge İlleri:</span>
                  {regionalData.provinces.map((p) => (
                    <button
                      key={p.code}
                      onClick={() => {
                        onSelectProvince(p.code);
                        handleSwitchTab('province');
                      }}
                      className="px-2 py-1 rounded bg-[#091b38] hover:bg-cyan-500 hover:text-slate-950 border border-cyan-500/30 text-cyan-200 text-xs font-semibold transition-all flex items-center gap-1"
                      title={`${p.name} İl Karnesini Görüntüle`}
                    >
                      <span>{p.name}</span>
                      <span className="font-mono text-[10px] opacity-70">({p.code})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4 Big Regional Aggregate KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* 1. Regional Export */}
                <div className="bg-[#1b1406]/80 border border-amber-500/40 p-3 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <div className="flex items-center justify-between text-xs text-amber-300/90 uppercase font-semibold">
                    <span>2025 Bölge İhracatı</span>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    {regionalData.totalExport >= 1e9
                      ? `$${(regionalData.totalExport / 1e9).toFixed(2)}B`
                      : `$${(regionalData.totalExport / 1e6).toFixed(1)}M`}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono mt-0.5 flex items-center justify-between">
                    <span>${regionalData.totalExport.toLocaleString('tr-TR')}</span>
                    <span className="text-emerald-400 font-bold">
                      {((regionalData.totalExport / 255420000000) * 100).toFixed(2)}% TR Payı
                    </span>
                  </div>
                </div>

                {/* 2. Regional OSB Infrastructure */}
                <div className="bg-[#1b1406]/80 border border-amber-500/40 p-3 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <div className="flex items-center justify-between text-xs text-amber-300/90 uppercase font-semibold">
                    <span>Toplam Sanayi OSB</span>
                    <Factory className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    {regionalData.totalOsb.count} <span className="text-xs text-amber-300 font-normal">Bölge</span>
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono mt-0.5 flex items-center justify-between">
                    <span>{regionalData.totalOsb.isletmede} Faal İşletmede</span>
                    <span>{regionalData.totalOsb.areaHa.toLocaleString('tr-TR')} Ha</span>
                  </div>
                </div>

                {/* 3. Regional Women Share */}
                <div className="bg-[#1b1406]/80 border border-amber-500/40 p-3 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <div className="flex items-center justify-between text-xs text-amber-300/90 uppercase font-semibold">
                    <span>Kadın İhracat Katkısı</span>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    %{regionalData.womenShare.toFixed(1)}
                  </div>
                  <div className="text-[10px] text-amber-400/80 font-mono mt-0.5">
                    İhracat Ağırlıklı Bölge Ortalaması
                  </div>
                </div>

                {/* 4. Regional GDP per Capita & Population */}
                <div className="bg-[#1b1406]/80 border border-amber-500/40 p-3 rounded-xs shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                  <div className="flex items-center justify-between text-xs text-amber-300/90 uppercase font-semibold">
                    <span>Kişi Başına GSYH</span>
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    ${regionalData.overview.gdpPerCapitaUsd.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[10px] text-slate-300/80 font-mono mt-0.5">
                    Bölge Nüfusu: <strong className="text-white">{regionalData.totalPopulation.toLocaleString('tr-TR')}</strong>
                  </div>
                </div>
              </div>

              {/* Regional OSB Breakdown Detail Table */}
              <div className="bg-[#061736]/70 border border-cyan-500/20 p-4 rounded-xs">
                <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    Bölge Geneli Sanayi Bölgeleri (OSB) Altyapı ve Parsel Dökümü
                  </span>
                  <span className="text-xs font-mono text-cyan-400/80">
                    Toplam {regionalData.totalOsb.count} OSB / {regionalData.totalOsb.areaHa.toLocaleString('tr-TR')} Hektar
                  </span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Toplam Sanayi Parseli</span>
                    <span className="font-['Orbitron'] text-base font-bold text-cyan-200">
                      {regionalData.totalOsb.parsels.toLocaleString('tr-TR')}
                    </span>
                    <span className="text-[10px] text-cyan-400/60 block mt-0.5 font-mono">Tahsisli & Boş Parseller</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Faaliyetteki / İşletmede</span>
                    <span className="font-['Orbitron'] text-base font-bold text-emerald-400">
                      {regionalData.totalOsb.isletmede} OSB
                    </span>
                    <span className="text-[10px] text-emerald-400/60 block mt-0.5 font-mono">Fiili Üretim Yapan</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Altyapı & Planlama Aşaması</span>
                    <span className="font-['Orbitron'] text-base font-bold text-cyan-300">
                      {regionalData.totalOsb.altyapi + regionalData.totalOsb.planlama} OSB
                    </span>
                    <span className="text-[10px] text-cyan-400/60 block mt-0.5 font-mono">Kamulaştırma: {regionalData.totalOsb.kamulastirma}</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Karma / İhtisas / TDİ Türü</span>
                    <span className="font-['Orbitron'] text-base font-bold text-amber-300">
                      {regionalData.totalOsb.karma} / {regionalData.totalOsb.ihtisas} / {regionalData.totalOsb.tdiosb}
                    </span>
                    <span className="text-[10px] text-amber-400/60 block mt-0.5 font-mono">Sektörel İhtisas Dağılımı</span>
                  </div>
                </div>
              </div>

              {/* Regional Socio-Demographics (Population-Weighted Averages) */}
              <div className="bg-[#061736]/70 border border-cyan-500/20 p-4 rounded-xs">
                <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Building className="w-4 h-4 text-cyan-400" />
                    Bölgesel Sosyo-Demografik ve Yaşam Endeksleri (Nüfus Ağırlıklı Ortalamalar)
                  </span>
                  <span className="text-xs font-mono text-cyan-400/80">
                    Toplam Nüfus: {regionalData.totalPopulation.toLocaleString('tr-TR')}
                  </span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px] mb-0.5">İstihdam Oranı</span>
                    <span className="font-mono text-base font-bold text-white">%{regionalData.overview.employmentRate}</span>
                    <span className="text-[10px] text-slate-400/70 block mt-0.5 font-mono">15+ Yaş İstihdam</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px] mb-0.5">İşsizlik Oranı</span>
                    <span className="font-mono text-base font-bold text-rose-400">%{regionalData.overview.unemploymentRate}</span>
                    <span className="text-[10px] text-slate-400/70 block mt-0.5 font-mono">Bölgesel İşgücü</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Ort. Eğitim Süresi</span>
                    <span className="font-mono text-base font-bold text-white">{regionalData.overview.avgEducationYears} Yıl</span>
                    <span className="text-[10px] text-slate-400/70 block mt-0.5 font-mono">Örgün Eğitim Ort.</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px] mb-0.5">SEGE Gelişmişlik</span>
                    <span className="font-mono text-base font-bold text-amber-300">{regionalData.overview.sesScore} / 100</span>
                    <span className="text-[10px] text-slate-400/70 block mt-0.5 font-mono">Sosyoekonomik Skoru</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px] mb-0.5">Hastane Yatak / 100k</span>
                    <span className="font-mono text-base font-bold text-emerald-400">{regionalData.overview.hospitalBedsPer100k} Yatak</span>
                    <span className="text-[10px] text-slate-400/70 block mt-0.5 font-mono">Sağlık Kapasitesi</span>
                  </div>
                </div>
              </div>

              {/* Member Provinces Comparison Table */}
              <div className="bg-[#061736]/70 border border-cyan-500/20 p-4 rounded-xs">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    Bölge Kapsamındaki İllerin Performans ve Katkı Dağılımı ({regionalData.provinces.length} İl)
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Bir ile tıklayarak il karnesine geçiş yapabilirsiniz
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-cyan-500/20 text-cyan-300/80 text-[11px] uppercase bg-[#040f28]">
                        <th className="py-2 px-3">İl / Plaka</th>
                        <th className="py-2 px-3 text-right">2025 İhracat</th>
                        <th className="py-2 px-3 text-right">Bölge Payı</th>
                        <th className="py-2 px-3 text-center">OSB (Faal)</th>
                        <th className="py-2 px-3 text-right">Nüfus</th>
                        <th className="py-2 px-3 text-right">GSYH / Kişi</th>
                        <th className="py-2 px-3 text-center">SEGE Skoru</th>
                        <th className="py-2 px-3 text-center">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-cyan-500/10">
                      {regionalData.provinces.map((prov) => {
                        const exportShare = regionalData.totalExport > 0 
                          ? ((prov.export / regionalData.totalExport) * 100).toFixed(1) 
                          : '0';
                        const isCurrentProvince = prov.code === selectedProvinceCode;

                        return (
                          <tr 
                            key={prov.code}
                            className={`hover:bg-cyan-950/40 transition-colors ${
                              isCurrentProvince ? 'bg-cyan-900/20 font-bold' : ''
                            }`}
                          >
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded bg-cyan-950 border border-cyan-500/40 text-[10px] font-bold text-cyan-300 flex items-center justify-center shrink-0">
                                  {prov.code}
                                </span>
                                <span className="font-['Rajdhani'] font-bold text-sm text-white">
                                  {prov.name}
                                </span>
                                {isCurrentProvince && (
                                  <span className="px-1.5 py-0.2 bg-cyan-500 text-slate-950 text-[9px] font-bold rounded">
                                    SEÇİLİ
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-amber-300">
                              ${(prov.export / 1e6).toFixed(1)}M
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-200 border border-amber-500/30 text-[11px] font-bold">
                                %{exportShare}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center text-cyan-200">
                              {prov.osb.count} ({prov.osb.isletmede})
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300">
                              {prov.overview.population.toLocaleString('tr-TR')}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                              ${prov.overview.gdpPerCapitaUsd.toLocaleString('tr-TR')}
                            </td>
                            <td className="py-2.5 px-3 text-center text-cyan-300">
                              {prov.overview.sesScore}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <button
                                onClick={() => {
                                  onSelectProvince(prov.code);
                                  handleSwitchTab('province');
                                }}
                                className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/40 transition-all font-bold text-[11px] flex items-center gap-1 mx-auto"
                              >
                                <span>İl Karnesi</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ========================================================= */}
          {/* TAB 2: 81 İL KARNESİ (BİREYSEL İL DOSYASI)                 */}
          {/* ========================================================= */}
          {activeTab === 'province' && (
            <>
              {/* Province Region Banner */}
              <div className="bg-[#091f42]/70 border border-cyan-500/30 p-3 rounded-xs flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-300">
                    Bağlı Olduğu Düzey-2 Bölgesi: <strong className="text-amber-300">{provinceRegion.code} · {provinceRegion.agency} ({provinceRegion.shortCode})</strong>
                  </span>
                </div>
                <button
                  onClick={() => {
                    if (onSelectRegion) onSelectRegion(provinceRegion.code);
                    handleSwitchTab('region');
                  }}
                  className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all text-xs font-bold font-['Rajdhani'] flex items-center gap-1"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{provinceRegion.code} Bölge Karnesini Aç</span>
                </button>
              </div>

              {/* Top KPI Cards Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
                  <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                    <span>2025 Yıllık İhracat</span>
                    <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    ${(provExportVal / 1e6).toFixed(1)}M
                  </div>
                  <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                    ${provExportVal.toLocaleString('tr-TR')}
                  </div>
                </div>

                <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
                  <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                    <span>Organize Sanayi (OSB)</span>
                    <Factory className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    {provOsb.count} <span className="text-xs text-cyan-300 font-normal">Bölge</span>
                  </div>
                  <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                    {provOsb.areaHa.toLocaleString('tr-TR')} Hektar Alan
                  </div>
                </div>

                <div className="bg-[#071d42]/70 border border-cyan-500/30 p-3 rounded-xs">
                  <div className="flex items-center justify-between text-xs text-cyan-300/80 uppercase">
                    <span>Kadın İhracat Payı</span>
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-xl font-bold font-['Orbitron'] text-white mt-1">
                    %{provWomenShare.toFixed(1)}
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
                    ${provStats.gdpPerCapitaUsd.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[10px] text-cyan-400/60 font-mono mt-0.5">
                    Nüfus: {provStats.population.toLocaleString('tr-TR')}
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
                    <span className="font-['Orbitron'] text-base font-bold text-cyan-200">{provOsb.parsels}</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Faaliyetteki / İşletmede</span>
                    <span className="font-['Orbitron'] text-base font-bold text-emerald-400">{provOsb.isletmede} OSB</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Altyapı & Planlama</span>
                    <span className="font-['Orbitron'] text-base font-bold text-cyan-300">{provOsb.altyapi + provOsb.planlama} OSB</span>
                  </div>
                  <div className="bg-[#040e24] p-2.5 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block mb-1">Karma / İhtisas / TDİ</span>
                    <span className="font-['Orbitron'] text-base font-bold text-amber-300">
                      {provOsb.karma} / {provOsb.ihtisas} / {provOsb.tdiosb}
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
                    <span className="font-mono text-sm font-bold text-white">%{provStats.employmentRate}</span>
                  </div>
                  <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px]">İşsizlik Oranı</span>
                    <span className="font-mono text-sm font-bold text-rose-400">%{provStats.unemploymentRate}</span>
                  </div>
                  <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px]">Ort. Eğitim Süresi</span>
                    <span className="font-mono text-sm font-bold text-white">{provStats.avgEducationYears} Yıl</span>
                  </div>
                  <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px]">SES Seviye Skoru</span>
                    <span className="font-mono text-sm font-bold text-cyan-300">{provStats.sesScore} / 100</span>
                  </div>
                  <div className="bg-[#040e24] p-2 rounded border border-cyan-500/10">
                    <span className="text-slate-400 block text-[11px]">Hastane Yatak / 100k</span>
                    <span className="font-mono text-sm font-bold text-white">{provStats.hospitalBedsPer100k} Yatak</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer with Actions */}
        <div className="px-4 sm:px-5 py-3 bg-[#030919] border-t border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-mono text-[11px]">
            Kaynaklar: TÜİK Dış Ticaret & CIP · Sanayi ve Teknoloji Bakanlığı · OSBÜK · Kalkınma Ajansları
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSwitchTab(activeTab === 'region' ? 'province' : 'region')}
              className={`px-3 py-1.5 rounded-xs border text-xs font-bold transition-all uppercase tracking-wider ${
                activeTab === 'region'
                  ? 'border-cyan-500/50 hover:border-cyan-400 text-cyan-300 hover:text-white'
                  : 'border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white'
              }`}
            >
              {activeTab === 'region' ? 'İl Karnesine Geç' : 'Bölge Karnesine Geç'}
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xs font-bold text-slate-950 transition-colors uppercase tracking-wider ${
                activeTab === 'region' ? 'bg-amber-400 hover:bg-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)]' : 'bg-cyan-500 hover:bg-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
              }`}
            >
              Tamam / Paneli İncele
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
