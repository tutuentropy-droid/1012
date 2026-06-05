import { useState } from 'react';
import type { ChineseColor } from '@/types';

interface Props {
  colors: ChineseColor[];
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  allowClear?: boolean;
}

export default function ChineseColorPicker({ colors, value, onChange, label = '当时心情', allowClear = true }: Props) {
  const [open, setOpen] = useState(false);
  const selected = colors.find((c) => c.hex === value);

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontFamily: 'var(--font-keishu)', letterSpacing: '0.1em',
        fontSize: 14, color: 'var(--ink-medium)',
      }}>
        <span>{label}：</span>
        <button
          onClick={() => setOpen(!open)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 14px',
            border: '1px solid var(--ink-flying)',
            background: 'var(--xuan-light)',
            borderRadius: 'var(--radius-sm)',
            transition: 'all var(--dur-fast)',
          }}
        >
          {value ? (
            <>
              <span style={{
                width: 18, height: 18, borderRadius: '50%',
                background: value,
                border: '2px solid var(--xuan-white)',
                boxShadow: '0 0 0 1px var(--ink-flying)',
              }} />
              <span style={{ color: 'var(--ink-heavy)' }}>{selected?.name || value}</span>
            </>
          ) : (
            <span style={{ color: 'var(--ink-light)' }}>未选色</span>
          )}
          <span style={{ fontSize: 10, color: 'var(--ink-light)' }}>▼</span>
        </button>
        {allowClear && value && (
          <button
            onClick={() => onChange?.('')}
            style={{ fontSize: 12, color: 'var(--ink-light)' }}
          >
            清除
          </button>
        )}
      </div>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%', left: 0,
            marginTop: 8,
            padding: 16,
            background: 'var(--xuan-white)',
            border: '1px solid var(--ink-flying)',
            boxShadow: 'var(--shadow-paper)',
            zIndex: 50,
            width: 360,
            maxWidth: '90vw',
          }}
          className="xuan-paper"
        >
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12,
          }}>
            {colors.map((c) => (
              <button
                key={c.hex}
                onClick={() => {
                  onChange?.(c.hex);
                  setOpen(false);
                }}
                title={`${c.name} · ${c.desc}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: 8,
                  border: value === c.hex ? '2px solid var(--zhusha)' : '1px solid transparent',
                  background: value === c.hex ? 'var(--zhusha-light)' : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'all var(--dur-fast)',
                }}
              >
                <span style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: c.hex,
                  border: '2px solid var(--xuan-white)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                }} />
                <span style={{
                  fontFamily: 'var(--font-keishu)',
                  fontSize: 12, letterSpacing: '0.1em',
                  color: 'var(--ink-medium)',
                }}>{c.name}</span>
              </button>
            ))}
          </div>
          <p style={{
            marginTop: 12, paddingTop: 12,
            borderTop: '1px dashed var(--ink-flying)',
            fontSize: 11, color: 'var(--ink-light)',
            fontFamily: 'var(--font-pizhu)',
            letterSpacing: '0.05em', lineHeight: 1.8,
          }}>
            {selected ? `${selected.name}：${selected.desc}` : '以一方中国色，记此刻心情'}
          </p>
        </div>
      )}
    </div>
  );
}
