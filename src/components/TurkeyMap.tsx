import React, { useState, useEffect, useMemo, useRef } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { ZoomIn, ZoomOut, RotateCcw, MapPin, Sparkles } from 'lucide-react';
import { PROVINCE_CODES, REGIONS } from '../data/regions';
import { getProvinceExport } from '../data/tradeData';
import { getProvinceOSB } from '../data/osbData';
import { getWomenShare } from '../data/womenTradeData';
import { getProvinceOverview } from '../data/demographyData';
import defaultGeoData from '../data/nuts3.geo.json';

export type MapMetricType = 'export' | 'osb' | 'women' | 'population' | 'gdp';

interface TurkeyMapProps {
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
  activeMetric: MapMetricType;
  onMetricChange?: (metric: MapMetricType) => void;
  metricYear?: number;
}

// Major economic hub coordinates for animated flight/flow pulses
const MAJOR_HUBS: { name: string; code: string; coords: [number, number] }[] = [
  { name: 'İSTANBUL', code: '34', coords: [28.9784, 41.0082] },
  { name: 'KOCAELİ', code: '41', coords: [29.9400, 40.7650] },
  { name: 'BURSA', code: '16', coords: [29.0610, 40.1885] },
  { name: 'İZMİR', code: '35', coords: [27.1428, 38.4237] },
  { name: 'ANKARA', code: '6', coords: [32.8597, 39.9334] },
  { name: 'GAZİANTEP', code: '27', coords: [37.3833, 37.0662] },
  { name: 'DENİZLİ', code: '20', coords: [29.0875, 37.7765] },
  { name: 'MANİSA', code: '45', coords: [27.4260, 38.6191] },
  { name: 'SAKARYA', code: '54', coords: [30.4060, 40.7569] },
  { name: 'ADANA', code: '1', coords: [35.3213, 37.0000] },
];

