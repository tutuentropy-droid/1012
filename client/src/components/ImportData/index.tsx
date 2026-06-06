import { useState, useRef } from 'react';
import { importApi } from '@/services';
import type {
  ImportPreviewResult,
  ImportPreviewMatched,
  ImportPreviewUnmatched,
  WorkType,
  WorkStatus,
  Rating,
} from '@/types';
import { TYPE_LABELS, STATUS_LABELS, RATING_LABELS } from '@/types';
import Modal from '@/components/common/Modal';
import Loading from '@/components/common/Loading';
import SealStamp from '@/components/SealStamp';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

type Step = 'upload' | 'preview' | 'confirm';

export default function ImportData({ open, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [selectedMatched, setSelectedMatched] = useState<Set<number>>(new Set());
  const [editingUnmatched, setEditingUnmatched] = useState<Record<number, { type?: WorkType; status?: WorkStatus; rating?: Rating; title?: string }>>({});
  const [selectedUnmatched, setSelectedUnmatched] = useState<Set<number>>(new Set());
  const [result, setResult] = useState<{ created: number; updated: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('upload');
    setLoading(false);
    setError('');
    setPreview(null);
    setSelectedMatched(new Set());
    setEditingUnmatched({});
    setSelectedUnmatched(new Set());
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      const content = await file.text();
      const format = file.name.toLowerCase().endsWith('.txt') ? 'simple' : 'csv';
      const data = await importApi.preview(content, format);
      setPreview(data);
      const matchedIdx = new Set<number>();
      data.matchedItems.forEach((_, i) => matchedIdx.add(i));
      setSelectedMatched(matchedIdx);
      const unmatchedIdx = new Set<number>();
      data.unmatchedItems.forEach((_, i) => unmatchedIdx.add(i));
      setSelectedUnmatched(unmatchedIdx);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || '解析文件失败');
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const toggleMatched = (idx: number) => {
    setSelectedMatched((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const toggleUnmatched = (idx: number) => {
    setSelectedUnmatched((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const updateUnmatchedEdit = (idx: number, field: string, value: any) => {
    setEditingUnmatched((prev) => ({
      ...prev,
      [idx]: { ...prev[idx], [field]: value },
    }));
  };

  const handleConfirm = async () => {
    if (!preview) return;
    setLoading(true);
    setError('');
    try {
      const matchedItems = preview.matchedItems.filter((_, i) => selectedMatched.has(i));
      const unmatchedItems = preview.unmatchedItems
        .filter((_, i) => selectedUnmatched.has(i))
        .map((item, i) => {
          const realIdx = preview!.unmatchedItems.indexOf(item);
          const edit = editingUnmatched[realIdx] || {};
          return {
            record: { ...item.record, title: edit.title || item.record.title },
            type: edit.type || item.suggestedType,
            status: edit.status,
            rating: edit.rating,
            tags: item.tags,
            note: item.note,
          };
        });

      const res = await importApi.confirm('merge', matchedItems, unmatchedItems);
      setResult({ created: res.created, updated: res.updated });
      setStep('confirm');
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || '导入失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title={step === 'confirm' ? '导入完成' : step === 'preview' ? '预览导入' : '万卷入阁'} width="880px">
      {error && (
        <div style={{
          padding: '12px 16px', marginBottom: 20,
          background: 'rgba(231, 76, 60, 0.08)', color: 'var(--zhusha)',
          fontFamily: 'var(--font-keishu)', fontSize: 13, letterSpacing: '0.1em',
          borderLeft: '3px solid var(--zhusha)',
        }}>{error}</div>
      )}

      {step === 'upload' && (
        <div>
          <div style={{
            textAlign: 'center', padding: '60px 20px',
            border: '2px dashed var(--ink-flying)',
            borderRadius: 4, marginBottom: 24,
            cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'var(--xuan-cream)' : 'transparent',
            transition: 'all var(--dur-fast)',
          }} onMouseEnter={(e) => {
            if (!loading) {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--zhusha)';
              (e.currentTarget as HTMLDivElement).style.background = 'var(--xuan-cream)';
            }
          }} onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--ink-flying)';
            (e.currentTarget as HTMLDivElement).style.background = 'transparent';
          }} onClick={() => !loading && fileInputRef.current?.click()}>
            {loading ? (
              <Loading text="解析书卷中..." />
            ) : (
              <>
                <div style={{
                  fontFamily: 'var(--font-keishu)', fontSize: 32,
                  color: 'var(--zhusha)', letterSpacing: '0.3em',
                  marginBottom: 16,
                }}>引 卷</div>
                <div style={{
                  fontFamily: 'var(--font-pizhu)', fontSize: 14,
                  color: 'var(--ink-medium)', letterSpacing: '0.15em',
                  marginBottom: 8,
                }}>点击此处上传 CSV、TXT 文件</div>
                <div style={{
                  fontFamily: 'var(--font-pizhu)', fontSize: 12,
                  color: 'var(--ink-light)', letterSpacing: '0.1em',
                }}>支持豆瓣导出格式，自动识别题名、作者、评分、进度</div>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xlsx,.xls"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </div>

          <div style={{
            padding: 20, background: 'var(--xuan-light)',
            border: '1px solid rgba(139,105,20,0.1)',
          }}>
            <div style={{
              fontFamily: 'var(--font-keishu)', fontSize: 14,
              letterSpacing: '0.15em', color: 'var(--ink-strong)',
              marginBottom: 12,
            }}>· 导入须知 ·</div>
            <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--ink-medium)', fontFamily: 'var(--font-pizhu)', fontSize: 12, lineHeight: 2, letterSpacing: '0.05em' }}>
              <li>系统自动识别标题、作者/导演、评分、状态，智能去重合并</li>
              <li>标签、笔记将尽量保留，冲突时以已有记录为准</li>
              <li>匹配不上的条目可手动认领，设定类型和状态</li>
              <li>推荐使用豆瓣导出的 CSV 文件，字段兼容性最佳</li>
            </ul>
          </div>
        </div>
      )}

      {step === 'preview' && preview && (
        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 12, marginBottom: 24,
          }}>
            <StatCard label="共解析" value={preview.total} color="var(--ink-strong)" />
            <StatCard label="自动匹配" value={preview.matched} color="var(--daishi)" />
            <StatCard label="待认领" value={preview.unmatched} color="var(--zhusha)" />
            <StatCard label="解析失败" value={preview.errorCount} color="var(--ink-light)" />
          </div>

          {preview.matchedItems.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  fontFamily: 'var(--font-keishu)', fontSize: 16,
                  letterSpacing: '0.15em', color: 'var(--daishi)',
                }}>已匹配（将合并至已有记录）</div>
                <button className="btn btn-ghost" onClick={() => {
                  if (selectedMatched.size === preview.matchedItems.length) {
                    setSelectedMatched(new Set());
                  } else {
                    const s = new Set<number>();
                    preview.matchedItems.forEach((_, i) => s.add(i));
                    setSelectedMatched(s);
                  }
                }} style={{ fontSize: 12 }}>
                  {selectedMatched.size === preview.matchedItems.length ? '全不选' : '全选'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {preview.matchedItems.map((item, idx) => (
                  <MatchedItemRow
                    key={idx}
                    item={item}
                    selected={selectedMatched.has(idx)}
                    onToggle={() => toggleMatched(idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {preview.unmatchedItems.length > 0 && (
            <div style={{ marginBottom: 32 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12,
              }}>
                <div style={{
                  fontFamily: 'var(--font-keishu)', fontSize: 16,
                  letterSpacing: '0.15em', color: 'var(--zhusha)',
                }}>待认领（请核实类型和状态）</div>
                <button className="btn btn-ghost" onClick={() => {
                  if (selectedUnmatched.size === preview.unmatchedItems.length) {
                    setSelectedUnmatched(new Set());
                  } else {
                    const s = new Set<number>();
                    preview.unmatchedItems.forEach((_, i) => s.add(i));
                    setSelectedUnmatched(s);
                  }
                }} style={{ fontSize: 12 }}>
                  {selectedUnmatched.size === preview.unmatchedItems.length ? '全不选' : '全选'}
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {preview.unmatchedItems.map((item, idx) => (
                  <UnmatchedItemRow
                    key={idx}
                    item={item}
                    idx={idx}
                    selected={selectedUnmatched.has(idx)}
                    onToggle={() => toggleUnmatched(idx)}
                    edit={editingUnmatched[idx] || {}}
                    onEdit={(f, v) => updateUnmatchedEdit(idx, f, v)}
                  />
                ))}
              </div>
            </div>
          )}

          {preview.errors.length > 0 && (
            <div>
              <div style={{
                fontFamily: 'var(--font-keishu)', fontSize: 16,
                letterSpacing: '0.15em', color: 'var(--ink-light)',
                marginBottom: 12,
              }}>解析失败（已跳过）</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {preview.errors.map((e, i) => (
                  <div key={i} style={{
                    padding: '10px 16px', background: 'var(--xuan-light)',
                    border: '1px dashed rgba(139,105,20,0.2)',
                    fontFamily: 'var(--font-pizhu)', fontSize: 12,
                    color: 'var(--ink-light)', letterSpacing: '0.05em',
                  }}>
                    第 {e.index + 1} 条：{e.reason}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 'confirm' && result && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{
            fontFamily: 'var(--font-keishu)', fontSize: 36,
            letterSpacing: '0.3em', color: 'var(--zhusha)',
            marginBottom: 32,
          }}>功 德 圆 满</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 64, marginBottom: 40 }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-keishu)', fontSize: 48,
                color: 'var(--daishi)', letterSpacing: '0.1em',
              }}>{result.created}</div>
              <div style={{
                fontFamily: 'var(--font-pizhu)', fontSize: 13,
                color: 'var(--ink-medium)', letterSpacing: '0.15em',
                marginTop: 4,
              }}>新纳入卷</div>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-keishu)', fontSize: 48,
                color: 'var(--cangse)', letterSpacing: '0.1em',
              }}>{result.updated}</div>
              <div style={{
                fontFamily: 'var(--font-pizhu)', fontSize: 13,
                color: 'var(--ink-medium)', letterSpacing: '0.15em',
                marginTop: 4,
              }}>补录合并</div>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleClose}>
            收卷
          </button>
        </div>
      )}

      {step === 'preview' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(139,105,20,0.1)' }}>
          <button className="btn btn-ghost" onClick={() => setStep('upload')} disabled={loading}>重选文件</button>
          <button className="btn btn-primary" onClick={handleConfirm} disabled={loading || (selectedMatched.size === 0 && selectedUnmatched.size === 0)}>
            {loading ? '入卷中...' : `确认导入（${selectedMatched.size + selectedUnmatched.size} 条）`}
          </button>
        </div>
      )}
    </Modal>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      padding: '16px 12px', textAlign: 'center',
      background: 'var(--xuan-light)',
      border: '1px solid rgba(139,105,20,0.1)',
    }}>
      <div style={{
        fontFamily: 'var(--font-keishu)', fontSize: 28,
        color, letterSpacing: '0.1em',
      }}>{value}</div>
      <div style={{
        fontFamily: 'var(--font-pizhu)', fontSize: 12,
        color: 'var(--ink-light)', letterSpacing: '0.15em',
        marginTop: 4,
      }}>{label}</div>
    </div>
  );
}

function MatchedItemRow({ item, selected, onToggle }: { item: ImportPreviewMatched; selected: boolean; onToggle: () => void }) {
  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: selected ? 'rgba(28, 92, 64, 0.06)' : 'var(--xuan-light)',
      border: selected ? '1px solid var(--daishi)' : '1px solid rgba(139,105,20,0.1)',
      cursor: 'pointer', transition: 'all var(--dur-fast)',
    }}>
      <input type="checkbox" checked={selected} onChange={onToggle} style={{ accentColor: 'var(--daishi)', width: 16, height: 16 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{
            fontFamily: 'var(--font-keishu)', fontSize: 15,
            color: 'var(--ink-strong)', letterSpacing: '0.08em',
          }}>{item.record.title}</span>
          {item.record.rating ? (
            <SealStamp value={item.record.rating as Rating} readonly size="sm" showLabel={false} />
          ) : null}
          {item.record.status && (
            <span className="tag-chip" style={{ fontSize: 11, padding: '2px 10px' }}>
              {STATUS_LABELS[item.record.status as WorkStatus] || item.record.status}
            </span>
          )}
        </div>
        <div style={{
          fontFamily: 'var(--font-pizhu)', fontSize: 12,
          color: 'var(--ink-light)', letterSpacing: '0.05em',
        }}>
          → 合并至：《{item.existingTitle}》
          {item.record.author ? ` · ${item.record.author}` : ''}
        </div>
      </div>
    </label>
  );
}

