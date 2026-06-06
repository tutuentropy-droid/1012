import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/user';
import { authApi } from '@/services';
import Modal from '@/components/common/Modal';
import {
  PAPER_TEXTURES,
  INK_LEVELS,
  SEAL_STYLES,
  type PaperTexture,
  type InkLevel,
  type SealStyle,
} from '@/types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function BindingSettings({ open, onClose }: Props) {
  const { binding, setPaperTexture, setInkLevel, setSealStyle, setUser, user } = useUserStore();
  const [paperTexture, setLocalPaper] = useState<PaperTexture>(binding.paperTexture);
  const [inkLevel, setLocalInk] = useState<InkLevel>(binding.inkLevel);
  const [sealStyle, setLocalSeal] = useState<SealStyle>(binding.sealStyle);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setLocalPaper(binding.paperTexture);
      setLocalInk(binding.inkLevel);
      setLocalSeal(binding.sealStyle);
      setSaved(false);
    }
  }, [open, binding]);

  useEffect(() => {
    setPaperTexture(paperTexture);
  }, [paperTexture, setPaperTexture]);

  useEffect(() => {
    setInkLevel(inkLevel);
  }, [inkLevel, setInkLevel]);

  useEffect(() => {
    setSealStyle(sealStyle);
  }, [sealStyle, setSealStyle]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const prefs = { binding: { paperTexture, inkLevel, sealStyle } };
      const updated = await authApi.updatePreferences(prefs);
      if (updated && user) {
        setUser({ ...user, preferences: { ...user.preferences, ...prefs } });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="私人装帧" width="680px">
      <div style={{ padding: 'var(--spacing-md) 0' }}>
        <section style={{ marginBottom: 40 }}>
          <h3 style={{
            fontFamily: 'var(--font-keishu)',
            fontSize: 18,
            letterSpacing: '0.2em',
            marginBottom: 16,
            color: 'var(--ink-current-strong)',
          }}>
            纸 张 纹 理
          </h3>
          <p style={{
            fontFamily: 'var(--font-pizhu)',
            fontSize: 12,
            color: 'var(--ink-current-light)',
            marginBottom: 16,
            letterSpacing: '0.1em',
          }}>
            鼠标悬停，可感纤维疏密
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {PAPER_TEXTURES.map((p) => {
              const isActive = paperTexture === p.value;
              return (
                <button
                  key={p.value}
                  onClick={() => setLocalPaper(p.value)}
                  className={`paper-${p.value} paper-fiber-hover`}
                  style={{
                    height: 140,
                    border: isActive ? '2px solid var(--zhusha)' : '1px solid var(--ink-current-flying)',
                    borderRadius: 4,
                    padding: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)',
                    position: 'relative',
                  }}
                >
                  <div style={{
                    fontFamily: 'var(--font-keishu)',
                    fontSize: 16,
                    letterSpacing: '0.3em',
                    color: isActive ? 'var(--zhusha)' : 'var(--ink-current-strong)',
                    fontWeight: isActive ? 'bold' : 'normal',
                  }}>
                    {p.label}
                  </div>
                  <div style={{
                    fontFamily: 'var(--font-pizhu)',
                    fontSize: 11,
                    color: 'var(--ink-current-light)',
                    marginTop: 4,
                    letterSpacing: '0.05em',
                  }}>
                    {p.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h3 style={{
            fontFamily: 'var(--font-keishu)',
            fontSize: 18,
            letterSpacing: '0.2em',
            marginBottom: 16,
            color: 'var(--ink-current-strong)',
          }}>
            墨 色 浓 淡
          </h3>
          <p style={{
            fontFamily: 'var(--font-pizhu)',
            fontSize: 12,
            color: 'var(--ink-current-light)',
            marginBottom: 20,
            letterSpacing: '0.1em',
          }}>
            调墨下笔，全站文字随之变化
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {INK_LEVELS.map((l) => {
              const isActive = inkLevel === l.value;
              const color = `var(--ink-level-${l.value})`;
              return (
                <button
                  key={l.value}
                  onClick={() => setLocalInk(l.value)}
                  style={{
                    flex: 1,
                    height: 64,
                    background: color,
                    border: isActive ? '3px solid var(--zhusha)' : 'none',
                    borderLeft: l.value > 1 ? '1px solid var(--xuan-white)' : 'none',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    paddingBottom: 6,
                    borderRadius: l.value === 1 ? '4px 0 0 4px' : l.value === 6 ? '0 4px 4px 0' : 0,
                    transform: isActive ? 'scaleY(1.1)' : 'scaleY(1)',
                    transformOrigin: 'bottom',
                  }}
                  title={l.desc}
                >
                  <span style={{
                    fontFamily: 'var(--font-keishu)',
                    fontSize: 11,
                    letterSpacing: '0.1em',
                    color: l.value >= 4 ? 'var(--xuan-white)' : 'var(--ink-strong)',
                    opacity: isActive ? 1 : 0.7,
                  }}>
                    {l.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 12,
            fontFamily: 'var(--font-pizhu)',
            fontSize: 12,
            color: 'var(--ink-current)',
            letterSpacing: '0.1em',
            textAlign: 'center',
          }}>
            当前：{INK_LEVELS.find(l => l.value === inkLevel)?.desc}
          </div>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h3 style={{
            fontFamily: 'var(--font-keishu)',
            fontSize: 18,
            letterSpacing: '0.2em',
            marginBottom: 16,
            color: 'var(--ink-current-strong)',
          }}>
            闲 章 印 式
          </h3>
          <p style={{
            fontFamily: 'var(--font-pizhu)',
            fontSize: 12,
            color: 'var(--ink-current-light)',
            marginBottom: 20,
            letterSpacing: '0.1em',
          }}>
            选一方闲章，盖于页角
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {SEAL_STYLES.map((s) => {
              const isActive = sealStyle === s.value;
              return (
                <button
                  key={s.value}
                  onClick={() => setLocalSeal(s.value)}
                  style={{
                    width: 80,
                    height: 96,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    border: isActive ? '2px solid var(--zhusha)' : '1px solid var(--ink-current-flying)',
                    borderRadius: 4,
                    background: 'var(--xuan-light)',
                    cursor: 'pointer',
                    transition: 'all var(--dur-fast)',
                    padding: 8,
                  }}
                >
                  {s.value === 'none' ? (
                    <div style={{
                      width: 44, height: 44,
                      border: '2px dashed var(--ink-current-light)',
                      borderRadius: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--ink-current-light)',
                      fontFamily: 'var(--font-keishu)',
                      fontSize: 12,
                    }}>空</div>
                  ) : (
                    <div style={{
                      width: 44, height: 44,
                      background: 'var(--zhusha)',
                      color: 'var(--xuan-white)',
                      fontFamily: 'var(--font-keishu)',
                      fontWeight: 'bold',
                      fontSize: 13,
                      letterSpacing: '0.1em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 3,
                      opacity: 0.88,
                      boxShadow: 'inset 0 0 0 2px var(--zhusha), inset 0 0 0 3px rgba(245,239,224,0.3)',
                      transform: 'rotate(-2deg)',
                    }}>
                      {s.text}
                    </div>
                  )}
                  <span style={{
                    fontFamily: 'var(--font-keishu)',
                    fontSize: 12,
                    letterSpacing: '0.15em',
                    color: isActive ? 'var(--zhusha)' : 'var(--ink-current)',
                  }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
          {saved && (
            <span style={{
              fontFamily: 'var(--font-keishu)',
              color: 'var(--qingzhu)',
              fontSize: 13,
              letterSpacing: '0.15em',
            }}>
              已保存
            </span>
          )}
          <button className="btn btn-ghost" onClick={onClose}>收起</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? '保存中…' : '保存装帧'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
