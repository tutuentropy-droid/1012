import { useState, useMemo } from 'react';
import type { Rating } from '@/types';
import { RATING_LABELS } from '@/types';

interface Props {
  value: Rating;
  onChange?: (rating: Rating) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const SEAL_TEXTS: Record<Rating, string> = {
  0: '',
  1: '下',
  2: '次',
  3: '中',
  4: '上',
  5: '上上品',
};

export default function SealStamp({ value, onChange, readonly = false, size = 'md', showLabel = true }: Props) {
  const [hoverValue, setHoverValue] = useState<Rating | null>(null);
  const displayValue = hoverValue ?? value;

  const rotate = useMemo(() => {
    const rotations = [-3, -1.5, 0, 1.5, 3, -2, 2];
    return rotations[value % rotations.length];
  }, [value]);

  const sizes = {
    sm: { box: 40, font: 12 },
    md: { box: 56, font: 16 },
    lg: { box: 72, font: 22 },
  };

  const { box, font } = sizes[size];
  const opacityMap = [0, 0.55, 0.65, 0.75, 0.85, 0.92];
  const currentOpacity = value === 0 ? 1 : opacityMap[displayValue] || 1;

  if (readonly) {
    if (value === 0) return <span style={{ color: 'var(--ink-light)', fontSize: font }}>未评</span>;
    return (
      <div
        style={{
          width: box, height: box,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: 'var(--zhusha)', color: 'var(--xuan-white)',
          fontFamily: 'var(--font-keishu)', fontWeight: 'bold',
          letterSpacing: '0.1em', fontSize: displayValue === 5 ? font * 0.7 : font,
          transform: `rotate(${rotate}deg)`,
          opacity: currentOpacity,
          boxShadow: 'inset 0 0 0 3px var(--zhusha), inset 0 0 0 4px rgba(245,239,224,0.3)',
          borderRadius: 3,
          position: 'relative',
        }}
      >
        {SEAL_TEXTS[value]}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at 30% 40%, rgba(245,239,224,0.15) 0%, transparent 60%)',
        }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          display: 'inline-flex',
          gap: 6,
        }}
        onMouseLeave={() => setHoverValue(null)}
      >
        {([5, 4, 3, 2, 1] as Rating[]).map((rating) => {
          const isActive = displayValue >= rating && rating > 0;
          const isSet = value >= rating && rating > 0;
          return (
            <button
              key={rating}
              onClick={() => onChange?.(rating as Rating)}
              onMouseEnter={() => setHoverValue(rating)}
              style={{
                width: box, height: box,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: isActive ? 'var(--zhusha)' : 'transparent',
                color: isActive ? 'var(--xuan-white)' : 'var(--zhusha)',
                border: `2px solid var(--zhusha)`,
                fontFamily: 'var(--font-keishu)', fontWeight: 'bold',
                fontSize: rating === 5 ? font * 0.7 : font,
                letterSpacing: '0.05em',
                transform: `rotate(${rotate * (rating % 2 === 0 ? -1 : 1)}deg)`,
                opacity: isSet ? 0.9 : isActive ? 1 : 0.3,
                transition: 'all 250ms var(--ease-seal)',
                borderRadius: 3,
                padding: 0,
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label={`评分 ${RATING_LABELS[rating]}`}
            >
              {isActive ? SEAL_TEXTS[rating] : rating}
            </button>
          );
        })}
      </div>
      {showLabel && displayValue > 0 && (
        <span style={{
          fontFamily: 'var(--font-keishu)',
          fontSize: font,
          color: 'var(--zhusha)',
          letterSpacing: '0.15em',
          opacity: 0.8,
        }}>
          {RATING_LABELS[displayValue]}
        </span>
      )}
    </div>
  );
}
