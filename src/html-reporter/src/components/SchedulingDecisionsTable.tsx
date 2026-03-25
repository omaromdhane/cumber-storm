import { useState, useMemo } from 'react';
import type { ISchedulingDecision, IRuleResult } from '@cumberstorm/reporting';

interface Props {
  decisions: ISchedulingDecision[];
  onDecisionClick: (decision: ISchedulingDecision) => void;
}

export function SchedulingDecisionsTable({ decisions, onDecisionClick }: Props) {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [filters, setFilters] = useState({
    candidate: '',
    rule: '',
    status: 'all' as 'all' | 'allowed' | 'blocked',
    uri: '',
  });

  const uniqueRules = useMemo(() => {
    const s = new Set<string>();
    decisions.forEach(d => d.rules_results.forEach((r: IRuleResult) => s.add(r.rule.name)));
    return Array.from(s).sort();
  }, [decisions]);

  const uniqueUris = useMemo(() => {
    const s = new Set<string>();
    decisions.forEach(d => s.add(d.candidate.uri));
    return Array.from(s).sort();
  }, [decisions]);

  const filtered = useMemo(() => decisions.filter(d => {
    const allowed = d.rules_results.every((r: IRuleResult) => r.result.allowed);
    if (filters.status === 'allowed' && !allowed) return false;
    if (filters.status === 'blocked' && allowed) return false;
    if (filters.candidate && !d.candidate.name?.toLowerCase().includes(filters.candidate.toLowerCase())) return false;
    if (filters.uri && filters.uri !== 'all' && d.candidate.uri !== filters.uri) return false;
    if (filters.rule && filters.rule !== 'all' && !d.rules_results.some((r: IRuleResult) => r.rule.name === filters.rule)) return false;
    return true;
  }), [decisions, filters]);

  const clearFilters = () => setFilters({ candidate: '', rule: '', status: 'all', uri: '' });
  const hasFilters = filters.candidate || filters.rule || filters.status !== 'all' || filters.uri;

  const inputCls = "bg-[#1a1d2e] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-colors appearance-none";

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Candidate</label>
          <input
            type="text"
            placeholder="Search…"
            value={filters.candidate}
            onChange={e => setFilters({ ...filters, candidate: e.target.value })}
            className={inputCls}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Feature File</label>
          <select value={filters.uri} onChange={e => setFilters({ ...filters, uri: e.target.value })} className={inputCls}>
            <option value="">All files</option>
            {uniqueUris.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Rule</label>
          <select value={filters.rule} onChange={e => setFilters({ ...filters, rule: e.target.value })} className={inputCls}>
            <option value="">All rules</option>
            {uniqueRules.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Status</label>
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value as 'all' | 'allowed' | 'blocked' })} className={inputCls}>
            <option value="all">All</option>
            <option value="allowed">✓ Allowed</option>
            <option value="blocked">✗ Blocked</option>
          </select>
        </div>
        {hasFilters && (
          <button onClick={clearFilters} className="px-3 py-1.5 text-xs text-slate-400 hover:text-white border border-white/10 rounded-lg transition-colors">
            Clear
          </button>
        )}
        <span className="ml-auto text-xs text-slate-500">{filtered.length} / {decisions.length}</span>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/20 border-b border-white/5">
              {['#', 'Status', 'Candidate', 'Feature File', 'Running', 'Completed', ''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-medium text-slate-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-600 text-xs italic">
                  No decisions match the current filters
                </td>
              </tr>
            ) : filtered.map((decision, idx) => {
              const allowed = decision.rules_results.every((r: IRuleResult) => r.result.allowed);
              const blockingRules = decision.rules_results.filter((r: IRuleResult) => !r.result.allowed).map((r: IRuleResult) => r.rule.name);
              const isExpanded = expandedRow === idx;
              const originalIndex = decisions.indexOf(decision);

              return (
                <>
                  <tr
                    key={idx}
                    onClick={() => setExpandedRow(isExpanded ? null : idx)}
                    className={`border-b border-white/5 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-indigo-500/5' : 'hover:bg-white/3'
                    }`}
                  >
                    <td className="px-4 py-3 text-xs text-slate-600 font-mono">{originalIndex + 1}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                        allowed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {allowed ? '✓' : '✗'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-200 text-xs">{decision.candidate.name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs font-mono break-all">{decision.candidate.uri}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block min-w-[1.5rem] text-center text-xs font-medium text-indigo-300 bg-indigo-500/10 rounded px-1.5 py-0.5">
                        {decision.runningPickles.length}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-block min-w-[1.5rem] text-center text-xs font-medium text-slate-400 bg-white/5 rounded px-1.5 py-0.5">
                        {decision.runnedPickles.length}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); onDecisionClick(decision); }}
                        className="px-2.5 py-1 text-[11px] font-medium text-indigo-400 border border-indigo-500/30 rounded-md hover:bg-indigo-500/10 transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${idx}-exp`} className="bg-black/20 border-b border-white/5">
                      <td colSpan={7} className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Candidate</p>
                            <p className="text-slate-400 font-mono break-all">{decision.candidate.id}</p>
                            <p className="text-slate-500 mt-1">{decision.candidate.uri}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Rule Results</p>
                            <div className="space-y-1">
                              {decision.rules_results.map((r: IRuleResult, i: number) => (
                                <div key={i} className="flex items-center gap-2">
                                  <span className={r.result.allowed ? 'text-emerald-400' : 'text-red-400'}>{r.result.allowed ? '✓' : '✗'}</span>
                                  <span className="text-slate-300">{r.rule.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Execution State</p>
                            <p className="text-slate-400">Running: <span className="text-indigo-300">{decision.runningPickles.length}</span></p>
                            <p className="text-slate-400 mt-1">Completed: <span className="text-slate-300">{decision.runnedPickles.length}</span></p>
                            {!allowed && blockingRules.length > 0 && (
                              <p className="text-red-400 mt-1">Blocked by: {blockingRules.join(', ')}</p>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
