import React, { ButtonHTMLAttributes } from 'react';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  isLoading?: boolean;
  className?: string;
}

const GlassButton: React.FC<GlassButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading = false,
  className = '',
  disabled,
  ...props 
}) => {
  const baseClasses = 'glassmorphism px-6 py-2 font-medium flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantClasses = {
    primary: 'bg-white/10 hover:bg-white/20 text-white border-white/20',
    secondary: 'bg-black/20 hover:bg-black/30 text-white border-white/10',
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <div className="loading-spinner mr-2" />}
      <span>{children}</span>
    </button>
  );
};

export default GlassButton; 
 