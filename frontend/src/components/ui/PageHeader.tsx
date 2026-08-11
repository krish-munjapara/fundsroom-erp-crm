import type { ReactNode } from 'react';

interface PageHeaderProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}

export default function PageHeader({ icon, title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-center space-x-3 min-w-0">
        <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-sm-premium">
          {icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-[1.75rem] leading-tight font-semibold text-navy-900 tracking-tight truncate">{title}</h1>
          <p className="text-[15px] text-navy-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
