import { useState } from 'react';
import type { ISchedulingDecision, IRuleResult } from '@cumberstorm/reporting';
import type { Pickle } from '@cucumber/messages';

interface Props {
  decision: ISchedulingDecision;
  onClose: () => void;
}

const PAGE = 15;

function PickleList({ pickles, label }: { pickles: Pickle[]; label: string }) {
  const [page, setPage] = useState(0);
  const pages = Math.ceil(pickles.length / PAGE);
  const slice = pickles.slice(page * PAGE, (page + 1) * PAGE);
  return (
    <div>
      <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">{label} ({pickles.length})</p>
      {pickles.length === 0 ? (
        <p className="text-xs text-slate-600 italic">None</p>
      ) : (
        <>
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {slice.map((p, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/3 rounded-lg px-3 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-slate-200 break-words">{p.name || p.id}</p>
                  <p className="text-[10px] text-slate-500 font-mono break-all">{p.uri}</p>
                </div>
              </div>
            ))}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="text-xs text-slate-400 disabled:opacity-30 hover:text-white">‹</button>
              <span className="text-xs text-slate-500">{page + 1}/{pages}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1} className="text-xs text-slate-400 disabled:opacity-30 hover:text-white">›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function DecisionModal({ decision, onClose }: Props) {
  const [page, setPage] = useState(0);
  const results = decision.rules_results;
  const pages = Math.ceil(results.length / PAGE);
  const slice = results.slice(page * PAGE, (page + 1) * PAGE);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#13151f] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-sm font-semibold text-white">Decision Details</h2>
            <p className="text-xs text-slate-500 mt-0.5 break-words">{decision.candidate.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Candidate */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Candidate</p>
            <div className="bg-black/30 rounded-xl border border-white/5 p-4 space-y-2 text-xs">
              <div className="flex gap-3"><span className="text-slate-500 w-20 shrink-0">ID</span><span className="text-slate-300 font-mono break-all">{decision.candidate.id}</span></div>
              <div className="flex gap-3"><span className="text-slate-500 w-20 shrink-0">Name</span><span className="text-slate-200">{decision.candidate.name || '—'}</span></div>
              <div className="flex gap-3"><span className="text-slate-500 w-20 shrink-0">URI</span><span className="text-slate-300 font-mono">{decision.candidate.uri}</span></div>
              <div className="flex gap-3"><span className="text-slate-500 w-20 shrink-0">AST IDs</span><span className="text-slate-400 font-mono text-[10px]">{decision.candidate.astNodeIds?.join(', ') || '—'}</span></div>
            </div>
          </div>

          {/* Pickles */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PickleList pickles={decision.runningPickles} label="Running" />
            <PickleList pickles={decision.runnedPickles} label="Completed" />
          </div>

          {/* Rule results */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Rule Evaluations ({results.length})</p>
            <div className="rounded-xl border border-white/5 overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-black/20 border-b border-white/5">
                    {['Rule', 'Type', 'Result', 'Reason'].map(h => (
                      <th key={h} className="px-4 py-2 text-left text-[10px] text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {slice.map((r: IRuleResult, i) => (
                    <tr key={i} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 font-mono text-slate-400 text-[10px]">{r.rule.id}</td>
                      <td className="px-4 py-2.5 text-slate-300">{r.rule.name}</td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          r.result.allowed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                        }`}>
                          {r.result.allowed ? '✓ Allowed' : '✗ Blocked'}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-slate-500 break-words">{r.result.reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="text-xs text-slate-400 disabled:opacity-30 hover:text-white">‹ Prev</button>
                <span className="text-xs text-slate-500">{page + 1}/{pages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= pages - 1} className="text-xs text-slate-400 disabled:opacity-30 hover:text-white">Next ›</button>
              </div>
            )}
          </div>

          {/* Raw JSON */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Raw JSON</p>
            <pre className="bg-black/40 rounded-xl border border-white/5 p-4 text-[10px] text-slate-400 font-mono overflow-auto max-h-48 leading-relaxed">
              {JSON.stringify(decision, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
