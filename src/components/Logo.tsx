import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  return (
    <div className={`flex items-center ${className}`}>
      {/* Document with Arrow Icon */}
      <div className="flex items-center mr-3">
        <div className="relative">
          {/* Document */}
          <div className="w-10 h-8 bg-teal-600 rounded-lg flex flex-col p-1.5">
            {/* Document corner */}
            <div className="w-2 h-2 bg-white rounded-sm mb-1"></div>
            {/* Text lines */}
            <div className="w-3 h-0.5 bg-white mb-0.5"></div>
            <div className="w-5 h-0.5 bg-white mb-0.5"></div>
            <div className="w-4 h-0.5 bg-white mb-0.5"></div>
            <div className="w-2 h-0.5 bg-white"></div>
          </div>
          
          {/* Curved Arrow */}
          <svg className="absolute -bottom-1 -left-1 w-6 h-6" viewBox="0 0 24 24">
            <path d="M2,20 Q8,16 16,12 Q20,8 22,4" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <path d="M20,2 L22,4 L20,6" stroke="#10B981" strokeWidth="2" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      
      <span className={`font-bold ${sizeClasses[size]} text-teal-700`} style={{ fontFamily: 'Inter, sans-serif' }}>
        FlowInvoicer
      </span>
    </div>
  );
};

export default Logo;
