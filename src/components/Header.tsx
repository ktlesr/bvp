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
  autoPlayProgress?: number;
  autoPlayStepTitle?: string;
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
  autoPlayProgress = 0,
  autoPlayStepTitle,
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

  return (
    <header className="relative w-full z-30 select-none pb-2">
      {/* Top Banner Grid Line & Ambient Glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#00f2fe]" />

      <div className="flex items-center justify-between px-3 md:px-6 pt-2 pb-1 relative">
        {/* Left Side: Brand Logo, Portal Title & Status */}
        <div className="flex items-center gap-3">
          {/* Futuristic Hex/Shield Emblem */}
          <div className="w-10 h-10 rounded-sm bg-gradient-to-br from-cyan-400/20 via-blue-900/60 to-cyan-500/30 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,242,254,0.4)] shrink-0">
            <Globe className="w-5 h-5 text-cyan-300 animate-[spin_24s_linear_infinite]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Orbitron'] font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-cyan-400 text-sm md:text-lg uppercase drop-shadow-[0_0_12px_rgba(0,242,254,0.6)]">
                TÜRKİYE BÖLGESEL VERİ PORTALI
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs bg-cyan-950/80 border border-cyan-500/40 text-[9px] font-mono text-cyan-300">
                SC-DATAV v2.5
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-0.5">
              <span className="text-cyan-400 font-semibold">T.C. SANAYİ VE TEKNOLOJİ BAKANLIĞI</span>
              <span className="opacity-50">·</span>
              <span className="hidden md:inline">KALKINMA AJANSLARI</span>
              <span className="opacity-50 hidden md:inline">·</span>
              <span className="text-emerald-400 font-bold inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                CANLI VERİ AKIŞI
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Province Dossier Quick Access, Tools, Kiosk, Clock */}
        <div className="flex items-center gap-2 md:gap-3 text-xs font-mono text-cyan-300/90">
          {/* Quick Province Dossier Button */}
          <button
            onClick={onOpenProvinceSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-cyan-950/70 border border-cyan-400/60 hover:border-cyan-300 text-cyan-200 text-xs transition-all shadow-[0_0_12px_rgba(0,242,254,0.25)] hover:shadow-[0_0_16px_rgba(0,242,254,0.4)]"
            title="81 İl Karnesi, Karşılaştırma ve Detaylı Arama"
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-400 animate-bounce" />
            <span className="font-['Rajdhani'] font-bold tracking-wider">
              {selectedProvinceName ? selectedProvinceName.toUpperCase() : 'İL DETAY'}
            </span>
          </button>

          {/* Auto carousel / play toggle & live progress */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleAutoPlay}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xs border transition-all ${
                isAutoPlay 
                  ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_12px_rgba(0,242,254,0.35)]' 
                  : 'bg-slate-900/60 border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-cyan-500/30'
              }`}
              title={isAutoPlay ? "Otomatik Sunumu Durdur" : "Sinematik Kiosk Sunumunu Başlat (Otomatik Dönüş & Lider Vurgusu)"}
            >
              {isAutoPlay ? (
                <Pause className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
              ) : (
                <Play className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className={`text-[11px] font-['Rajdhani'] font-bold tracking-wider hidden sm:inline ${
                isAutoPlay ? 'text-cyan-200' : 'text-slate-300'
              }`}>
                {isAutoPlay ? 'CANLI SUNUM' : 'OTOMATİK'}
              </span>
            </button>

            {/* Countdown Progress Indicator */}
            {isAutoPlay && (
              <div 
                className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xs bg-[#07193b]/90 border border-cyan-500/40 text-[10px] font-mono text-cyan-300"
                title="Sonraki temaya geçiş için kalan süre"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="truncate max-w-[120px] font-['Rajdhani'] font-bold uppercase text-slate-200">
                  {autoPlayStepTitle || 'CANLI GEÇİŞ'}
                </span>
                <div className="w-12 h-1.5 bg-slate-950/80 rounded-full overflow-hidden border border-cyan-500/30 shrink-0">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-100 ease-linear"
                    style={{ width: `${Math.min(100, Math.max(0, autoPlayProgress))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="relative hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xs bg-[#07193b]/80 border border-cyan-500/30 hover:border-cyan-400 transition-colors">
            <Palette className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <select
              value={activeTheme}
              onChange={(e) => onThemeChange(e.target.value as ThemeMode)}
              className="bg-transparent text-xs text-cyan-300 font-['Rajdhani'] font-bold focus:outline-none cursor-pointer pr-1"
              title="Arayüz Neon Tema Rengi"
            >
              <option value="cyber-blue" className="bg-[#040e20] text-cyan-300">Siber Mavi</option>
              <option value="gold-titanium" className="bg-[#181105] text-amber-400">Kehribar Altın</option>
              <option value="emerald-tech" className="bg-[#031c11] text-emerald-400">Neon Zümrüt</option>
              <option value="crimson-command" className="bg-[#1f0610] text-rose-400">Kızıl Komuta</option>
            </select>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xs bg-[#07193b]/70 border border-cyan-500/30 hover:border-cyan-400 text-cyan-300 transition-colors"
            title="Tam Ekran"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Real-Time Digital Clock - Tabular Numbers */}
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
