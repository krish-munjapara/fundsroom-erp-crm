interface FundsroomLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon-only';
  className?: string;
}

export default function FundsroomLogo({ size = 'md', variant = 'full', className = '' }: FundsroomLogoProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Premium Logo Mark - Abstract geometric "F" suggesting business flow */}
      <div className={`${sizeClasses[size]} relative`}>
        <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Background circle */}
          <circle cx="20" cy="20" r="20" fill="url(#logoGradient)" />
          
          {/* Abstract F shape - geometric, modern, suggesting upward growth */}
          <path d="M12 10H28V14H16V18H26V22H16V30H12V10Z" fill="white" />
          
          {/* Accent dot suggesting data point/transaction */}
          <circle cx="30" cy="30" r="3" fill="white" fillOpacity="0.8" />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4F46E5" />
              <stop offset="100%" stopColor="#3730A3" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Brand Name */}
      {variant === 'full' && (
        <div className="ml-2.5 flex flex-col">
          <span className={`${textSizeClasses[size]} font-bold text-[#111827] tracking-tight leading-none`}>
            FUNDSROOM
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] text-[#64748B] font-medium tracking-wide mt-0.5">
              ERP + CRM
            </span>
          )}
        </div>
      )}
    </div>
  );
}
