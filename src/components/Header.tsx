import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Factory, 
  Users, 
  PieChart, 
  MapPin, 
  Maximize, 
  Minimize, 
  Play, 
  Pause, 
  Palette,
  RefreshCw,
  Search,
  Camera
} from 'lucide-react';
import { ThemeMode, THEMES } from '../utils/theme';

export type DashboardMode = 'trade' | 'osb' | 'women' | 'demography' | 'province';

interface HeaderProps {
  currentMode: DashboardMode;
  onModeChange: (mode: DashboardMode) => void;
  activeTheme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
  onOpenProvinceSearch: () => void;
  selectedProvinceName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentMode,
  onModeChange,
  activeTheme,
  onThemeChange,
  isAutoPlay,
  onToggleAutoPlay,
  onOpenProvinceSearch,
  selectedProvinceName
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('tr-TR', { hour12: false }));
      setDateStr(now.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        weekday: 'short' 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const navItems: { id: DashboardMode; label: string; icon: React.ReactNode }[] = [
    { id: 'trade', label: 'DIŞ TİCARET', icon: <Globe className="w-3.5 h-3.5" /> },
    { id: 'osb', label: 'SANAYİ & OSB', icon: <Factory className="w-3.5 h-3.5" /> },
    { id: 'women', label: 'KADIN İSTİHDAMI', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'demography', label: 'DEMOGRAFİ & SES', icon: <PieChart className="w-3.5 h-3.5" /> },
    { id: 'province', label: selectedProvinceName ? selectedProvinceName.toUpperCase() : 'İL DETAY', icon: <MapPin className="w-3.5 h-3.5 text-cyan-400" /> }
  ];

  return (
    <header className="relative w-full z-30 select-none pb-2">
      {/* Top Banner Grid Line & Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f2fe]" />

      <div className="flex items-center justify-between px-3 md:px-6 pt-2 pb-1 relative">
        {/* Left Side: Navigation Mode Tabs */}
        <div className="flex items-center gap-1.5 md:gap-2">
          {navItems.map((item) => {
            const isActive = currentMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onModeChange(item.id)}
                className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 text-xs md:text-sm font-['Rajdhani'] font-bold tracking-wider rounded-xs transition-all relative overflow-hidden ${
                  isActive
                    ? 'text-cyan-200 bg-cyan-950/70 border border-cyan-400 shadow-[0_0_12px_rgba(0,242,254,0.35)]'
                    : 'text-slate-400 hover:text-cyan-300 bg-slate-900/40 border border-cyan-500/20 hover:border-cyan-500/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_6px_#00f2fe]" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center: SC-DataV Futuristic Title Shield */}
        <div className="flex flex-col items-center justify-center pointer-events-none px-4">
          <div className="relative px-6 md:px-12 py-1 bg-gradient-to-b from-[#081a3d] to-[#040c1e] border-x border-b border-cyan-400/50 shadow-[0_4px_25px_rgba(0,242,254,0.25)] [clip-path:polygon(0_0,100%_0,88%_100%,12%_100%)]">
            <h1 className="font-['Orbitron'] font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-200 to-cyan-400 text-sm md:text-xl text-center uppercase drop-shadow-[0_0_12px_rgba(0,242,254,0.6)]">
              TÜRKİYE BÖLGESEL VERİ PORTALI
            </h1>
            <div className="flex items-center justify-center gap-2 text-[9px] md:text-[10px] text-cyan-300/80 font-mono tracking-widest uppercase">
              <span>SC-DATAV COMMAND CENTER</span>
              <span>·</span>
              <span className="text-emerald-400 font-bold animate-pulse">● CANLI VERİ AKIŞI</span>
            </div>
          </div>
          {/* Subtle wing lines */}
          <div className="flex items-center w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent mt-0.5" />
        </div>

        {/* Right Side: Tools, Live Clock, Fullscreen */}
        <div className="flex items-center gap-2 md:gap-3 text-xs font-mono text-cyan-300/90">
          {/* PNG Snapshot Button */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('export-map-png'))}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-[#07193b]/70 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-xs transition-colors"
            title="3D Harita Görüntüsünü PNG Olarak İndir"
          >
            <Camera className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline font-['Rajdhani'] font-semibold">PNG İNDİR</span>
          </button>

          {/* Quick Province Search Button */}
          <button
            onClick={onOpenProvinceSearch}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs bg-[#07193b]/70 border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-xs transition-colors"
            title="81 İl Arama"
          >
            <Search className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden lg:inline font-['Rajdhani'] font-semibold">İL BUL</span>
          </button>

          {/* Auto carousel / play toggle */}
          <button
            onClick={onToggleAutoPlay}
            className={`p-1.5 rounded-xs border transition-colors ${
              isAutoPlay 
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300' 
                : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
            }`}
            title={isAutoPlay ? "Otomatik Geçişi Durdur" : "Otomatik Görünüm Geçişi"}
          >
            {isAutoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xs bg-[#07193b]/70 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition-colors"
            title="Tam Ekran"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Real-Time Digital Clock - Fixed Width & Tabular Numbers to Prevent Jitter */}
          <div className="hidden sm:flex flex-col items-end pl-2.5 border-l border-cyan-500/20 w-[100px] shrink-0 text-right select-none">
            <span className="text-sm font-['Orbitron'] font-bold text-white tracking-wider tabular-nums font-mono w-full inline-block text-right">
              {timeStr}
            </span>
            <span className="text-[10px] text-cyan-400/70 font-mono tracking-tight tabular-nums w-full inline-block text-right whitespace-nowrap">
              {dateStr}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
