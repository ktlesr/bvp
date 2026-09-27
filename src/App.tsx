import React, { useState, useEffect } from 'react';
import { 
  Header, 
  DashboardMode 
} from './components/Header';
import { 
  BorderBox, 
  DigitalCounter, 
  TechDecorationLine 
} from './components/DataVDecorations';
import { 
  TurkeyMap3D as TurkeyMap 
} from './components/TurkeyMap3D';
import { MapMetricType, getMetricTitle, computeProvinceMetric, computeRegionMetric, isAscendingMetric } from './data/metricCatalog';
import { RankingList } from './components/RankingList';
import { TrendChart } from './components/TrendChart';
import { CompositionChart } from './components/CompositionChart';
import { RadarPerformanceChart } from './components/RadarPerformanceChart';
import { LiveEventStream } from './components/LiveEventStream';
import { ProvinceDossierModal } from './components/ProvinceDossierModal';
import { ThemeMode } from './utils/theme';
import { PROVINCE_CODES, REGIONS, REGION_CODES, PROVINCE_TO_CODE, getRegionForProvince, getRegionByCode } from './data/regions';
import { getProvinceExport } from './data/tradeData';
import { getProvinceOSB } from './data/osbData';
import { getWomenShare } from './data/womenTradeData';
import { getProvinceOverview } from './data/demographyData';
import { 
  TrendingUp, 
  Factory, 
  Users, 
  Globe, 
  Building2, 
  Award, 
  Sparkles, 
  ChevronRight,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';

const KIOSK_STEPS: {
  mode: DashboardMode;
  metric: MapMetricType;
  label: string;
}[] = [
  { mode: 'trade', metric: 'export', label: 'İHRACAT LİDERLERİ' },
  { mode: 'osb', metric: 'osb', label: 'SANAYİ & OSB BÖLGELERİ' },
  { mode: 'women', metric: 'women', label: 'KADIN GİRİŞİMCİ & İSTİHDAM' },
  { mode: 'demography', metric: 'gdp', label: 'REFAH & KİŞİ BAŞI GSYH' }
];

function getTopLeaderCode(metric: MapMetricType): string {
  const isAsc = isAscendingMetric(metric);
  let bestCode = '34';
  let bestVal = isAsc ? Infinity : -Infinity;
  for (let i = 1; i <= 81; i++) {
    const code = String(i);
    const val = computeProvinceMetric(code, metric);
    if (isAsc ? val < bestVal : val > bestVal) {
      bestVal = val;
      bestCode = code;
    }
  }
  return bestCode;
}

export default function App() {
  const [currentMode, setCurrentMode] = useState<DashboardMode>('trade');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('34'); // Default Istanbul
  const [mapLevel, setMapLevel] = useState<'province' | 'region'>('province');
  const [selectedRegionCode, setSelectedRegionCode] = useState<string>('TR10');
  const [activeMetric, setActiveMetric] = useState<MapMetricType>('export');
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('cyber-blue');
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [kioskStepIdx, setKioskStepIdx] = useState<number>(0);
  const [kioskProgress, setKioskProgress] = useState<number>(0);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Clean metric change handler: resets manual selection to the natural top leader so previous manual city never gets stuck
  const handleMetricChange = (newMetric: MapMetricType) => {
    setActiveMetric(newMetric);
    const leader = getTopLeaderCode(newMetric);
    setSelectedProvinceCode(leader);
    const reg = getRegionForProvince(leader);
    if (reg) setSelectedRegionCode(reg.code);
  };

  // Sync active map metric when dashboard mode changes manually (when not in auto play)
  useEffect(() => {
    if (isAutoPlay) return;
    switch (currentMode) {
      case 'trade':
        handleMetricChange('export');
        break;
      case 'osb':
        handleMetricChange('osb');
        break;
      case 'women':
        handleMetricChange('women');
        break;
      case 'demography':
        handleMetricChange('gdp');
        break;
      case 'province':
        setIsDossierOpen(true);
        break;
    }
  }, [currentMode, isAutoPlay]);

  // Cinematic Kiosk auto-play: Smooth 6-second countdown, theme cycling & leader city focus
  useEffect(() => {
    if (!isAutoPlay) {
      setKioskProgress(0);
      return;
    }

    // Immediately focus on current step leader when starting
    const currentStep = KIOSK_STEPS[kioskStepIdx];
    if (currentStep) {
      setCurrentMode(currentStep.mode);
      setActiveMetric(currentStep.metric);
      const leader = getTopLeaderCode(currentStep.metric);
      setSelectedProvinceCode(leader);
    }

    const intervalMs = 100;
    const durationMs = 6000; // 6 seconds per theme
    const stepIncrement = (intervalMs / durationMs) * 100;

    const timer = setInterval(() => {
      setKioskProgress((prev) => {
        if (prev + stepIncrement >= 100) {
          // Advance to next theme
          setKioskStepIdx((oldIdx) => {
            const nextIdx = (oldIdx + 1) % KIOSK_STEPS.length;
            const nextStep = KIOSK_STEPS[nextIdx];
            setCurrentMode(nextStep.mode);
            setActiveMetric(nextStep.metric);
            const leader = getTopLeaderCode(nextStep.metric);
            setSelectedProvinceCode(leader);
            return nextIdx;
          });
          return 0;
        }
        return prev + stepIncrement;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isAutoPlay]);

  const selectedName = PROVINCE_CODES[selectedProvinceCode] || 'ADANA';
  const selectedRegion = REGIONS.find((r) => r.provinces.some((p) => p.toLowerCase() === selectedName.toLowerCase()));
  const activeRegion = REGIONS.find((r) => r.code === selectedRegionCode) || selectedRegion || REGIONS[0];

  // Active statistics for selected province
  const currentExp = getProvinceExport(selectedProvinceCode, 3); // 2025
  const currentOsb = getProvinceOSB(selectedProvinceCode);
  const currentWomenShare = getWomenShare(selectedProvinceCode, 7);
  const currentOverview = getProvinceOverview(selectedProvinceCode);

  return (
    <div 
      data-theme={activeTheme}
      className={`min-h-screen theme-${activeTheme} bg-[#030816] text-slate-100 flex flex-col datav-grid-bg relative overflow-x-hidden transition-colors duration-500`}
    >
      {/* Background radial ambient lights dynamically responding to active theme */}
      <div 
        className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-[130px] pointer-events-none transition-all duration-700" 
        style={{
          backgroundColor: activeTheme === 'gold-titanium'
            ? 'rgba(245, 158, 11, 0.16)'
            : activeTheme === 'emerald-tech'
            ? 'rgba(16, 185, 129, 0.16)'
            : activeTheme === 'crimson-command'
            ? 'rgba(244, 63, 94, 0.16)'
            : 'rgba(6, 182, 212, 0.12)'
        }}
      />
      <div 
        className="absolute top-1/3 right-1/4 w-[32rem] h-[32rem] rounded-full blur-[150px] pointer-events-none transition-all duration-700" 
        style={{
          backgroundColor: activeTheme === 'gold-titanium'
            ? 'rgba(217, 119, 6, 0.14)'
            : activeTheme === 'emerald-tech'
            ? 'rgba(5, 150, 105, 0.14)'
            : activeTheme === 'crimson-command'
            ? 'rgba(225, 29, 72, 0.14)'
            : 'rgba(59, 130, 246, 0.1)'
        }}
      />

      {/* 1. Regional 3D Top Header */}
      <Header
        currentMode={currentMode}
        onModeChange={(m) => {
          if (m === 'province') {
            setIsDossierOpen(true);
          } else {
            setCurrentMode(m);
          }
        }}
        activeTheme={activeTheme}
        onThemeChange={setActiveTheme}
        isAutoPlay={isAutoPlay}
        onToggleAutoPlay={() => setIsAutoPlay(!isAutoPlay)}
        autoPlayProgress={kioskProgress}
        autoPlayStepTitle={KIOSK_STEPS[kioskStepIdx]?.label}
        onOpenProvinceSearch={() => setIsDossierOpen(true)}
        selectedProvinceName={selectedName}
        mapLevel={mapLevel}
        onMapLevelChange={setMapLevel}
        selectedRegionName={REGION_CODES[activeRegion?.code] || activeRegion?.agency}
        selectedRegionCode={activeRegion?.code}
      />

      {/* 2. Top Summary KPI Numbers Bar */}
      <div className="px-3 md:px-6 py-1 z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        <DigitalCounter
          label="2025 Toplam Genel İhracat"
          value={255420000000}
          prefix="$"
          subValue="+3.8% Yıllık"
          isPositive={true}
        />
        <DigitalCounter
          label="Türkiye Geneli Sanayi OSB"
          value={418}
          unit="Bölge"
          subValue="276 İşletmede"
          isPositive={true}
        />
        <DigitalCounter
          label="Kadınların İhracata Katkısı"
          value={14.2}
          prefix="%"
          subValue="18.9 Milyar $"
          isPositive={true}
        />
        <DigitalCounter
          label="81 İl Toplam Nüfus"
          value={85372377}
          unit="Kişi"
          subValue="ADNKS 2024"
          isPositive={true}
        />
        <DigitalCounter
          label="Kişi Başı Ortalama GSYH"
          value={13110}
          prefix="$"
          subValue="Ulusal Hesap"
          isPositive={true}
        />
      </div>

      {/* 3. Main Data Screen (Left & Right scalable sidebars 240px-280px-320px, Center Map expands dynamically) */}
      <main className="flex-1 px-2.5 md:px-4 lg:px-6 py-2 flex flex-col lg:flex-row gap-3 z-10 min-h-0">
        
        {/* Left Column: Leaderboard & Composition (Scales smoothly: 240px -> 280px -> 320px) */}
        <div className="w-full lg:w-[240px] xl:w-[280px] 2xl:w-[320px] shrink-0 flex flex-col gap-3 transition-all duration-300 ease-in-out">
          {/* Box 1: Top Provinces / Regions Leaderboard */}
          <BorderBox
            title={getMetricTitle(activeMetric)}
            subtitle={mapLevel === 'region' ? "İLK 8 İBBS-2 BÖLGE" : "İLK 8 İL"}
            badge={mapLevel === 'region' ? "26 BÖLGE" : "CANLI SIRALAMA"}
            className="flex-1 min-h-[300px]"
          >
            <RankingList
              activeMetric={activeMetric}
              selectedProvinceCode={selectedProvinceCode}
              onSelectProvince={(code) => {
                setSelectedProvinceCode(code);
                const reg = getRegionForProvince(code);
                if (reg) setSelectedRegionCode(reg.code);
              }}
              mapLevel={mapLevel}
              selectedRegionCode={selectedRegionCode}
              onSelectRegion={setSelectedRegionCode}
            />
          </BorderBox>

          {/* Box 2: Composition Donut Chart (Year badge 2025) */}
          <BorderBox
            title="OSB & SANAYİ DAĞILIMI"
            subtitle={`${selectedName.toUpperCase()}`}
            badge="2025"
            className="min-h-[220px]"
          >
            <CompositionChart provinceCode={selectedProvinceCode} />
          </BorderBox>
        </div>

        {/* Center Column: Map Expands to Fill All Available Screen Space (flex-1 min-w-0) */}
        <div className="flex-1 min-w-0 flex flex-col gap-3 transition-all duration-300 ease-in-out">
          {/* Main Interactive Map (scales with viewport height) */}
          <div className="flex-1 min-h-[480px] xl:min-h-[540px] 2xl:min-h-[620px] flex flex-col">
            <TurkeyMap
              selectedProvinceCode={selectedProvinceCode}
              onSelectProvince={(code) => {
                setSelectedProvinceCode(code);
                const reg = getRegionForProvince(code);
                if (reg) setSelectedRegionCode(reg.code);
              }}
              selectedRegionCode={selectedRegionCode}
              onSelectRegion={(regCode) => {
                setSelectedRegionCode(regCode);
                const reg = getRegionByCode(regCode);
                if (reg && reg.provinces[0]) {
                  const pCode = PROVINCE_TO_CODE[reg.provinces[0]];
                  if (pCode) setSelectedProvinceCode(pCode);
                }
              }}
              mapLevel={mapLevel}
              onMapLevelChange={setMapLevel}
              activeMetric={activeMetric}
              onMetricChange={handleMetricChange}
              onOpenDossier={() => setIsDossierOpen(true)}
              currentMode={currentMode}
              onModeChange={setCurrentMode}
              isAutoPlay={isAutoPlay}
              autoPlayProgress={kioskProgress}
              autoPlayStepTitle={KIOSK_STEPS[kioskStepIdx]?.label}
              activeTheme={activeTheme}
            />
          </div>

          {/* Center Bottom: Quick Selected Province / Region Highlight Bar */}
          <div className="bg-[#05132d]/85 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className={`w-2.5 h-6 ${mapLevel === 'region' ? 'bg-amber-400 shadow-[0_0_10px_#f59e0b]' : 'bg-cyan-400 shadow-[0_0_10px_#00f2fe]'} rounded-xs`} />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Orbitron'] font-bold text-base text-white tracking-wider">
                    {mapLevel === 'region' && activeRegion
                      ? `${activeRegion.shortCode} · ${activeRegion.level1Name.toUpperCase()}`
                      : selectedName.toUpperCase()}
                  </span>
                  <span className="font-mono text-cyan-400 text-xs font-semibold">
                    {mapLevel === 'region' && activeRegion
                      ? `(${activeRegion.code})`
                      : `(Plaka: ${selectedProvinceCode})`}
                  </span>
                  {activeRegion && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-xs">
                      {activeRegion.agency}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300/80 font-mono mt-0.5">
                  {mapLevel === 'region' && activeRegion ? (
                    <>
                      Kapsam: <strong className="text-cyan-200">{activeRegion.provinces.join(', ')}</strong> · 
                      2025 Bölge İhracatı: <strong className="text-amber-300">${(computeRegionMetric(activeRegion.code, 'export') / 1e6).toFixed(1)}M</strong> · 
                      OSB: <strong className="text-cyan-200">{computeRegionMetric(activeRegion.code, 'osb')} Adet</strong> · 
                      Kadın Payı: <strong className="text-cyan-200">%{computeRegionMetric(activeRegion.code, 'women').toFixed(1)}</strong>
                    </>
                  ) : (
                    <>
                      2025 İhracat: <strong className="text-cyan-200">${(currentExp / 1e6).toFixed(1)}M</strong> · OSB: <strong className="text-cyan-200">{currentOsb.count} Adet</strong> ({currentOsb.isletmede} Faal) · Kadın Payı: <strong className="text-cyan-200">%{currentWomenShare.toFixed(1)}</strong>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Level switch button in bottom bar */}
              <div className="flex items-center bg-[#071738] p-0.5 rounded border border-cyan-500/30 font-mono text-[10px]">
                <button
                  onClick={() => setMapLevel('province')}
                  className={`px-2 py-1 rounded-xs transition-colors ${mapLevel === 'province' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  81 İL
                </button>
                <button
                  onClick={() => setMapLevel('region')}
                  className={`px-2 py-1 rounded-xs transition-colors ${mapLevel === 'region' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  26 BÖLGE
                </button>
              </div>

              <button
                onClick={() => setIsDossierOpen(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 font-['Rajdhani'] font-bold text-xs uppercase tracking-wider rounded-xs transition-all shadow-lg ${
                  mapLevel === 'region'
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.4)]'
                }`}
              >
                <span>{mapLevel === 'region' ? 'BÖLGE KARNESİNİ AÇ' : 'İL KARNESİNİ AÇ'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Trends, Radar & Event Ticker (Scales smoothly: 240px -> 280px -> 320px) */}
        <div className="w-full lg:w-[240px] xl:w-[280px] 2xl:w-[320px] shrink-0 flex flex-col gap-3 transition-all duration-300 ease-in-out">
          {/* Box 3: Multi-Year Trend Chart */}
          <BorderBox
            title="DÖNEMSEL TREND ANALİZİ"
            subtitle={`${selectedName.toUpperCase()}`}
            badge="2022-2026"
            className="min-h-[200px]"
          >
            <TrendChart provinceCode={selectedProvinceCode} type={currentMode === 'women' ? 'women' : 'export'} />
          </BorderBox>

          {/* Box 4: 6-Axis Spider / Radar Performance Chart */}
          <BorderBox
            title="İL YETKİNLİK PROFİLİ"
            subtitle="6 EKSENLİ RADAR"
            badge="BENCHMARK"
            className="min-h-[210px]"
          >
            <RadarPerformanceChart provinceCode={selectedProvinceCode} />
          </BorderBox>

          {/* Box 5: Live Event & Agency Stream Ticker */}
          <BorderBox
            title="BÖLGESEL BİLDİRİMLER"
            subtitle="CANLI AKIŞ"
            badge="TELEMETRİ"
            className="flex-1 min-h-[180px]"
          >
            <LiveEventStream />
          </BorderBox>
        </div>
      </main>

      {/* 4. Bottom Footer Regional Ticker */}
      <footer className="px-3 md:px-6 py-2 border-t border-cyan-500/15 bg-[#030919]/90 z-20 flex flex-wrap items-center justify-between text-[11px] font-mono text-cyan-400/80">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="font-bold text-slate-300">26 İBBS-2 BÖLGESİ (NUTS-2):</span>
          <div className="hidden xl:flex items-center gap-2 text-cyan-300/60 overflow-hidden">
            {REGIONS.slice(0, 10).map((r) => (
              <span key={r.code} className="hover:text-cyan-200 transition-colors">
                {r.code} ({r.level1Name})
              </span>
            ))}
            <span>...</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>Kaynak: TÜİK Dış Ticaret & CIP · OSBÜK</span>
          <span>·</span>
          <span className="text-cyan-400/90 font-bold">3D PORTAL v2.5 ARCHITECTURE</span>
        </div>
      </footer>

      {/* 5. Detailed 81-Province / 26-Region Dossier Modal */}
      <ProvinceDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        selectedProvinceCode={selectedProvinceCode}
        onSelectProvince={(code) => setSelectedProvinceCode(code)}
        selectedRegionCode={selectedRegionCode}
        onSelectRegion={(code) => setSelectedRegionCode(code)}
        mapLevel={mapLevel}
        onMapLevelChange={setMapLevel}
      />
    </div>
  );
}
