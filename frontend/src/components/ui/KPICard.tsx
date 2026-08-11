import type { ReactNode } from 'react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'indigo' | 'amber' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export default function KPICard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  color = 'blue',
  trend,
  trendValue 
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
    <div className="bg-white rounded-xl border border-navy-200 shadow-premium p-6 hover:shadow-lg-premium transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-14 h-14 rounded-xl ${colorClasses[color].bg} flex items-center justify-center shadow-sm`}>
          <div className={colorClasses[color].text}>
            {icon}
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center text-xs font-medium ${trendColor}`}>
            <span>{trendIcon} {trendValue}</span>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-navy-600 mb-1">{title}</p>
      <p className="text-3xl font-bold text-navy-900 mb-1">{value}</p>
      {subtitle && <p className="text-xs text-navy-500">{subtitle}</p>}
    </div>
  );
}
