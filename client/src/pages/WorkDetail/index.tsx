import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { workApi, noteApi } from '@/services';
import type { Work, Note, NoteWithWork, WorkStatus, Rating } from '@/types';
import { STATUS_LABELS, TYPE_LABELS } from '@/types';
import Loading from '@/components/common/Loading';
import Modal from '@/components/common/Modal';
import SealStamp from '@/components/SealStamp';
import OldBookPage from '@/components/OldBookPage';
import ChineseColorPicker from '@/components/ChineseColorPicker';
import { useUserStore } from '@/stores/user';
import { formatDate } from '@/utils/date';

export default function WorkDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [work, setWork] = useState<Work | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [noteForm, setNoteForm] = useState({ content: '', moodColor: '', episode: 0, page: 0 });

  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressForm, setProgressForm] = useState({ currentEpisode: 0, currentPage: 0, status: 'wish' as WorkStatus, moodColor: '' });

  const { chineseColors } = useUserStore();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const w = await workApi.detail(id);
      setWork(w);
      setNotes(w.notes || []);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleRating = async (rating: Rating) => {
    if (!id || !work) return;
    const updated = await workApi.updateRating(id, rating, work.moodColor);
    setWork(updated);
  };

  const openNewNote = () => {
    setEditingNote(null);
    setNoteForm({ content: '', moodColor: work?.moodColor || '', episode: work?.currentEpisode || 0, page: work?.currentPage || 0 });
    setShowNoteModal(true);
  };

  const openEditNote = (note: Note) => {
    setEditingNote(note);
    setNoteForm({
      content: note.content,
      moodColor: note.moodColor || '',
      episode: note.location?.episode || 0,
      page: note.location?.page || 0,
    });
    setShowNoteModal(true);
  };

  const submitNote = async () => {
    if (!id || !noteForm.content.trim()) return;
    const location: any = {};
    if (noteForm.episode > 0) location.episode = noteForm.episode;
    if (noteForm.page > 0) location.page = noteForm.page;

    if (editingNote) {
      await noteApi.update(editingNote._id, { content: noteForm.content, moodColor: noteForm.moodColor, location });
    } else {
      await noteApi.create({ workId: id, content: noteForm.content, moodColor: noteForm.moodColor, location });
    }
    setShowNoteModal(false);
    loadData();
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('抹去这条批注？')) return;
    await noteApi.remove(noteId);
    loadData();
  };

  const openProgress = () => {
    if (!work) return;
    setProgressForm({
      currentEpisode: work.currentEpisode,
      currentPage: work.currentPage,
      status: work.status,
      moodColor: work.moodColor || '',
    });
    setShowProgressModal(true);
  };

  const submitProgress = async () => {
    if (!id) return;
    const updated = await workApi.updateProgress(id, progressForm);
    setWork(updated);
    setShowProgressModal(false);
  };

  const deleteWork = async () => {
    if (!id) return;
    if (!confirm('将此卷从书中抹去？此操作不可撤销。')) return;
    await workApi.remove(id);
    navigate('/works');
  };

  if (loading) return <Loading />;
  if (!work) return <div className="empty-state"><div className="empty-state-title">此卷已失</div></div>;

  const progressText = work.type === 'tv' && work.totalEpisodes
    ? `${work.currentEpisode} / ${work.totalEpisodes} 集`
    : (work.type === 'book' || work.type === 'other') && work.totalPages
    ? `${work.currentPage} / ${work.totalPages} 页`
    : work.type === 'tv' ? `第 ${work.currentEpisode} 集` : work.type === 'book' ? `第 ${work.currentPage} 页` : '';

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link to="/works" style={{
          fontFamily: 'var(--font-keishu)', fontSize: 13,
          color: 'var(--ink-light)', letterSpacing: '0.15em',
        }}>← 返书卷</Link>
      </div>

      <div
        style={{
          padding: 'var(--spacing-2xl)',
          marginBottom: 'var(--spacing-xl)',
          background: 'var(--xuan-light)',
          border: '1px solid rgba(139,105,20,0.12)',
          position: 'relative',
        }}
        className="xuan-paper"
      >
        {work.moodColor && (
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 6,
            background: work.moodColor, opacity: 0.7,
          }} />
        )}

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 32 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-keishu)', fontSize: 13,
                letterSpacing: '0.15em', padding: '3px 10px',
                border: '1px solid var(--zhusha)', color: 'var(--zhusha)',
              }}>
                {STATUS_LABELS[work.status]}
              </span>
              <span style={{
                fontFamily: 'var(--font-keishu)', fontSize: 13,
                letterSpacing: '0.15em', color: 'var(--ink-light)',
              }}>
                {TYPE_LABELS[work.type]}
              </span>
              {work.tags.map((t) => (
                <span key={t._id} className="tag-chip" style={{ fontSize: 11 }}>{t.name}</span>
              ))}
            </div>

            <h1 style={{
              fontFamily: 'var(--font-keishu)',
              fontSize: 36, letterSpacing: '0.12em',
              color: 'var(--ink-strong)', margin: 0,
            }}>
              {work.title}
            </h1>

            {work.subtitle && (
              <p style={{
                fontFamily: 'var(--font-xingkai)', fontSize: 18,
                color: 'var(--ink-medium)', marginTop: 8,
                letterSpacing: '0.08em',
              }}>
                {work.subtitle}
              </p>
            )}

            {work.author && (
              <p style={{
                fontFamily: 'var(--font-keishu)', fontSize: 15,
                color: 'var(--ink-charred)', marginTop: 16,
                letterSpacing: '0.12em',
              }}>
                {work.type === 'tv' || work.type === 'movie' ? '导演' : '作者'}：{work.author}
              </p>
            )}

            {work.description && (
              <p style={{
                fontFamily: 'var(--font-xingkai)', fontSize: 15,
                color: 'var(--ink-medium)', marginTop: 24,
                lineHeight: 2, letterSpacing: '0.04em',
              }}>
                {work.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 20, flexShrink: 0 }}>
            <div>
              <div style={{
                fontFamily: 'var(--font-keishu)', fontSize: 12,
                color: 'var(--ink-light)', letterSpacing: '0.2em',
                marginBottom: 8, textAlign: 'center',
              }}>品评</div>
              <SealStamp value={work.rating} onChange={handleRating} size="lg" />
            </div>

            {work.moodColor && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: work.moodColor,
                  border: '3px solid var(--xuan-white)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                  margin: '0 auto 4px',
                }} />
                <span style={{
                  fontFamily: 'var(--font-pizhu)', fontSize: 11,
                  color: 'var(--ink-light)',
                }}>
                  {chineseColors.find(c => c.hex === work.moodColor)?.name || '心情色'}
                </span>
              </div>
            )}
          </div>
        </div>

        <hr className="ink-divider" style={{ margin: '32px 0 24px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
          {progressText && (
            <div style={{ flex: 1, minWidth: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em' }}>进度</span>
                <span style={{ fontFamily: 'var(--font-keishu)', fontSize: 14, color: 'var(--ink-heavy)', letterSpacing: '0.1em' }}>{progressText}</span>
              </div>
              <div style={{
                height: 6, background: 'rgba(139,105,20,0.08)',
                borderRadius: 3, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${work.progressPercent || 0}%`,
                  background: work.status === 'watched' ? 'var(--zhusha)' : 'var(--cangse)',
                  borderRadius: 3,
                  transition: 'width 500ms var(--ease-scroll)',
                }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn" onClick={openProgress}>更新进度</button>
            <button className="btn btn-primary" onClick={openNewNote}>提笔批注</button>
            <button className="btn btn-ghost" onClick={deleteWork} style={{ color: 'var(--ink-light)' }}>毁卷</button>
          </div>
        </div>

        {(work.startedAt || work.finishedAt || work.createdAt) && (
          <div style={{
            marginTop: 24, paddingTop: 16,
            borderTop: '1px dashed rgba(139,105,20,0.15)',
            display: 'flex', gap: 32, flexWrap: 'wrap',
            fontFamily: 'var(--font-pizhu)', fontSize: 12,
            color: 'var(--ink-light)', letterSpacing: '0.1em',
          }}>
            <span>入卷：{formatDate(work.createdAt)}</span>
            {work.startedAt && <span>开卷：{formatDate(work.startedAt)}</span>}
            {work.finishedAt && <span>终卷：{formatDate(work.finishedAt)}</span>}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 className="brush-underline">批注 · {notes.length}</h2>
        <button className="btn btn-ghost" onClick={openNewNote}>＋ 提笔</button>
      </div>

      {notes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-title">卷中无批</div>
          <div className="empty-state-desc">点"提笔批注"，在书页留白处写下感想</div>
        </div>
      ) : (
        <div>
          {notes.map((n) => (
            <OldBookPage
              key={n._id}
              note={n}
              work={work}
              onEdit={openEditNote}
              onDelete={deleteNote}
            />
          ))}
        </div>
      )}

      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title={editingNote ? '改批' : '提笔批注'} width="600px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>批注内容</label>
            <textarea
              rows={6}
              className="textarea-field"
              value={noteForm.content}
              onChange={(e) => setNoteForm((p) => ({ ...p, content: e.target.value }))}
              placeholder="有感而发，随意落笔..."
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {work?.type === 'tv' && (
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>第几集</label>
                <input type="number" min="0" className="input-field" value={noteForm.episode} onChange={(e) => setNoteForm((p) => ({ ...p, episode: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            )}
            {(work?.type === 'book' || work?.type === 'other') && (
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>第几页</label>
                <input type="number" min="0" className="input-field" value={noteForm.page} onChange={(e) => setNoteForm((p) => ({ ...p, page: parseInt(e.target.value, 10) || 0 }))} />
              </div>
            )}
          </div>

          <ChineseColorPicker
            colors={chineseColors}
            value={noteForm.moodColor}
            onChange={(c) => setNoteForm((p) => ({ ...p, moodColor: c }))}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setShowNoteModal(false)}>搁笔</button>
            <button className="btn btn-primary" onClick={submitNote} disabled={!noteForm.content.trim()}>落笔</button>
          </div>
        </div>
      </Modal>

      <Modal open={showProgressModal} onClose={() => setShowProgressModal(false)} title="更新进度" width="520px">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>状态</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['wish', 'watching', 'watched', 'paused', 'dropped'] as WorkStatus[]).map((s) => (
                <button
                  key={s}
                  className={`tag-chip ${progressForm.status === s ? 'active' : ''}`}
                  onClick={() => setProgressForm((p) => ({ ...p, status: s }))}
                >{STATUS_LABELS[s]}</button>
              ))}
            </div>
          </div>

          {work?.type === 'tv' && (
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>看到第几集 {work?.totalEpisodes ? `(共 ${work.totalEpisodes} 集)` : ''}</label>
              <input type="number" min="0" className="input-field" value={progressForm.currentEpisode} onChange={(e) => setProgressForm((p) => ({ ...p, currentEpisode: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          )}
          {(work?.type === 'book' || work?.type === 'other') && (
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-keishu)', fontSize: 13, color: 'var(--ink-light)', letterSpacing: '0.15em', marginBottom: 8 }}>读到第几页 {work?.totalPages ? `(共 ${work.totalPages} 页)` : ''}</label>
              <input type="number" min="0" className="input-field" value={progressForm.currentPage} onChange={(e) => setProgressForm((p) => ({ ...p, currentPage: parseInt(e.target.value, 10) || 0 }))} />
            </div>
          )}

          <ChineseColorPicker
            colors={chineseColors}
            value={progressForm.moodColor}
            onChange={(c) => setProgressForm((p) => ({ ...p, moodColor: c }))}
            label="此刻心情"
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <button className="btn btn-ghost" onClick={() => setShowProgressModal(false)}>搁笔</button>
            <button className="btn btn-primary" onClick={submitProgress}>记上一笔</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
