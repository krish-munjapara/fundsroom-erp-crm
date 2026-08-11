import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'indigo' | 'amber' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  /** Use for currency/large numeric values that must not overlap */
  compactValue?: boolean;
}

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  trend,
  trendValue,
  compactValue = false,
}: KPICardProps) {
  const colorClasses = {
    blue: { bg: 'bg-primary-100', text: 'text-primary-600' },
    green: { bg: 'bg-success-100', text: 'text-success-600' },
    purple: { bg: 'bg-violet-100', text: 'text-violet-600' },
    indigo: { bg: 'bg-primary-100', text: 'text-primary-600' },
    amber: { bg: 'bg-warning-100', text: 'text-warning-600' },
    red: { bg: 'bg-danger-100', text: 'text-danger-600' },
  };

  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';
  const trendColor = trend === 'up' ? 'text-success-600' : trend === 'down' ? 'text-danger-600' : 'text-navy-500';

  return (
    <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-5 sm:p-6 hover:shadow-lg-premium transition-shadow duration-200 min-w-0 h-full">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${colorClasses[color].bg} flex items-center justify-center shrink-0`}
        >
          <div className={`${colorClasses[color].text} flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6`}>
            {icon}
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center text-xs font-medium shrink-0 ${trendColor}`}>
            <span>
              {trendIcon} {trendValue}
            </span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-navy-600 mb-1 truncate">{title}</p>
      <p
        className={`font-bold text-navy-900 mb-1 tabular-nums leading-tight whitespace-nowrap overflow-hidden text-ellipsis ${
          compactValue
            ? 'text-[clamp(1.125rem,2.2vw,1.75rem)]'
            : 'text-2xl sm:text-3xl'
        }`}
      >
        {value}
      </p>
      {subtitle && <p className="text-xs text-navy-500 truncate">{subtitle}</p>}
    </div>
  );
}
