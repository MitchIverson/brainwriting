'use client';

import React from 'react';

interface CardProps {
  glow?: 'gold' | 'danger' | 'teal' | 'none';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}

export default function Card({
  glow = 'none',
  className = '',
  children,
  onClick,
  selected,
}: CardProps) {
  const glowStyles = {
    gold: 'border-gold/50 shadow-lg shadow-gold/20',
    danger: 'border-danger/50 shadow-lg shadow-danger/20',
    teal: 'border-teal/50 shadow-lg shadow-teal/20',
    none: 'border-card-border',
  };

  const selectedStyle = selected
    ? 'border-gold ring-2 ring-gold/30'
    : '';

  return (
    <div
      className={`bg-card-bg rounded-xl border p-5 ${glowStyles[glow]} ${selectedStyle} ${onClick ? 'cursor-pointer hover:border-gold/40 transition-all' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
}
