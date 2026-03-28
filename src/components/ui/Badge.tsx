'use client';

import React from 'react';

interface BadgeProps {
  variant?: 'gold' | 'teal' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const variants = {
    gold: 'bg-gold/15 text-gold border-gold/30',
    teal: 'bg-teal/15 text-teal border-teal/30',
    danger: 'bg-danger/15 text-danger border-danger/30',
    neutral: 'bg-card-bg text-text-secondary border-card-border',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
