import React from 'react';
import { PROVINCE_CODES } from '../data/regions';
import { getProvinceExport } from '../data/tradeData';
import { getProvinceOSB } from '../data/osbData';
import { getWomenShare } from '../data/womenTradeData';
import { getProvinceOverview } from '../data/demographyData';

interface RadarChartProps {
  provinceCode: string;
}

export const RadarPerformanceChart: React.FC<RadarChartProps> = ({ provinceCode }) => {
  const provinceName = PROVINCE_CODES[provinceCode] || 'Seçili İl';

  const exp = getProvinceExport(provinceCode, 3);
  const osb = getProvinceOSB(provinceCode);
  const women = getWomenShare(provinceCode, 7);
  const stats = getProvinceOverview(provinceCode);

  // Normalize scores to 0-100 range
  const expScore = Math.min(100, Math.max(15, (exp / 15e9) * 100));
  const osbScore = Math.min(100, Math.max(15, (osb.count / 15) * 100));
  const womenScore = Math.min(100, Math.max(15, (women / 25) * 100));
  const popScore = Math.min(100, Math.max(15, (stats.population / 4e6) * 100));
  const gdpScore = Math.min(100, Math.max(15, (stats.gdpPerCapitaUsd / 18000) * 100));
  const eduScore = Math.min(100, Math.max(15, (stats.avgEducationYears / 11) * 100));

  const axes = [
    { label: 'İhracat', value: expScore },
    { label: 'OSB Parkı', value: osbScore },
    { label: 'Kadın Katkı', value: womenScore },
    { label: 'İşgücü', value: popScore },
    { label: 'GSYH', value: gdpScore },
    { label: 'Eğitim', value: eduScore }
  ];

  // National averages benchmark
  const nationalAvg = [55, 45, 48, 50, 52, 60];

  const size = 160;
  const center = size / 2;
  const radius = 60;
  const numAxes = axes.length;

  const getCoordinates = (value: number, index: number) => {
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const provincePolygon = axes.map((a, i) => {
    const pt = getCoordinates(a.value, i);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  const nationalPolygon = nationalAvg.map((val, i) => {
    const pt = getCoordinates(val, i);
    return `${pt.x},${pt.y}`;
  }).join(' ');

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-['Rajdhani'] font-bold text-slate-200 uppercase truncate">
          6 Boyutlu İl Yetkinlik Radarı
        </span>
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-cyan-300">
            <span className="w-2 h-0.5 bg-cyan-400" /> {provinceName}
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <span className="w-2 h-0.5 bg-slate-500" /> TR Ort.
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center relative w-full h-[140px]">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Circular/Hexagonal Grid Webs */}
          {[0.25, 0.5, 0.75, 1].map((scale, level) => {
            const webPoints = Array.from({ length: numAxes }).map((_, i) => {
              const pt = getCoordinates(scale * 100, i);
              return `${pt.x},${pt.y}`;
            }).join(' ');
            return (
              <polygon
                key={level}
                points={webPoints}
                fill="none"
                stroke="rgba(0, 242, 254, 0.15)"
                strokeWidth="1"
              />
            );
          })}

          {/* Spokes from center */}
          {axes.map((_, i) => {
            const outer = getCoordinates(100, i);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={outer.x}
                y2={outer.y}
                stroke="rgba(0, 242, 254, 0.18)"
                strokeWidth="1"
              />
            );
          })}

          {/* National average polygon */}
          <polygon
            points={nationalPolygon}
            fill="rgba(148, 163, 184, 0.15)"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="2 3"
          />

          {/* Province radar polygon */}
          <polygon
            points={provincePolygon}
            fill="rgba(0, 242, 254, 0.35)"
            stroke="#00f2fe"
            strokeWidth="2"
            className="drop-shadow-[0_0_8px_rgba(0,242,254,0.6)]"
          />

          {/* Points on radar */}
          {axes.map((a, i) => {
            const pt = getCoordinates(a.value, i);
            const outerPt = getCoordinates(115, i);
            return (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ffffff" stroke="#00f2fe" strokeWidth="1.5" />
                <text
                  x={outerPt.x}
                  y={outerPt.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="text-[8px] font-['Rajdhani'] font-bold fill-cyan-300"
                >
                  {a.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
