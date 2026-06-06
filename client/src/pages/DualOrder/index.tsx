import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { workApi, authApi } from '@/services';
import type { Work, HeartOrderPreferences } from '@/types';
import TimeRiver from '@/components/TimeRiver';
import HeartShelf from '@/components/HeartShelf';
import Loading from '@/components/common/Loading';
import Modal from '@/components/common/Modal';
import { useUserStore } from '@/stores/user';
import { generateDualOrderImage, downloadImage } from '@/utils/dualOrderImage';
import { formatDate } from '@/utils/date';

export default function DualOrder() {
  const [works, setWorks] = useState<Work[]>([]);
  const [heartOrder, setHeartOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saveTip, setSaveTip] = useState('');

  const navigate = useNavigate();
  const { user, binding, setUser } = useUserStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [worksRes] = await Promise.all([
        workApi.list({ pageSize: 200, sortBy: 'createdAt', sortOrder: 'asc' }),
      ]);
      setWorks(worksRes.items);

      const stored = localStorage.getItem('henji_heart_order');
      if (stored) {
        try {
          const parsed: HeartOrderPreferences = JSON.parse(stored);
          setHeartOrder(parsed.order || []);
        } catch {}
      } else if (user?.preferences?.heartOrder) {
        setHeartOrder(user.preferences.heartOrder.order || []);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const persistOrder = useCallback(async (order: string[]) => {
    const data: HeartOrderPreferences = {
      order,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem('henji_heart_order', JSON.stringify(data));

    try {
      setSaving(true);
      const updated = await authApi.updatePreferences({
        ...(user?.preferences || {}),
        heartOrder: data,
      });
      setUser(updated);
      setSaveTip('已入卷');
      setTimeout(() => setSaveTip(''), 1500);
    } catch {
      setSaveTip('本地已存');
      setTimeout(() => setSaveTip(''), 1500);
    } finally {
      setSaving(false);
    }
  }, [user, setUser]);

  const handleOrderChange = useCallback((newOrder: string[]) => {
    setHeartOrder(newOrder);
    persistOrder(newOrder);
  }, [persistOrder]);

  const handleSelectWork = useCallback((work: Work) => {
    navigate(`/works/${work._id}`);
  }, [navigate]);

  const handleExport = useCallback(async () => {
    setExporting(true);
    try {
      const sealText = binding.sealStyle === 'yiyue' ? '已阅'
        : binding.sealStyle === 'shenpin' ? '神品'
        : binding.sealStyle === 'jingdu' ? '静读'
        : user?.username?.slice(0, 2) || '痕迹';

      const dataUrl = await generateDualOrderImage({
        works,
        heartOrder,
        username: user?.username || '墨客',
        sealText,
      });
      setPreviewUrl(dataUrl);
    } finally {
      setExporting(false);
    }
  }, [works, heartOrder, user, binding]);

  const handleDownload = useCallback(() => {
    if (!previewUrl) return;
    const filename = `双序阁_${formatDate(new Date().toISOString(), 'YYYYMMDD')}.png`;
    downloadImage(previewUrl, filename);
  }, [previewUrl]);

  const orderDiff = (() => {
    if (works.length === 0) return null;
    const timeOrder = [...works]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((w) => w._id);

    const workMap = new Map(works.map((w) => [w._id, w]));
    const currentHeart = heartOrder
      .map((id) => workMap.get(id))
      .filter(Boolean) as Work[];
    const remaining = works.filter((w) => !heartOrder.includes(w._id));
    const fullHeartOrder = [...currentHeart, ...remaining].map((w) => w._id);

    let changedCount = 0;
    const maxCheck = Math.min(timeOrder.length, fullHeartOrder.length);
    for (let i = 0; i < maxCheck; i++) {
      if (timeOrder[i] !== fullHeartOrder[i]) changedCount++;
    }
    return changedCount;
  })();

  if (loading) return <Loading />;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
      }}>
        <div>
          <h1 className="brush-underline" style={{ letterSpacing: '0.3em' }}>双 序 阁</h1>
          <p style={{
            fontFamily: 'var(--font-pizhu)',
            fontSize: 13,
            color: 'var(--ink-light)',
            marginTop: 8,
            letterSpacing: '0.15em',
          }}>
            左观时序长河之迹，右排心中谱系之序
          </p>
          {orderDiff !== null && (
            <p style={{
              fontFamily: 'var(--font-xingkai)',
              fontSize: 13,
              color: orderDiff > 0 ? 'var(--zhusha)' : 'var(--cangse)',
              marginTop: 6,
              letterSpacing: '0.1em',
            }}>
              {orderDiff > 0
                ? `二序已有 ${orderDiff} 处不同，见你心中自有丘壑`
                : '二序一致，岁月与你同心'}
            </p>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saving && (
            <span style={{
              fontFamily: 'var(--font-pizhu)',
              fontSize: 12,
              color: 'var(--cangse)',
              letterSpacing: '0.1em',
            }}>收卷中…</span>
          )}
          {saveTip && (
            <span style={{
              fontFamily: 'var(--font-pizhu)',
              fontSize: 12,
              color: 'var(--zhusha)',
              letterSpacing: '0.1em',
            }}>{saveTip}</span>
          )}
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting || works.length === 0}
            style={{ minWidth: 140 }}
          >
            {exporting ? '绘制中…' : '制卷分享'}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 0,
        background: 'var(--xuan-white)',
        border: '1px solid rgba(139,105,20,0.15)',
        boxShadow: 'var(--shadow-paper)',
        minHeight: 640,
        position: 'relative',
      }} className="xuan-paper">
        <TimeRiver works={works} onSelect={handleSelectWork} />

        <div style={{
          position: 'absolute',
          left: '50%',
          top: 40,
          bottom: 40,
          width: 1,
          background: 'linear-gradient(180deg, transparent, var(--ink-flying) 10%, var(--ink-flying) 90%, transparent)',
          transform: 'translateX(-50%)',
        }} />

        <HeartShelf
          works={works}
          order={heartOrder}
          onChange={handleOrderChange}
          onSelect={handleSelectWork}
        />
      </div>

      <Modal
        open={!!previewUrl}
        onClose={() => setPreviewUrl(null)}
        title="双序并置 · 横卷"
        width="min(95vw, 1400px)"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-pizhu)',
            fontSize: 12,
            color: 'var(--ink-light)',
            letterSpacing: '0.15em',
          }}>
            两卷对照 · 时序在左，心序在右
          </div>
          <div style={{
            overflow: 'auto',
            border: '1px solid rgba(139,105,20,0.15)',
            background: 'var(--xuan-light)',
            padding: 12,
          }}>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="双序横卷"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  boxShadow: 'var(--shadow-paper)',
                }}
              />
            )}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
          }}>
            <button
              className="btn btn-ghost"
              onClick={() => setPreviewUrl(null)}
            >收起</button>
            <button
              className="btn btn-primary"
              onClick={handleDownload}
            >下载此卷</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
