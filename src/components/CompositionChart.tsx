import React, { useState } from 'react';
import { getProvinceOSB } from '../data/osbData';
import { PROVINCE_CODES } from '../data/regions';

interface CompositionChartProps {
  provinceCode: string;
}

export const CompositionChart: React.FC<CompositionChartProps> = ({ provinceCode }) => {
  const [viewMode, setViewMode] = useState<'osb-type' | 'osb-status'>('osb-type');
  const osb = getProvinceOSB(provinceCode);
  const provinceName = PROVINCE_CODES[provinceCode] || 'Seçili İl';

  const typeData = [
    { label: 'Karma OSB', value: osb.karma, color: '#00f2fe' },
    { label: 'İhtisas OSB', value: osb.ihtisas, color: '#4facfe' },
    { label: 'TDİOSB (Tarım/Hayvan)', value: osb.tdiosb, color: '#f6d365' },
  ].filter(d => d.value > 0);

  const statusData = [
    { label: 'Faaliyette / İşletmede', value: osb.isletmede, color: '#05ffa1' },
    { label: 'Altyapı Hazırlanıyor', value: osb.altyapi, color: '#00c6ff' },
    { label: 'Planlama Aşamasında', value: osb.planlama, color: '#f6d365' },
    { label: 'Kamulaştırma Yapılıyor', value: osb.kamulastirma, color: '#ff3366' },
  ].filter(d => d.value > 0);

  const activeData = viewMode === 'osb-type' ? typeData : statusData;
  const total = activeData.reduce((acc, curr) => acc + curr.value, 0) || osb.count || 1;

  // Compute SVG Donut angles
  let cumulative = 0;
  const slices = activeData.map((item) => {
    const startAngle = (cumulative / total) * 360;
    cumulative += item.value;
    const endAngle = (cumulative / total) * 360;
    return {
      ...item,
      startAngle,
      endAngle,
      pct: ((item.value / total) * 100).toFixed(1)
    };
  });

  // SVG donut geometry
  const size = 130;
  const center = size / 2;
  const radius = 54;
  const innerRadius = 36;

  const polarToCartesian = (centerX: number, centerY: number, rad: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + rad * Math.cos(angleInRadians),
      y: centerY + rad * Math.sin(angleInRadians)
    };
  };

  const createArc = (startAngle: number, endAngle: number) => {
    // avoid full circle glitch
    const angleDiff = endAngle - startAngle;
    const clampedEnd = angleDiff >= 360 ? startAngle + 359.99 : endAngle;

    const start = polarToCartesian(center, center, radius, clampedEnd);
    const end = polarToCartesian(center, center, radius, startAngle);
    const innerStart = polarToCartesian(center, center, innerRadius, startAngle);
    const innerEnd = polarToCartesian(center, center, innerRadius, clampedEnd);

    const largeArcFlag = angleDiff <= 180 ? '0' : '1';

    return [
      `M ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
      'Z'
    ].join(' ');
  };

  return (
    <div className="w-full h-full flex flex-col justify-between select-none">
      {/* Tab toggle */}
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="font-['Rajdhani'] font-bold text-slate-200 uppercase truncate">
          {provinceName} OSB Kompozisyonu
        </span>
        <div className="flex items-center gap-1 bg-slate-900/60 p-0.5 rounded border border-cyan-500/20 text-[10px] font-mono">
          <button
            onClick={() => setViewMode('osb-type')}
            className={`px-1.5 py-0.5 rounded-xs transition-colors ${
              viewMode === 'osb-type' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-cyan-300/80 hover:text-white'
            }`}
          >
            TÜR
          </button>
          <button
            onClick={() => setViewMode('osb-status')}
            className={`px-1.5 py-0.5 rounded-xs transition-colors ${
              viewMode === 'osb-status' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-cyan-300/80 hover:text-white'
            }`}
          >
            DURUM
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 mt-1">
        {/* Donut graphic */}
        <div className="relative w-[130px] h-[130px] shrink-0 flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
            {slices.length === 0 ? (
              <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(0, 242, 254, 0.15)" strokeWidth={18} />
            ) : (
              slices.map((slice, i) => (
                <path
                  key={i}
                  d={createArc(slice.startAngle, slice.endAngle)}
                  fill={slice.color}
                  className="transition-all duration-300 hover:brightness-125 cursor-pointer"
                />
              ))
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-['Orbitron'] font-bold text-white leading-none">
              {osb.count}
            </span>
            <span className="text-[9px] text-cyan-300/80 font-mono uppercase mt-0.5">
              Toplam OSB
            </span>
          </div>
        </div>

        {/* Legend listing */}
        <div className="flex-1 flex flex-col gap-1.5 min-w-0 pr-1">
          {activeData.length === 0 ? (
            <div className="text-xs text-slate-400 font-mono py-4 text-center">
              Bu ilde kayıtlı OSB bulunmuyor.
            </div>
          ) : (
            activeData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs font-['Rajdhani'] font-semibold">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px]" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-300 truncate text-[11px]">{d.label}</span>
                </div>
                <div className="font-mono text-cyan-300 font-bold ml-2 text-xs shrink-0">
                  {d.value} <span className="text-[10px] text-slate-400">({((d.value / total) * 100).toFixed(0)}%)</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
