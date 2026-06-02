import React from 'react';
import { useSettings } from '../contexts/SettingsContext';

export default function Logo({ className = "" }: { className?: string }) {
  const { resolvedTheme } = useSettings();
  const logoSrc = resolvedTheme === 'dark' ? '/logo_dark.png' : '/logo_light.png';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src={logoSrc} 
        alt="Authentic Holiday Homes" 
        className="h-10 w-auto object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
