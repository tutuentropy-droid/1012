import { useEffect, useState, useCallback } from 'react';
import { workApi, tagApi } from '@/services';
import type { Work, WorkType, WorkStatus, Tag } from '@/types';
import { STATUS_LABELS, TYPE_LABELS } from '@/types';
import WorkCard from '@/components/WorkCard';
import Loading from '@/components/common/Loading';
import Modal from '@/components/common/Modal';
import ChineseColorPicker from '@/components/ChineseColorPicker';
import SealStamp from '@/components/SealStamp';
import ImportData from '@/components/ImportData';
import { useUserStore } from '@/stores/user';

const TYPES: (WorkType | 'all')[] = ['all', 'tv', 'book', 'movie', 'other'];
const STATUSES: (WorkStatus | 'all')[] = ['all', 'watching', 'wish', 'watched', 'paused', 'dropped'];

export default function Works() {
  const [works, setWorks] = useState<Work[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 12, total: 0, totalPages: 1 });

  const [filterType, setFilterType] = useState<WorkType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<WorkStatus | 'all'>('all');
  const [filterTag, setFilterTag] = useState<string>('');
  const [search, setSearch] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState({
    type: 'tv' as WorkType,
    title: '', subtitle: '', author: '', cover: '', description: '',
    totalEpisodes: 0, totalPages: 0,
    status: 'wish' as WorkStatus,
    tags: [] as string[],
    moodColor: '',
  });

  const { chineseColors } = useUserStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [worksRes, tagsRes] = await Promise.all([
        workApi.list({
          type: filterType, status: filterStatus,
          tagId: filterTag, search,
          page: pagination.page, pageSize: pagination.pageSize,
          sortBy: 'updatedAt', sortOrder: 'desc',
        }),
        tagApi.list(),
      ]);
      setWorks(worksRes.items);
      setPagination(worksRes.pagination);
      setTags(tagsRes);
    } finally {
      setLoading(false);
    }
  }, [filterType, filterStatus, filterTag, search, pagination.page, pagination.pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!formData.title.trim()) return;
    await workApi.create({ ...formData } as any);
    setShowModal(false);
    setFormData({
      type: 'tv', title: '', subtitle: '', author: '', cover: '', description: '',
      totalEpisodes: 0, totalPages: 0, status: 'wish', tags: [], moodColor: '',
    });
    loadData();
  };

  const toggleTag = (tagId: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="brush-underline">万卷千册</h1>
          <p style={{ fontFamily: 'var(--font-pizhu)', fontSize: 13, color: 'var(--ink-light)', marginTop: 8, letterSpacing: '0.1em' }}>
            共 {pagination.total} 部作品留痕
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn" onClick={() => setShowImport(true)}>
            万卷入阁
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            纳入新卷
          </button>
        </div>
      </div>

      <div style={{
        display: 'flex', gap: 16, flexWrap: 'wrap',
        padding: 24, marginBottom: 32,
        background: 'var(--xuan-light)',
        border: '1px solid rgba(139,105,20,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em' }}>类别：</span>
          {TYPES.map((t) => (
            <button
              key={t}
              className={`tag-chip ${filterType === t ? 'active' : ''}`}
              onClick={() => { setFilterType(t); setPagination((p) => ({ ...p, page: 1 })); }}
            >
              {t === 'all' ? '全部' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em' }}>状态：</span>
          {STATUSES.map((s) => (
            <button
              key={s}
              className={`tag-chip ${filterStatus === s ? 'active' : ''}`}
              onClick={() => { setFilterStatus(s); setPagination((p) => ({ ...p, page: 1 })); }}
            >
              {s === 'all' ? '全部' : STATUS_LABELS[s]}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em' }}>搜索：</span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPagination((p) => ({ ...p, page: 1 })); }}
            placeholder="题名、作者..."
            className="input-field"
            style={{ flex: 1 }}
          />
        </div>
      </div>

      {tags.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 32 }}>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginRight: 8 }}>签花：</span>
          <button
            className={`tag-chip ${!filterTag ? 'active' : ''}`}
            onClick={() => { setFilterTag(''); setPagination((p) => ({ ...p, page: 1 })); }}
          >全部</button>
          {tags.map((t) => (
            <button
              key={t._id}
              className={`tag-chip ${filterTag === t._id ? 'active' : ''}`}
              onClick={() => { setFilterTag(filterTag === t._id ? '' : t._id); setPagination((p) => ({ ...p, page: 1 })); }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : works.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">卷中无字</div>
          <div className="empty-state-desc">点击右上角"纳入新卷"，开启记录</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {works.map((w) => (
              <WorkCard key={w._id} work={w} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
              >←</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => Math.abs(p - pagination.page) <= 2 || p === 1 || p === pagination.totalPages)
                .map((p, i, arr) => (
                  <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {i > 0 && p - arr[i - 1] > 1 && <span style={{ padding: '0 4px', color: 'var(--ink-light)' }}>…</span>}
                    <button
                      className={`page-btn ${pagination.page === p ? 'active' : ''}`}
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                    >{p}</button>
                  </span>
                ))}
              <button
                className="page-btn"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
              >→</button>
            </div>
          )}
        </>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="纳入新卷" width="640px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>类别</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['tv', 'book', 'movie', 'other'] as WorkType[]).map((t) => (
                <button
                  key={t}
                  className={`tag-chip ${formData.type === t ? 'active' : ''}`}
                  onClick={() => setFormData((p) => ({ ...p, type: t }))}
                >{TYPE_LABELS[t]}</button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>题名 *</label>
            <input className="input-field" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} placeholder="作品名称" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>
                {formData.type === 'tv' || formData.type === 'movie' ? '导演' : '作者'}
              </label>
              <input className="input-field" value={formData.author} onChange={(e) => setFormData((p) => ({ ...p, author: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>副标题</label>
              <input className="input-field" value={formData.subtitle} onChange={(e) => setFormData((p) => ({ ...p, subtitle: e.target.value }))} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>状态</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {(['wish', 'watching', 'watched', 'paused', 'dropped'] as WorkStatus[]).map((s) => (
                  <button
                    key={s}
                    className={`tag-chip ${formData.status === s ? 'active' : ''}`}
                    onClick={() => setFormData((p) => ({ ...p, status: s }))}
                  >{STATUS_LABELS[s]}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>
                {formData.type === 'tv' ? '总集数' : '总页数'}
              </label>
              <input
                type="number" min="0" className="input-field"
                value={formData.type === 'tv' ? formData.totalEpisodes : formData.totalPages}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10) || 0;
                  if (formData.type === 'tv') setFormData((p) => ({ ...p, totalEpisodes: v }));
                  else setFormData((p) => ({ ...p, totalPages: v }));
                }}
              />
            </div>
          </div>

          {tags.length > 0 && (
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>签花</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {tags.map((t) => (
                  <button
                    key={t._id}
                    className={`tag-chip ${formData.tags.includes(t._id) ? 'active' : ''}`}
                    onClick={() => toggleTag(t._id)}
                  >{t.name}</button>
                ))}
              </div>
            </div>
          )}

          <ChineseColorPicker
            colors={chineseColors}
            value={formData.moodColor}
            onChange={(c) => setFormData((p) => ({ ...p, moodColor: c }))}
            label="初遇心情"
          />

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>简介</label>
            <textarea
              rows={3}
              className="textarea-field"
              value={formData.description}
              onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              placeholder="几句简介..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>搁笔</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={!formData.title.trim()}>入卷</button>
          </div>
        </div>
      </Modal>

      <ImportData open={showImport} onClose={() => setShowImport(false)} onSuccess={loadData} />
    </div>
  );
}