function UnmatchedItemRow({
  item, idx, selected, onToggle, edit, onEdit,
}: {
  item: ImportPreviewUnmatched;
  idx: number;
  selected: boolean;
  onToggle: () => void;
  edit: { type?: WorkType; status?: WorkStatus; rating?: Rating; title?: string };
  onEdit: (field: string, value: any) => void;
}) {
  return (
    <div style={{
      padding: '16px',
      background: selected ? 'rgba(231, 76, 60, 0.05)' : 'var(--xuan-light)',
      border: selected ? '1px solid var(--zhusha)' : '1px solid rgba(139,105,20,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <input type="checkbox" checked={selected} onChange={onToggle} style={{ accentColor: 'var(--zhusha)', width: 16, height: 16 }} />
        <input
          className="input-field"
          value={edit.title || item.record.title || ''}
          onChange={(e) => onEdit('title', e.target.value)}
          style={{ flex: 1, fontFamily: 'var(--font-keishu)', fontSize: 15, letterSpacing: '0.05em' }}
        />
        <SealStamp
          value={(edit.rating ?? (item.record.rating as Rating)) || 0}
          onChange={(v) => onEdit('rating', v)}
          size="sm"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.1em', marginBottom: 6 }}>类型</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['tv', 'book', 'movie', 'other'] as WorkType[]).map((t) => (
              <button
                key={t}
                className={`tag-chip ${(edit.type || item.suggestedType) === t ? 'active' : ''}`}
                onClick={() => onEdit('type', t)}
                style={{ fontSize: 11 }}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontFamily: 'var(--font-pizhu)', fontSize: 12, color: 'var(--ink-light)', letterSpacing: '0.1em', marginBottom: 6 }}>状态</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['wish', 'watching', 'watched', 'paused', 'dropped'] as WorkStatus[]).map((s) => (
              <button
                key={s}
                className={`tag-chip ${(edit.status || item.record.status) === s ? 'active' : ''}`}
                onClick={() => onEdit('status', s)}
                style={{ fontSize: 11 }}
              >
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(item.record.author || item.tags.length > 0 || item.note) && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed rgba(139,105,20,0.15)' }}>
          <div style={{ fontFamily: 'var(--font-pizhu)', fontSize: 11, color: 'var(--ink-light)', letterSpacing: '0.05em', lineHeight: 1.8 }}>
            {item.record.author && <div>作者/导演：{item.record.author}</div>}
            {item.tags.length > 0 && <div>标签：{item.tags.join('、')}</div>}
            {item.note && <div>笔记：{item.note.slice(0, 80)}{item.note.length > 80 ? '…' : ''}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
