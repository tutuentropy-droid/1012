import { useEffect, useState, useCallback } from 'react';
import { noteApi } from '@/services';
import type { NoteWithWork } from '@/types';
import OldBookPage from '@/components/OldBookPage';
import Loading from '@/components/common/Loading';
import { useUserStore } from '@/stores/user';

export default function Notes() {
  const [notes, setNotes] = useState<NoteWithWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, total: 0, totalPages: 1 });
  const [filterColor, setFilterColor] = useState('');
  const { chineseColors } = useUserStore();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await noteApi.list({
        moodColor: filterColor,
        page: pagination.page,
        pageSize: pagination.pageSize,
        sortBy: 'createdAt', sortOrder: 'desc',
      });
      setNotes(res.items);
      setPagination(res.pagination);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filterColor]);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 className="brush-underline">旧页批注</h1>
          <p style={{ fontFamily: 'var(--font-pizhu)', fontSize: 13, color: 'var(--ink-light)', marginTop: 8, letterSpacing: '0.1em' }}>
            共 {pagination.total} 条批注 · 皆是心中痕
          </p>
        </div>
      </div>

      {chineseColors.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          padding: 20, marginBottom: 32,
          background: 'var(--xuan-light)',
          border: '1px solid rgba(139,105,20,0.1)',
        }}>
          <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginRight: 8 }}>心情色：</span>
          <button
            className={`tag-chip ${!filterColor ? 'active' : ''}`}
            onClick={() => { setFilterColor(''); setPagination((p) => ({ ...p, page: 1 })); }}
          >全部</button>
          {chineseColors.map((c) => (
            <button
              key={c.hex}
              onClick={() => { setFilterColor(filterColor === c.hex ? '' : c.hex); setPagination((p) => ({ ...p, page: 1 })); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '4px 12px',
                border: filterColor === c.hex ? '1px solid var(--zhusha)' : '1px solid transparent',
                background: filterColor === c.hex ? 'var(--zhusha-light)' : 'transparent',
                borderRadius: 999,
                fontFamily: 'var(--font-keishu)', fontSize: 12,
                letterSpacing: '0.1em', color: 'var(--ink-medium)',
              }}
              title={c.desc}
            >
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: c.hex,
                border: '2px solid var(--xuan-white)',
                boxShadow: '0 0 0 1px rgba(0,0,0,0.1)',
              }} />
              {c.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">纸上无字</div>
          <div className="empty-state-desc">去书卷中提笔，写下你的感想吧</div>
        </div>
      ) : (
        <>
          <div>
            {notes.map((n) => (
              <OldBookPage key={n._id} note={n} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button className="page-btn" disabled={pagination.page <= 1} onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}>←</button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .slice(Math.max(0, pagination.page - 3), pagination.page + 2)
                .map((p) => (
                  <button key={p} className={`page-btn ${pagination.page === p ? 'active' : ''}`} onClick={() => setPagination((prev) => ({ ...prev, page: p }))}>{p}</button>
                ))}
              <button className="page-btn" disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}>→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