export const TurkeyMap: React.FC<TurkeyMapProps> = ({
  selectedProvinceCode,
  onSelectProvince,
  activeMetric,
  onMetricChange,
  metricYear = 2025
}) => {
  const [geoData, setGeoData] = useState<any>(defaultGeoData);
  const [hoveredProvince, setHoveredProvince] = useState<{
    code: string;
    name: string;
    value: number;
    agency?: string;
    x: number;
    y: number;
  } | null>(null);

  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load geojson on mount
  useEffect(() => {
    fetch('/nuts3.geo.json')
      .then((r) => r.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error('Map loading error:', err));
  }, []);

  // Compute metric value for a given province code
  const getMetricValue = (code: string): number => {
    switch (activeMetric) {
      case 'export':
        return getProvinceExport(code, 3); // 2025
      case 'osb':
        return getProvinceOSB(code).count;
      case 'women':
        return getWomenShare(code, 7); // 2025
      case 'population':
        return getProvinceOverview(code).population;
      case 'gdp':
        return getProvinceOverview(code).gdpPerCapitaUsd;
      default:
        return getProvinceExport(code, 3);
    }
  };

  // Find min and max for active metric across all 81 provinces
  const { minVal, maxVal } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    for (let i = 1; i <= 81; i++) {
      const v = getMetricValue(String(i));
      if (v < min) min = v;
      if (v > max) max = v;
    }
    return { minVal: min === Infinity ? 0 : min, maxVal: max === -Infinity ? 100 : max };
  }, [activeMetric]);

  // Color generator based on value range (cyan/electric blue gradient for cyber aesthetic)
  const getColor = (val: number, isSelected: boolean) => {
    if (isSelected) return '#f6d365'; // Vibrant gold for selected
    if (maxVal === minVal) return 'rgba(0, 242, 254, 0.4)';
    const ratio = Math.max(0, Math.min(1, (val - minVal) / (maxVal - minVal)));
    
    // Multi-step cyber color interpolation: deep navy -> cyan -> electric blue -> bright neon
    if (ratio < 0.2) return 'rgba(10, 36, 74, 0.75)';
    if (ratio < 0.4) return 'rgba(12, 65, 120, 0.8)';
    if (ratio < 0.6) return 'rgba(0, 132, 196, 0.85)';
    if (ratio < 0.8) return 'rgba(0, 185, 230, 0.9)';
    return 'rgba(0, 242, 254, 0.95)';
  };

  // d3 projection
  const width = 860;
  const height = 480;

  const projection = useMemo(() => {
    return geoMercator()
      .center([35.2, 39.0])
      .scale(2750 * zoom)
      .translate([width / 2 + pan.x, height / 2 + pan.y]);
  }, [zoom, pan]);

  const pathGenerator = useMemo(() => geoPath().projection(projection), [projection]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const formatMetricVal = (v: number) => {
    if (activeMetric === 'women') return `%${v.toFixed(1)}`;
    if (activeMetric === 'export') {
      if (v >= 1e9) return `$${(v / 1e9).toFixed(2)} Milyar`;
      if (v >= 1e6) return `$${(v / 1e6).toFixed(1)} Milyon`;
      return `$${v.toLocaleString('tr-TR')}`;
    }
    if (activeMetric === 'gdp') return `$${v.toLocaleString('tr-TR')}`;
    return v.toLocaleString('tr-TR');
  };

  return (
    <div className="relative w-full h-full min-h-[460px] flex flex-col items-center justify-center overflow-hidden bg-[#040e24]/70 rounded-xs border border-cyan-500/20 select-none">
      {/* Background Holographic Grid Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 50%, rgba(0, 242, 254, 0.15) 0%, transparent 70%),
            linear-gradient(to right, rgba(0, 242, 254, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 242, 254, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 30px 30px, 30px 30px'
        }}
      />

      {/* Top Left: Map Metric Selectors */}
      <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-1.5 bg-[#030919]/80 backdrop-blur-md p-1 rounded border border-cyan-500/30">
        {[
          { id: 'export' as MapMetricType, label: 'İHRACAT' },
          { id: 'osb' as MapMetricType, label: 'OSB SAYISI' },
          { id: 'women' as MapMetricType, label: 'KADIN PAYI %' },
          { id: 'population' as MapMetricType, label: 'NÜFUS' },
          { id: 'gdp' as MapMetricType, label: 'GSYH/KİŞİ' }
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => onMetricChange && onMetricChange(btn.id)}
            className={`px-2 py-1 text-[11px] font-['Rajdhani'] font-bold tracking-wider transition-colors rounded-xs ${
              activeMetric === btn.id
                ? 'bg-cyan-500 text-[#030919] shadow-[0_0_8px_#00f2fe]'
                : 'text-cyan-300/80 hover:text-cyan-100 hover:bg-cyan-950/40'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Top Right: Zoom and Pan Tools */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1 bg-[#030919]/80 backdrop-blur-md p-1 rounded border border-cyan-500/30 text-cyan-300">
        <button 
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.2))} 
          className="p-1 hover:text-white hover:bg-cyan-500/20 rounded transition-colors"
          title="Yakınlaştır"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => setZoom((z) => Math.max(0.7, z - 0.2))} 
          className="p-1 hover:text-white hover:bg-cyan-500/20 rounded transition-colors"
          title="Uzaklaştır"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
          className="p-1 hover:text-white hover:bg-cyan-500/20 rounded transition-colors"
          title="Görünümü Sıfırla"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SVG Canvas */}
      <div 
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full max-h-[520px]"
        >
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="hubGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#4facfe" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Provinces Paths */}
          {geoData && geoData.features && (
            <g>
              {geoData.features.map((feature: any) => {
                const code = String(feature.properties.duzeyKodu);
                const name = PROVINCE_CODES[code] || feature.properties.name;
                const value = getMetricValue(code);
                const isSelected = code === selectedProvinceCode;
                const fillColor = getColor(value, isSelected);

                return (
                  <path
                    key={code}
                    d={pathGenerator(feature) || ''}
                    fill={fillColor}
                    stroke={isSelected ? '#ffffff' : 'rgba(0, 242, 254, 0.45)'}
                    strokeWidth={isSelected ? 2 : 0.65}
                    filter={isSelected ? 'url(#glow)' : undefined}
                    className="transition-colors duration-150 hover:brightness-125 cursor-pointer"
                    onMouseEnter={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      // Find agency
                      const reg = REGIONS.find((r) => r.provinces.some((p) => p.toLowerCase() === name.toLowerCase()));
                      setHoveredProvince({
                        code,
                        name,
                        value,
                        agency: reg?.shortCode,
                        x: e.clientX,
                        y: e.clientY
                      });
                    }}
                    onMouseLeave={() => setHoveredProvince(null)}
                    onClick={() => onSelectProvince(code)}
                  />
                );
              })}
            </g>
          )}

          {/* Animated Major Hub Pins and Flight Arcs */}
          {geoData && (
            <g className="pointer-events-none">
              {/* Flight Arcs connecting Istanbul to other major centers */}
              {MAJOR_HUBS.slice(1).map((hub, idx) => {
                const istPos = projection(MAJOR_HUBS[0].coords);
                const hubPos = projection(hub.coords);
                if (!istPos || !hubPos) return null;
                const dx = hubPos[0] - istPos[0];
                const dy = hubPos[1] - istPos[1];
                const dr = Math.sqrt(dx * dx + dy * dy) * 1.2;
                return (
                  <path
                    key={`arc-${idx}`}
                    d={`M${istPos[0]},${istPos[1]}A${dr},${dr} 0 0,1 ${hubPos[0]},${hubPos[1]}`}
                    fill="none"
                    stroke="rgba(0, 242, 254, 0.25)"
                    strokeWidth="1"
                    strokeDasharray="4 6"
                  />
                );
              })}

              {/* Pulsing Hub Points */}
              {MAJOR_HUBS.map((hub, i) => {
                const pos = projection(hub.coords);
                if (!pos) return null;
                return (
                  <g key={`hub-${i}`} transform={`translate(${pos[0]}, ${pos[1]})`}>
                    <circle r="4" fill="#00f2fe" filter="url(#glow)" />
                    <circle r="9" fill="none" stroke="#00f2fe" strokeWidth="1" opacity="0.6">
                      <animate attributeName="r" values="4;14;4" dur="2.8s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0;0.8" dur="2.8s" repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredProvince && (
        <div 
          className="fixed pointer-events-none z-50 px-3 py-2 bg-[#061533]/95 border border-cyan-400/60 shadow-[0_0_20px_rgba(0,242,254,0.4)] rounded-xs backdrop-blur-md"
          style={{
            left: `${hoveredProvince.x + 14}px`,
            top: `${hoveredProvince.y - 45}px`
          }}
        >
          <div className="flex items-center gap-1.5 text-xs font-['Rajdhani'] font-bold text-white uppercase tracking-wider">
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span>{hoveredProvince.name}</span>
            <span className="text-cyan-400 text-[10px] font-mono">({hoveredProvince.code})</span>
            {hoveredProvince.agency && (
              <span className="ml-1 text-[9px] px-1 py-0.2 bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                {hoveredProvince.agency}
              </span>
            )}
          </div>
          <div className="mt-1 text-sm font-['Orbitron'] font-bold text-cyan-200">
            {formatMetricVal(hoveredProvince.value)}
          </div>
        </div>
      )}

      {/* Bottom Map Legend Bar */}
      <div className="absolute bottom-3 left-4 z-20 flex flex-col gap-1 bg-[#030919]/80 backdrop-blur-md px-3 py-1.5 rounded-xs border border-cyan-500/30">
        <div className="flex items-center justify-between text-[10px] font-mono text-cyan-300/80">
          <span>DÜŞÜK: {formatMetricVal(minVal)}</span>
          <span className="ml-4">YÜKSEK: {formatMetricVal(maxVal)}</span>
        </div>
        <div className="w-48 h-2 rounded-xs bg-gradient-to-r from-[#0a244a] via-[#0084c4] to-[#00f2fe] border border-cyan-400/40" />
      </div>

      {/* Bottom Right: Quick selection indicator */}
      <div className="absolute bottom-3 right-4 z-20 text-[11px] font-mono text-cyan-300/80 bg-[#030919]/80 backdrop-blur-md px-2.5 py-1 rounded-xs border border-cyan-500/30">
        SEÇİLİ İL: <span className="font-bold text-white">{PROVINCE_CODES[selectedProvinceCode] || 'ADANA'}</span>
      </div>
    </div>
  );
};
