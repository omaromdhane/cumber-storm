import type { Pickle, PickleStep } from '@cucumber/messages';
import type { ISchedulingDecision } from '@cumberstorm/reporting';

interface Props {
  pickle: Pickle;
  decisions: ISchedulingDecision[];
  onClose: () => void;
  onDecisionClick: (d: ISchedulingDecision) => void;
}

function StepArg({ step }: { step: PickleStep }) {
  const arg = step.argument;
  if (!arg) return null;
  if (arg.docString) return (
    <pre className="mt-2 bg-black/40 rounded-lg p-3 text-[10px] text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap">
      {arg.docString.mediaType && <span className="text-slate-600 block mb-1">{arg.docString.mediaType}</span>}
      {arg.docString.content}
    </pre>
  );
  if (arg.dataTable) return (
    <table className="mt-2 text-[10px] border-collapse">
      <tbody>
        {arg.dataTable.rows.map((row, ri) => (
          <tr key={ri}>
            {row.cells.map((cell, ci) => (
              <td key={ci} className={`border border-white/10 px-2 py-1 text-slate-300 ${ri === 0 ? 'bg-white/5 font-medium' : ''}`}>{cell.value}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
  return null;
}

export function PickleModal({ pickle, decisions, onClose, onDecisionClick }: Props) {
  const wasBlocked = decisions.some(d => !d.rules_results.every(r => r.result.allowed));
  const allowed = decisions.filter(d => d.rules_results.every(r => r.result.allowed)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#13151f] border-b border-white/5 px-6 py-4 flex items-center gap-3 z-10">
          <span className={`w-2 h-2 rounded-full shrink-0 ${wasBlocked ? 'bg-red-400' : 'bg-emerald-400'}`} />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white break-words">{pickle.name || pickle.id}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 break-all">{pickle.uri}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none transition-colors shrink-0">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Identity */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Identity</p>
            <div className="bg-black/30 rounded-xl border border-white/5 p-4 grid grid-cols-[80px_1fr] gap-x-3 gap-y-2 text-xs">
              {[
                ['ID', pickle.id],
                ['Language', pickle.language || '—'],
                ['AST IDs', pickle.astNodeIds?.join(', ') || '—'],
              ].map(([k, v]) => (
                <>
                  <span key={`k-${k}`} className="text-slate-500">{k}</span>
                  <span key={`v-${k}`} className="text-slate-300 font-mono break-all">{v}</span>
                </>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Tags ({pickle.tags?.length ?? 0})</p>
            {!pickle.tags?.length ? (
              <p className="text-xs text-slate-600 italic">No tags</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {pickle.tags.map((t, i) => (
                  <div key={i} className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-1.5">
                    <p className="text-xs text-indigo-300 font-medium">{t.name}</p>
                    <p className="text-[9px] text-slate-600 font-mono mt-0.5">{t.astNodeId}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Steps */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">Steps ({pickle.steps?.length ?? 0})</p>
            {!pickle.steps?.length ? (
              <p className="text-xs text-slate-600 italic">No steps</p>
            ) : (
              <ol className="space-y-2">
                {pickle.steps.map((step, i) => (
                  <li key={step.id ?? i} className="bg-black/30 rounded-xl border border-white/5 px-4 py-3">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      {step.type && (
                        <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold px-2 py-0.5 rounded uppercase shrink-0">
                          {step.type}
                        </span>
                      )}
                      <span className="text-xs text-slate-200">{step.text}</span>
                    </div>
                    <StepArg step={step} />
                    <p className="text-[9px] text-slate-600 font-mono mt-2">{step.id}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Scheduling */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">
              Scheduling ({decisions.length} decision{decisions.length !== 1 ? 's' : ''})
            </p>
            <div className="flex gap-3 mb-3">
              <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-emerald-400">{allowed}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Allowed</p>
              </div>
              <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-red-400">{decisions.length - allowed}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Blocked</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {decisions.map((d, i) => {
                const ok = d.rules_results.every(r => r.result.allowed);
                return (
                  <button
                    key={i}
                    onClick={() => { onDecisionClick(d); onClose(); }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-opacity hover:opacity-75 ${
                      ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
                    }`}
                  >
                    #{i + 1} {ok ? '✓' : '✗'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Raw JSON */}
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Raw JSON</p>
            <pre className="bg-black/40 rounded-xl border border-white/5 p-4 text-[10px] text-slate-400 font-mono overflow-auto max-h-48 leading-relaxed">
              {JSON.stringify(pickle, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
