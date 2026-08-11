import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, className = '', padding = 'lg' }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-6',
  };

  return (
    <div className={`bg-white rounded-xl border border-navy-200 shadow-premium ${paddingClasses[padding]} ${className}`}>
      {children}
    </div>
  );
}
