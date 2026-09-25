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
import { MapMetricType, getMetricTitle, computeProvinceMetric } from './data/metricCatalog';
import { RankingList } from './components/RankingList';
import { TrendChart } from './components/TrendChart';
import { CompositionChart } from './components/CompositionChart';
import { RadarPerformanceChart } from './components/RadarPerformanceChart';
import { LiveEventStream } from './components/LiveEventStream';
import { ProvinceDossierModal } from './components/ProvinceDossierModal';
import { ThemeMode } from './utils/theme';
import { PROVINCE_CODES, REGIONS } from './data/regions';
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
  let bestCode = '34';
  let bestVal = -Infinity;
  for (let i = 1; i <= 81; i++) {
    const code = String(i);
    const val = computeProvinceMetric(code, metric);
    if (val > bestVal) {
      bestVal = val;
      bestCode = code;
    }
  }
  return bestCode;
}

export default function App() {
  const [currentMode, setCurrentMode] = useState<DashboardMode>('trade');
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<string>('34'); // Default Istanbul
  const [activeMetric, setActiveMetric] = useState<MapMetricType>('export');
  const [activeTheme, setActiveTheme] = useState<ThemeMode>('cyber-blue');
  const [isAutoPlay, setIsAutoPlay] = useState<boolean>(false);
  const [kioskStepIdx, setKioskStepIdx] = useState<number>(0);
  const [kioskProgress, setKioskProgress] = useState<number>(0);
  const [isDossierOpen, setIsDossierOpen] = useState<boolean>(false);

  // Sync active map metric when dashboard mode changes manually (when not in auto play)
  useEffect(() => {
    if (isAutoPlay) return;
    switch (currentMode) {
      case 'trade':
        setActiveMetric('export');
        break;
      case 'osb':
        setActiveMetric('osb');
        break;
      case 'women':
        setActiveMetric('women');
        break;
      case 'demography':
        setActiveMetric('gdp');
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

  // Active statistics for selected province
  const currentExp = getProvinceExport(selectedProvinceCode, 3); // 2025
  const currentOsb = getProvinceOSB(selectedProvinceCode);
  const currentWomenShare = getWomenShare(selectedProvinceCode, 7);
  const currentOverview = getProvinceOverview(selectedProvinceCode);

  return (
    <div className="min-h-screen bg-[#030816] text-slate-100 flex flex-col datav-grid-bg relative overflow-x-hidden selection:bg-cyan-500/30">
      {/* Background radial ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 1. SC-DataV Top Header */}
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
          {/* Box 1: Top Provinces Leaderboard */}
          <BorderBox
            title={getMetricTitle(activeMetric)}
            subtitle="İLK 8 İL"
            badge="CANLI SIRALAMA"
            className="flex-1 min-h-[300px]"
          >
            <RankingList
              activeMetric={activeMetric}
              selectedProvinceCode={selectedProvinceCode}
              onSelectProvince={(code) => setSelectedProvinceCode(code)}
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
              onSelectProvince={(code) => setSelectedProvinceCode(code)}
              activeMetric={activeMetric}
              onMetricChange={setActiveMetric}
              currentMode={currentMode}
              onModeChange={setCurrentMode}
              isAutoPlay={isAutoPlay}
              autoPlayProgress={kioskProgress}
              autoPlayStepTitle={KIOSK_STEPS[kioskStepIdx]?.label}
            />
          </div>

          {/* Center Bottom: Quick Selected Province Highlight Bar */}
          <div className="bg-[#05132d]/85 backdrop-blur-md border border-cyan-500/30 p-2.5 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-6 bg-cyan-400 rounded-xs shadow-[0_0_10px_#00f2fe]" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-['Orbitron'] font-bold text-base text-white tracking-wider">
                    {selectedName.toUpperCase()}
                  </span>
                  <span className="font-mono text-cyan-400 text-xs font-semibold">
                    (Plaka: {selectedProvinceCode})
                  </span>
                  {selectedRegion && (
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-xs">
                      {selectedRegion.agency}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300/80 font-mono mt-0.5">
                  2025 İhracat: <strong className="text-cyan-200">${(currentExp / 1e6).toFixed(1)}M</strong> · OSB: <strong className="text-cyan-200">{currentOsb.count} Adet</strong> ({currentOsb.isletmede} Faal) · Kadın Payı: <strong className="text-cyan-200">%{currentWomenShare.toFixed(1)}</strong>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsDossierOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-500 text-slate-950 font-['Rajdhani'] font-bold text-xs uppercase tracking-wider rounded-xs hover:bg-cyan-400 transition-colors shadow-[0_0_12px_rgba(0,242,254,0.4)]"
            >
              <span>İL DOSYASINI AÇ</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
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

      {/* 4. Bottom Footer Agency Regional Ticker */}
      <footer className="px-3 md:px-6 py-2 border-t border-cyan-500/15 bg-[#030919]/90 z-20 flex flex-wrap items-center justify-between text-[11px] font-mono text-cyan-400/80">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
          <span className="font-bold text-slate-300">26 KALKINMA AJANSI BÖLGESİ (NUTS-2):</span>
          <div className="hidden xl:flex items-center gap-2 text-cyan-300/60 overflow-hidden">
            {REGIONS.slice(0, 10).map((r) => (
              <span key={r.code} className="hover:text-cyan-200 transition-colors">
                {r.shortCode}
              </span>
            ))}
            <span>...</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>Kaynak: TÜİK Dış Ticaret & CIP · OSBÜK</span>
          <span>·</span>
          <span className="text-cyan-400/90 font-bold">SC-DATAV v2.0 ARCHITECTURE</span>
        </div>
      </footer>

      {/* 5. Detailed 81-Province Dossier Modal */}
      <ProvinceDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        selectedProvinceCode={selectedProvinceCode}
        onSelectProvince={(code) => setSelectedProvinceCode(code)}
      />
    </div>
  );
}
