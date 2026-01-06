/**
 * Mechasense Logo Component
 * Uses the actual logo image
 */

import Image from 'next/image';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function MechasenseLogo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 64,
  };
  
  const logoSize = sizeMap[size];
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <Image
        src="/logo/logo.jpeg"
        alt="Mechasense Logo"
        width={logoSize}
        height={logoSize}
        className="rounded-lg"
        priority
      />
      
      {/* Text Logo */}
      {showText && (
        <span 
          className="text-xl font-bold text-white"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Mechasense
        </span>
      )}
    </div>
  );
}

/**
 * Logo for use on white/light backgrounds
 */
export function MechasenseLogoDark({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizeMap = {
    sm: 32,
    md: 40,
    lg: 64,
  };
  
  const logoSize = sizeMap[size];
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Image */}
      <Image
        src="/logo/logo.jpeg"
        alt="Mechasense Logo"
        width={logoSize}
        height={logoSize}
        className="rounded-lg"
        priority
      />
      
      {/* Text Logo - Dark for light backgrounds */}
      {showText && (
        <span 
          className="text-xl font-bold text-primary"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          Mechasense
        </span>
      )}
    </div>
  );
}
