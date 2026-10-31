import React from 'react';

export const StatCard = ({ title, value, icon: Icon, color = 'primary', subtext, trend }) => {
  const colorStyles = {
    primary: {
      bg: 'bg-blue-50',
      icon: 'text-[#163A63]',
      accent: 'border-l-4 border-l-[#163A63]',
    },
    secondary: {
      bg: 'bg-teal-50',
      icon: 'text-[#0F9D94]',
      accent: 'border-l-4 border-l-[#0F9D94]',
    },
    warning: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      accent: 'border-l-4 border-l-amber-500',
    },
    success: {
      bg: 'bg-emerald-50',
      icon: 'text-emerald-600',
      accent: 'border-l-4 border-l-emerald-500',
    },
  };

  const style = colorStyles[color] || colorStyles.primary;

  return (
    <div className={`card-institutional p-5 ${style.accent} flex items-start justify-between`}>
      <div className="space-y-1">
        <p className="text-xs font-semibold tracking-wide uppercase text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-[#172B4D]">{value ?? '—'}</p>
        {subtext && <p className="text-xs text-slate-500 mt-1">{subtext}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl ${style.bg} ${style.icon} flex items-center justify-center`}>
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  );
};

export default StatCard;
