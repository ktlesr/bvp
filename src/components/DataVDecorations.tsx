import React from 'react';

interface BorderBoxProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  primaryColor?: string;
}

export const BorderBox: React.FC<BorderBoxProps> = ({
  children,
  className = '',
  title,
  subtitle,
  badge,
  primaryColor = '#00f2fe'
}) => {
  return (
    <div className={`relative bg-[#061229]/80 backdrop-blur-md border border-cyan-500/20 shadow-[0_0_25px_rgba(0,242,254,0.06)] rounded-sm flex flex-col ${className}`}>
      {/* 4 Corner Angle Brackets */}
      <span className="absolute -top-[1px] -left-[1px] w-3 h-3 border-t-2 border-l-2 border-cyan-400 z-10 pointer-events-none" />
      <span className="absolute -top-[1px] -right-[1px] w-3 h-3 border-t-2 border-r-2 border-cyan-400 z-10 pointer-events-none" />
      <span className="absolute -bottom-[1px] -left-[1px] w-3 h-3 border-b-2 border-l-2 border-cyan-400 z-10 pointer-events-none" />
      <span className="absolute -bottom-[1px] -right-[1px] w-3 h-3 border-b-2 border-r-2 border-cyan-400 z-10 pointer-events-none" />

      {/* Decorative Top Accent Line */}
      <div className="absolute top-0 left-6 right-6 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

      {/* Header if title is supplied */}
      {title && (
        <div className="px-4 py-2.5 border-b border-cyan-500/15 flex items-center justify-between bg-gradient-to-r from-cyan-950/40 via-transparent to-transparent">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-3.5 bg-cyan-400 rounded-xs shadow-[0_0_8px_#00f2fe]" />
            <h3 className="font-['Rajdhani'] font-bold text-base tracking-wider text-slate-100 uppercase">
              {title}
            </h3>
            {subtitle && (
              <span className="text-xs text-cyan-300/60 font-mono tracking-tight hidden sm:inline">
                / {subtitle}
              </span>
            )}
          </div>
          {badge && (
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-xs bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {badge}
            </span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3.5 flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};

export const TechDecorationLine: React.FC<{ color?: string }> = ({ color = '#00f2fe' }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1 opacity-70">
      <div className="w-2 h-0.5 bg-cyan-400" />
      <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="w-1.5 h-1.5 rotate-45 border border-cyan-400" />
      <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
      <div className="w-2 h-0.5 bg-cyan-400" />
    </div>
  );
};

export const DigitalCounter: React.FC<{
  label: string;
  value: number | string;
  unit?: string;
  subValue?: string;
  isPositive?: boolean;
  prefix?: string;
}> = ({ label, value, unit, subValue, isPositive, prefix }) => {
  const formatted = typeof value === 'number' ? value.toLocaleString('tr-TR') : value;

  return (
    <div className="bg-[#05142e]/60 border border-cyan-500/20 px-3 py-2 rounded-xs relative overflow-hidden group hover:border-cyan-400/40 transition-colors">
      <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-200/70 truncate flex items-center justify-between">
        <span>{label}</span>
        {subValue && (
          <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {subValue}
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1 mt-1 font-['Orbitron']">
        {prefix && <span className="text-cyan-400 text-sm font-semibold">{prefix}</span>}
        <span className="text-lg md:text-xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(0,242,254,0.3)]">
          {formatted}
        </span>
        {unit && <span className="text-xs text-cyan-300/80 font-['Rajdhani'] font-semibold">{unit}</span>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
};
