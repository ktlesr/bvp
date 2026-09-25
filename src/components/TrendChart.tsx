import React from 'react';
import { TRADE_YEARS, EXPORT_USD_DATA } from '../data/tradeData';
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
  const provinceName = PROVINCE_CODES[provinceCode] || 'Türkiye Ortalaması';

  const years = type === 'export' ? TRADE_YEARS : WOMEN_TRADE_YEARS;
  const values = type === 'export' 
    ? (EXPORT_USD_DATA[provinceCode] || [0, 0, 0, 0, 0])
    : (WOMEN_SHARE_PCT[provinceCode] || [0, 0, 0, 0, 0, 0, 0, 0]);

  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);

  // SVG Chart Geometry
  const width = 360;
  const height = 140;
  const padX = 35;
  const padY = 20;

  const getX = (idx: number) => padX + (idx / (years.length - 1)) * (width - padX * 2);
  const getY = (val: number) => {
    const range = maxVal - minVal || 1;
    return height - padY - ((val - minVal) / range) * (height - padY * 2);
  };

  const points = values.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
  const areaPath = `${points} L${getX(values.length - 1)},${height - padY} L${getX(0)},${height - padY} Z`;

  const formatShort = (v: number) => {
    if (type === 'women') return `%${v.toFixed(1)}`;
    if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
    if (v >= 1e6) return `$${(v / 1e6).toFixed(0)}M`;
    return v.toLocaleString('tr-TR');
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-['Rajdhani'] font-bold text-cyan-300 uppercase">
          {provinceName} {type === 'export' ? 'Yıllık İhracat Trendi' : 'Kadın İhracat Payı %'}
        </span>
        <span className="text-[10px] font-mono text-cyan-400/80">
          ZİRVE: {formatShort(maxVal)}
        </span>
      </div>

      <div className="relative w-full h-[140px]">
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
          <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="rgba(0, 242, 254, 0.2)" />

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
            className="drop-shadow-[0_0_6px_rgba(0,242,254,0.6)]"
          />

          {/* Data Points */}
          {values.map((v, i) => (
            <g key={i}>
              <circle
                cx={getX(i)}
                cy={getY(v)}
                r="3.5"
                fill="#ffffff"
                stroke="#00f2fe"
                strokeWidth="2"
                filter="url(#pointGlow)"
              />
              {/* Year label */}
              <text
                x={getX(i)}
                y={height - 5}
                textAnchor="middle"
                className="text-[9px] fill-cyan-400/70 font-mono"
              >
                {years[i]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
