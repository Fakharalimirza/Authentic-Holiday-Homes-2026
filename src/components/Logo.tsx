import React from 'react';

export default function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img 
        src="/logo.png" 
        alt="Authentic Holiday Homes" 
        className="h-10 w-auto object-contain"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
