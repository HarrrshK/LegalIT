import { useEffect, useState } from 'react';
import { ExternalLink, Newspaper } from 'lucide-react';
import { api } from '../../lib/api';

type NewsItem = { id: string; headline: string; source_name: string; source_url: string; summary: string | null; jurisdiction: string | null; practice_areas: string[]; published_at: string | null; retrieved_at: string };

export function LegalUpdatesPage() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { api<NewsItem[]>('/news').then(setItems).catch(reason => setError(reason instanceof Error ? reason.message : 'Could not load legal updates.')); }, []);
  return <div className="updates-page"><div className="page-header-flex"><div><h1>Legal news and updates</h1><p className="text-muted">Imported source links and available publication metadata.</p></div></div>{error && <div className="auth-error">{error}</div>}<div className="admin-user-list">{items.map(item => <article className="admin-card" key={item.id}><div className="admin-card-title"><div><span className="auth-kicker"><Newspaper size={14} /> {item.source_name}</span><h2>{item.headline}</h2><p>{item.published_at ? new Date(item.published_at).toLocaleDateString() : 'Publication date unavailable'} · {item.jurisdiction || 'Jurisdiction unavailable'}</p></div></div>{item.summary && <p>{item.summary}</p>}<a className="btn btn-secondary btn-sm" href={item.source_url} target="_blank" rel="noreferrer">Open original source <ExternalLink size={15} /></a></article>)}{items.length === 0 && <section className="admin-card admin-empty">No legal news has been imported. Administrators can import only reviewed, permitted sources.</section>}</div></div>;
}
