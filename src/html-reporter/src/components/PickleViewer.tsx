import { useState, useMemo } from 'react';
import type { Pickle } from '@cucumber/messages';
import type { ISchedulingDecision } from '@cumberstorm/reporting';
import { PickleModal } from './PickleModal';

interface Props {
  decisions: ISchedulingDecision[];
  onDecisionClick: (d: ISchedulingDecision) => void;
}

interface PickleRow {
  pickle: Pickle;
  decisions: ISchedulingDecision[];
  wasBlocked: boolean;
}

const PAGE = 20;

export function PickleViewer({ decisions, onDecisionClick }: Props) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'allowed' | 'blocked'>('all');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<PickleRow | null>(null);

  const rows = useMemo<PickleRow[]>(() => {
    const map = new Map<string, PickleRow>();
    for (const d of decisions) {
      const ok = d.rules_results.every(r => r.result.allowed);
      if (!map.has(d.candidate.id)) map.set(d.candidate.id, { pickle: d.candidate, decisions: [], wasBlocked: false });
      const row = map.get(d.candidate.id)!;
      row.decisions.push(d);
      if (!ok) row.wasBlocked = true;
    }
    return Array.from(map.values());
  }, [decisions]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter(row => {
      if (filter === 'allowed' && row.wasBlocked) return false;
      if (filter === 'blocked' && !row.wasBlocked) return false;
      if (!q) return true;
      return (
        row.pickle.name?.toLowerCase().includes(q) ||
        row.pickle.uri?.toLowerCase().includes(q) ||
        row.pickle.tags?.some(t => t.name.toLowerCase().includes(q))
      );
    });
  }, [rows, search, filter]);

  const pages = Math.ceil(filtered.length / PAGE);
  const slice = filtered.slice(page * PAGE, (page + 1) * PAGE);

  const set = (val: typeof filter) => { setFilter(val); setPage(0); };
  const search_ = (val: string) => { setSearch(val); setPage(0); };

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="search"
          placeholder="Search by name, URI, or tag…"
          value={search}
          onChange={e => search_(e.target.value)}
          className="flex-1 min-w-[180px] bg-black/30 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
        />
        <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
          {(['all', 'allowed', 'blocked'] as const).map(f => (
            <button
              key={f}
              onClick={() => set(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filter === f
                  ? f === 'allowed' ? 'bg-emerald-500 text-white'
                  : f === 'blocked' ? 'bg-red-500 text-white'
                  : 'bg-indigo-500 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">{filtered.length} pickle{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/5 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              {['Name', 'URI', 'Tags', 'Decisions', 'Status', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-600 italic">No pickles match your filters</td></tr>
            ) : slice.map(row => (
              <>
                <tr
                  key={row.pickle.id}
                  onClick={() => setExpanded(expanded === row.pickle.id ? null : row.pickle.id)}
                  className={`border-b border-white/5 cursor-pointer transition-colors ${
                    expanded === row.pickle.id ? 'bg-indigo-500/5' : 'hover:bg-white/3'
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${row.wasBlocked ? 'bg-red-400' : 'bg-emerald-400'}`} />
                      <span className="text-slate-200 break-words">{row.pickle.name || row.pickle.id}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono break-all">{row.pickle.uri}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {row.pickle.tags?.slice(0, 3).map((t, i) => (
                        <span key={i} className="bg-indigo-500/10 text-indigo-300 text-[10px] px-1.5 py-0.5 rounded">{t.name}</span>
                      ))}
                      {(row.pickle.tags?.length ?? 0) > 3 && (
                        <span className="text-slate-600 text-[10px]">+{(row.pickle.tags?.length ?? 0) - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-indigo-300 bg-indigo-500/10 rounded px-1.5 py-0.5 font-medium">{row.decisions.length}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      row.wasBlocked ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {row.wasBlocked ? 'Blocked' : 'Allowed'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); setSelected(row); }}
                      className="px-2.5 py-1 text-[11px] font-medium text-indigo-400 border border-indigo-500/30 rounded-md hover:bg-indigo-500/10 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>

                {expanded === row.pickle.id && (
                  <tr key={`${row.pickle.id}-exp`} className="bg-black/20 border-b border-white/5">
                    <td colSpan={6} className="px-6 py-4">
                      <p className="text-[10px] text-slate-500 font-mono mb-2">{row.pickle.id}</p>
                      <p className="text-[10px] text-slate-500 mb-3">AST: {row.pickle.astNodeIds?.join(', ') || '—'}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Decisions</p>
                      <div className="flex flex-wrap gap-2">
                        {row.decisions.map((d, i) => {
                          const ok = d.rules_results.every(r => r.result.allowed);
                          return (
                            <button
                              key={i}
                              onClick={e => { e.stopPropagation(); onDecisionClick(d); }}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-75 ${
                                ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                              }`}
                            >
                              #{decisions.indexOf(d) + 1} {ok ? '✓' : '✗'}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-3 py-1.5 text-xs text-slate-400 border border-white/10 rounded-lg disabled:opacity-30 hover:text-white hover:border-white/20 transition-colors">‹ Prev</button>
          <span className="text-xs text-slate-500">{page + 1} / {pages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1} className="px-3 py-1.5 text-xs text-slate-400 border border-white/10 rounded-lg disabled:opacity-30 hover:text-white hover:border-white/20 transition-colors">Next ›</button>
        </div>
      )}

      {selected && (
        <PickleModal
          pickle={selected.pickle}
          decisions={selected.decisions}
          onClose={() => setSelected(null)}
          onDecisionClick={d => { setSelected(null); onDecisionClick(d); }}
        />
      )}
    </>
  );
}
