import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { statsApi } from '@/services';
import type { AnnualReport } from '@/types';
import Loading from '@/components/common/Loading';
import InkScroll from '@/components/InkScroll';

export default function AnnualReport() {
  const { year } = useParams<{ year: string }>();
  const [report, setReport] = useState<AnnualReport | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!year) return;
    setLoading(true);
    statsApi.annualReport(parseInt(year, 10))
      .then(setReport)
      .finally(() => setLoading(false));
  }, [year]);

  if (loading) return <Loading />;
  if (!report) return <div className="empty-state"><div className="empty-state-title">此卷未成</div></div>;

  const years = [currentYear, currentYear - 1, currentYear - 2].filter((y) => y >= 2020);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Link to="/statistics" style={{
          fontFamily: 'var(--font-keishu)', fontSize: 13,
          color: 'var(--ink-light)', letterSpacing: '0.15em',
        }}>← 回统计</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {years.map((y) => (
            <Link
              key={y}
              to={`/annual-report/${y}`}
              style={{
                fontFamily: 'var(--font-keishu)',
                fontSize: 14, letterSpacing: '0.15em',
                padding: '6px 16px',
                color: String(y) === year ? 'var(--zhusha)' : 'var(--ink-medium)',
                borderBottom: String(y) === year ? '2px solid var(--zhusha)' : '2px solid transparent',
              }}
            >
              {y}年
            </Link>
          ))}
        </div>
      </div>

      <InkScroll report={report} />
    </div>
  );
}
