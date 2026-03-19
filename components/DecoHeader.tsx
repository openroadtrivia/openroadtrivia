'use client';

interface DecoHeaderProps {
  size?: 'full' | 'medium' | 'compact' | 'mini';
  label?: string;
  title?: string;
  subtitle?: string;
  detail?: string;
  meta?: string;
  accent?: string;
  light?: string;
}

function GoldBar({ accent = '#d4a340', light = '#f5d778' }: { accent?: string; light?: string }) {
  return (
    <svg viewBox="0 0 400 5" className="block w-full">
      <rect width="400" height="5" fill={accent} />
      <rect y="2" width="400" height="1" fill={light} opacity="0.5" />
    </svg>
  );
}

export default function DecoHeader({
  size = 'full', label = '', title = '', subtitle = '', detail = '', meta = '',
  accent = '#d4a340', light = '#f5d778',
}: DecoHeaderProps) {
  if (size === 'mini') {
    return (
      <div className="deco-bg px-4 py-2 text-center">
        <div style={{ color: accent }} className="font-mono text-[7px] tracking-[5px]">{label}</div>
        <div style={{ color: light }} className="font-display text-sm font-black tracking-wider uppercase">{title}</div>
      </div>
    );
  }

  const radius = size === 'full' ? 'rounded-b-2xl' : size === 'medium' ? 'rounded-b-xl' : 'rounded-b-[10px]';
  const pad = size === 'full' ? 'px-4 pt-3.5 pb-1.5' : size === 'medium' ? 'px-4 pt-2.5 pb-1.5' : 'px-3.5 pt-2 pb-1.5';
  const titleCls = size === 'full' ? 'text-2xl tracking-wider uppercase' : size === 'medium' ? 'text-xl tracking-wide' : 'text-base tracking-wide';
  const labelCls = size === 'full' ? 'text-[8px] tracking-[6px] mb-0.5' : 'text-[7px] tracking-[4px]';
  const subCls = size === 'full' ? 'text-[13px]' : 'text-[11px]';

  return (
    <div className={`deco-bg ${radius} overflow-hidden`}>
      <GoldBar accent={accent} light={light} />
      <div className={`${pad} text-center`}>
        <div style={{ color: accent }} className={`font-mono ${labelCls}`}>{label}</div>
        <div style={{ color: light }} className={`font-display font-black ${titleCls}`}>{title}</div>
        {subtitle && <div style={{ color: accent }} className={`font-display italic ${subCls} mt-0.5`}>{subtitle}</div>}
      </div>
      {size === 'full' && (
        <svg viewBox="0 0 400 14" className="block w-full">
          <line x1="40" y1="7" x2="170" y2="7" stroke={accent} strokeWidth="1" />
          <circle cx="200" cy="7" r="3" fill={light} />
          <line x1="230" y1="7" x2="360" y2="7" stroke={accent} strokeWidth="1" />
        </svg>
      )}
      {(detail || meta) && (
        <div className={`px-4 ${size === 'full' ? 'pb-2.5' : 'pb-1.5'} text-center`}>
          {detail && <div className="text-deco-warm italic text-xs leading-relaxed">{detail}</div>}
          {meta && <div className="text-deco-muted text-[9px] font-mono mt-1">{meta}</div>}
        </div>
      )}
      <GoldBar accent={accent} light={light} />
    </div>
  );
}
