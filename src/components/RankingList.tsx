import React from 'react';
import { PROVINCE_CODES } from '../data/regions';
import { MapMetricType, computeProvinceMetric, formatMetricDisplay } from '../data/metricCatalog';

interface RankingListProps {
  activeMetric: MapMetricType;
  selectedProvinceCode: string;
  onSelectProvince: (code: string) => void;
}

export const RankingList: React.FC<RankingListProps> = ({
  activeMetric,
  selectedProvinceCode,
  onSelectProvince
}) => {
  // Compute metric for all 81 provinces
  const rankings = React.useMemo(() => {
    const list: { code: string; name: string; value: number }[] = [];
    for (let i = 1; i <= 81; i++) {
      const code = String(i);
      const value = computeProvinceMetric(code, activeMetric);

      list.push({
        code,
        name: PROVINCE_CODES[code] || `İl ${code}`,
        value
      });
    }
    // Sort descending
    list.sort((a, b) => b.value - a.value);
    return list;
  }, [activeMetric]);

  const top10 = rankings.slice(0, 8);
  const maxVal = top10[0]?.value || 1;

  const formatValue = (v: number) => {
    return formatMetricDisplay(activeMetric, v);
  };

  return (
    <div className="flex flex-col gap-2 h-full justify-between">
      {top10.map((item, idx) => {
        const isSelected = item.code === selectedProvinceCode;
        const pct = Math.min(100, Math.max(8, (item.value / maxVal) * 100));

        return (
          <div
            key={item.code}
            onClick={() => onSelectProvince(item.code)}
            className={`flex items-center gap-2 p-1.5 rounded-xs cursor-pointer transition-all ${
              isSelected
                ? 'bg-cyan-950/80 border border-cyan-400'
                : 'hover:bg-cyan-950/40 border border-transparent'
            }`}
          >
            {/* Rank Badge */}
            <span
              className={`w-5 h-5 flex items-center justify-center font-['Orbitron'] text-[11px] font-bold rounded-xs shrink-0 ${
                idx === 0
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_8px_#fbbf24]'
                  : idx === 1
                  ? 'bg-slate-300 text-slate-950'
                  : idx === 2
                  ? 'bg-amber-700 text-white'
                  : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30'
              }`}
            >
              {idx + 1}
            </span>

            {/* Name & Bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="font-['Rajdhani'] font-bold text-slate-200 truncate uppercase">
                  {item.name}
                </span>
                <span className="font-mono text-cyan-300 font-semibold text-[11px] ml-2 shrink-0">
                  {formatValue(item.value)}
                </span>
              </div>
              {/* Glowing progress line */}
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-200 rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,242,254,0.5)]"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
