import React, { useState } from 'react';
import { TRADE_COMPLETED_YEARS, TRADE_ALL_YEARS, EXPORT_USD_DATA } from '../data/tradeData';
import { WOMEN_TRADE_YEARS, WOMEN_SHARE_PCT } from '../data/womenTradeData';
import { PROVINCE_CODES } from '../data/regions';

interface TrendChartProps {
  provinceCode: string;
  type?: 'export' | 'women';
}

export const TrendChart: React.FC<TrendChartProps> = ({
  provinceCode,
  type = 'export'
}) => {
  const [includePartial2026, setIncludePartial2026] = useState<boolean>(false);
  const provinceName = PROVINCE_CODES[provinceCode] || 'Türkiye Ortalaması';

  const rawValues = type === 'export'
    ? (EXPORT_USD_DATA[provinceCode] || [0, 0, 0, 0, 0])
    : (WOMEN_SHARE_PCT[provinceCode] || [0, 0, 0, 0, 0, 0, 0, 0]);

  // For export: default to completed full calendar years (2022-2025) because 2026 is unfinished
  const years = type === 'export'
    ? (includePartial2026 ? TRADE_ALL_YEARS : TRADE_COMPLETED_YEARS)
    : WOMEN_TRADE_YEARS;

  const values = type === 'export'
    ? (includePartial2026 ? rawValues : rawValues.slice(0, 4))
    : rawValues;

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);

  // Growth calculation between first year and latest completed year (2022 vs 2025)
  const firstVal = values[0] || 1;
  const latestCompletedVal = type === 'export' ? rawValues[3] : values[values.length - 1]; // 2025
  const growthPct = (((latestCompletedVal - firstVal) / firstVal) * 100);

  // SVG Chart Geometry
  const width = 360;
  const height = 135;
  const padX = 35;
  const padY = 20;

  const getX = (idx: number) => padX + (idx / Math.max(1, years.length - 1)) * (width - padX * 2);
  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return height - padY - ((val - minVal) / range) * (height - padY * 2);
  };

  const points = values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const areaPath = `${points} L${getX(values.length - 1)},${height - padY} L${getX(0)},${height - padY} Z`;

  const formatShort = (v: number) => {
    if (type === 'women') return `%${v.toFixed(1)}`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
    return v.toLocaleString('tr-TR');
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* Header with Title and Mode Note */}
      <div className="flex items-center justify-between text-xs mb-1">
        <div>
          <span className="font-['Rajdhani'] font-bold text-cyan-300 uppercase block">
            {provinceName} {type === 'export' ? 'İhracat Gelişimi' : 'Kadın İhracat Payı %'}
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {type === 'export' ? (includePartial2026 ? '2022-2026 (Ç1 Kısmi)' : '2022-2025 (Kesinleşen Tam Yıllar)') : '2018-2025'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Growth badge */}
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-xs font-bold ${
            growthPct >= 0 
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40' 
              : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
          }`}>
            {growthPct >= 0 ? `+${growthPct.toFixed(1)}% Artış` : `${growthPct.toFixed(1)}%`}
          </span>

          {/* Toggle for 2026 partial data if user wishes */}
          {type === 'export' && (
            <button
              onClick={() => setIncludePartial2026(!includePartial2026)}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded-xs bg-[#07193b] text-cyan-300 hover:text-white border border-cyan-500/30 transition-colors"
              title="2026 tamamlanmadığı için varsayılan olarak gizlidir. Açmak için tıklayın."
            >
              {includePartial2026 ? '2026 Gizle' : '+2026 Ç1'}
            </button>
          )}
        </div>
      </div>

      {/* SVG Line & Area Graph */}
      <div className="relative w-full h-[135px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="trendAreaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#00f2fe" stopOpacity="0.0" />
            </linearGradient>
            <filter id="pointGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="rgba(0, 242, 254, 0.1)" strokeDasharray="3 3" />
          <line x1={padX} y1={height / 2} x2={width - padX} y2={height / 2} stroke="rgba(0, 242, 254, 0.1)" strokeDasharray="3 3" />
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(0, 242, 254, 0.25)" />

          {/* Area gradient */}
          <polygon points={areaPath} fill="url(#trendAreaGrad)" />

          {/* Line */}
          <polyline
            fill="none"
            stroke="#00f2fe"
            strokeWidth="2.5"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_8px_rgba(0,242,254,0.65)]"
          />

          {/* Data Points and Value Callouts */}
          {values.map((v, i) => {
            const px = getX(i);
            const py = getY(v);
            const isLast = i === values.length - 1;

            return (
              <g key={i}>
                <circle
                  cx={px}
                  cy={py}
                  r="3.5"
                  fill="#ffffff"
                  stroke="#00f2fe"
                  strokeWidth="2"
                  filter="url(#pointGlow)"
                />
                
                {/* Year label */}
                <text
                  x={px}
                  y={height - 5}
                  textAnchor="middle"
                  className={`text-[9px] font-mono ${
                    years[i] === 2026 ? 'fill-amber-400 font-bold' : 'fill-cyan-400/80'
                  }`}
                >
                  {years[i]}{years[i] === 2026 ? '*' : ''}
                </text>

                {/* Top value badge on first and latest points */}
                {(i === 0 || isLast) && (
                  <text
                    x={px}
                    y={py - 8}
                    textAnchor="middle"
                    className="text-[9px] fill-white font-mono font-bold drop-shadow-[0_0_4px_#000]"
                  >
                    {formatShort(v)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {includePartial2026 && (
        <span className="text-[9px] text-amber-400/80 font-mono text-right block mt-0.5">
          * 2026 verisi yıl içi geçici dönemdir.
        </span>
      )}
    </div>
  );
};

