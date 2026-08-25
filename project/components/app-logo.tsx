'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AppLogoProps {
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

export function AppLogo({ className = 'h-10 w-10 object-contain drop-shadow-sm', alt = 'SCNJOBS', style }: AppLogoProps) {
  return (
    <>
      <img src="/logo.png?v=3" alt={alt} style={style} className={cn(className, 'dark:hidden')} />
      <img src="/logo-dark.png?v=3" alt={alt} style={style} className={cn(className, 'hidden dark:block')} />
    </>
  );
}
