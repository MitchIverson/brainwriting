'use client';

import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({
  value,
  onChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  const sizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex gap-1" onMouseLeave={() => setHovered(0)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = hovered ? star <= hovered : star <= value;
        return (
          <button
            key={star}
            type="button"
            disabled={readonly}
            className={`${sizes[size]} transition-all duration-150 ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            } ${filled ? 'grayscale-0' : 'grayscale opacity-30'}`}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readonly && setHovered(star)}
          >
            ⭐
          </button>
        );
      })}
    </div>
  );
}
