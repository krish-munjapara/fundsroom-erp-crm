import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
}

export default function Badge({ children, variant = 'neutral', size = 'md' }: BadgeProps) {
  const variantClasses = {
    success: 'bg-success-100 text-success-800 border-success-200',
    warning: 'bg-warning-100 text-warning-800 border-warning-200',
    danger: 'bg-danger-100 text-danger-800 border-danger-200',
    info: 'bg-primary-100 text-primary-800 border-primary-200',
    neutral: 'bg-navy-100 text-navy-800 border-navy-200',
  };
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
}
