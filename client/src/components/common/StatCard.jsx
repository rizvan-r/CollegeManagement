import React from 'react';

export const StatCard = ({
  title,
  value,
  icon,
  subtext,
  trend,
  progress,
  progressColor = 'bg-[#0f172a]',
  badge,
  badgeType = 'sky',
}) => {
  const getBadgeClass = (type) => {
    switch (type) {
      case 'emerald':
        return 'badge-emerald';
      case 'rose':
        return 'badge-rose';
      case 'amber':
        return 'badge-amber';
      case 'sky':
      default:
        return 'badge-sky';
    }
  };

  return (
    <div className="card-stitch p-4 sm:p-5 flex flex-col justify-between bg-white relative overflow-hidden">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#515f74] uppercase tracking-wider">
          {title}
        </span>
        {icon && (
          <span className="material-symbols-outlined text-[#515f74] text-[20px]">
            {icon}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-2.5">
        <span className="text-2xl sm:text-3xl font-bold text-[#0b1c30] tracking-tight">
          {value ?? '—'}
        </span>
        {badge && (
          <span className={getBadgeClass(badgeType)}>
            {badge}
          </span>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-2.5 pt-2 border-t border-[#e2e8f0]/60 flex items-center justify-between text-xs text-[#515f74]">
          <span>{subtext}</span>
          {trend && (
            <span className="font-mono text-xs font-semibold text-[#0b1c30]">
              {trend}
            </span>
          )}
        </div>
      )}

      {progress !== undefined && (
        <div className="w-full bg-[#eff4ff] h-1.5 rounded-full mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default StatCard;
