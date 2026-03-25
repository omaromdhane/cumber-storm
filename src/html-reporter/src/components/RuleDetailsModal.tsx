import type { IRuleStats } from '@cumberstorm/reporting';

interface Props {
  ruleStats: IRuleStats;
  onClose: () => void;
}

export function RuleDetailsModal({ ruleStats, onClose }: Props) {
  const { rule } = ruleStats;
  const rate = ((ruleStats.allowedCount / ruleStats.totalEvaluations) * 100).toFixed(1);
  const rateNum = parseFloat(rate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#13151f] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-[#13151f] border-b border-white/5 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-sm font-semibold text-white">{rule.name}</h2>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{rule.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl leading-none transition-colors">×</button>
        </div>

        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Total', value: ruleStats.totalEvaluations, color: 'text-slate-200' },
              { label: 'Pass Rate', value: `${rate}%`, color: rateNum > 80 ? 'text-emerald-400' : rateNum > 50 ? 'text-amber-400' : 'text-red-400' },
              { label: 'Allowed', value: ruleStats.allowedCount, color: 'text-emerald-400' },
              { label: 'Blocked', value: ruleStats.blockedCount, color: 'text-red-400' },
            ].map(s => (
              <div key={s.label} className="bg-black/30 rounded-xl border border-white/5 p-4">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Matchers */}
          {ruleStats.matchers.length > 0 && (
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-3">
                Matchers ({ruleStats.matchers.length})
              </p>
              <div className="space-y-2">
                {ruleStats.matchers.map((m, i) => (
                  <div key={i} className="bg-black/30 rounded-xl border border-white/5 p-3 text-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-medium">{m.type}</span>
                      {rule.name === 'sequential' && (
                        <span className="bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full text-[10px]">Step {i + 1}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-slate-500">ID</span><span className="text-slate-300 font-mono break-all">{m.id}</span>
                      <span className="text-slate-500">Level</span><span className="text-slate-300">{m.level}</span>
                      <span className="text-slate-500">Type</span><span className="text-slate-300">{m.type}</span>
                      {m.pattern && (
                        <>
                          <span className="text-slate-500">Pattern</span>
                          <span className="text-amber-300 font-mono break-all">{m.pattern}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
