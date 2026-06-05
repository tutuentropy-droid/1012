export default function Loading({ text = '墨迹渐显...' }: { text?: string }) {
  return (
    <div className="loading-ink-wrap" style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '80px 0', gap: 20
    }}>
      <div className="loading-ink" />
      <span style={{
        fontFamily: 'var(--font-keishu)',
        fontSize: 'var(--fs-small)',
        letterSpacing: '0.3em',
        color: 'var(--ink-light)'
      }}>{text}</span>
    </div>
  );
}
