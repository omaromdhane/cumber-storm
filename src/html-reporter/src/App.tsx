import { useState } from 'react';
import './App.css';
import type { ICumberStormReport, IRuleStats, ISchedulingDecision } from '@cumberstorm/reporting';
import { generateFakeReport } from './fakeData';
import { DecisionModal } from './components/DecisionModal';
import { DecisionViews } from './components/DecisionViews';
import { RuleDetailsModal } from './components/RuleDetailsModal';
import { PickleViewer } from './components/PickleViewer';

type Section = 'decisions' | 'rules' | 'pickles';

function loadReport(): { report: ICumberStormReport; isFake: boolean } {
  const embedded = (window as unknown as { __REPORT_DATA__?: ICumberStormReport }).__REPORT_DATA__;
  if (embedded) return { report: embedded, isFake: false };
  return { report: generateFakeReport(), isFake: true };
}

function App() {
  const [{ report, isFake }] = useState(loadReport);
  const [activeSection, setActiveSection] = useState<Section>('decisions');
  const [selectedDecision, setSelectedDecision] = useState<ISchedulingDecision | null>(null);
  const [selectedRule, setSelectedRule] = useState<IRuleStats | null>(null);

  if (!report) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0f1117]">
        <p className="text-red-400">No report data found.</p>
      </div>
    );
  }

  const duration = report.duration ? `${(report.duration / 1000).toFixed(2)}s` : 'N/A';
  const uniquePickles = new Set(report.schedulingDecisions.map(d => d.candidate.id)).size;

  const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'decisions', label: 'Decisions', icon: '⚡' },
    { id: 'rules', label: 'Rules', icon: '📐' },
    { id: 'pickles', label: 'Pickles', icon: '🥒' },
  ];

  const stats = [
    { label: 'Total Decisions', value: report.totalDecisions, sub: `${report.allowedDecisions} allowed · ${report.blockedDecisions} blocked`, color: 'text-indigo-400' },
    { label: 'Peak Concurrency', value: report.maxConcurrency, sub: `avg ${report.averageConcurrency.toFixed(1)} · min ${report.minConcurrency}`, color: 'text-violet-400' },
    { label: 'Rules', value: report.ruleStats.length, sub: 'active scheduling rules', color: 'text-sky-400' },
    { label: 'Scenarios', value: uniquePickles, sub: 'unique pickles evaluated', color: 'text-emerald-400' },
  ];

  return (
    <div className="flex min-h-screen bg-[#0f1117]">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#13151f] border-r border-white/5 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm tracking-wide">CumberStorm</span>
          </div>
            {isFake && (
            <span className="mt-2 inline-block text-[10px] font-medium bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
              DEMO DATA
            </span>
          )}
        </div>

        {/* Meta */}
        <div className="px-5 py-4 border-b border-white/5 space-y-1">
          {report.startTime && (
            <p className="text-[11px] text-slate-500">
              <span className="text-slate-400">Start</span> {new Date(report.startTime).toLocaleTimeString()}
            </p>
          )}
          {report.endTime && (
            <p className="text-[11px] text-slate-500">
              <span className="text-slate-400">End</span> {new Date(report.endTime).toLocaleTimeString()}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            <span className="text-slate-400">Duration</span> {duration}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                activeSection === item.id
                  ? 'bg-indigo-500/20 text-indigo-300 font-medium'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-white/5 bg-[#13151f] flex items-center px-6 gap-4 shrink-0">
          <h1 className="text-sm font-semibold text-white">
            {navItems.find(n => n.id === activeSection)?.label}
          </h1>
          <span className="text-white/10">|</span>
          <p className="text-xs text-slate-500">
            {report.startTime ? new Date(report.startTime).toLocaleDateString() : 'Report'}
          </p>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 border-b border-white/5">
          {stats.map(s => (
            <div key={s.label} className="bg-[#13151f] rounded-xl border border-white/5 p-4">
              <p className="text-xs text-slate-500 mb-1">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-600 mt-1">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">
          {activeSection === 'decisions' && (
            <DecisionViews decisions={report.schedulingDecisions} onDecisionClick={setSelectedDecision} />
          )}

          {activeSection === 'rules' && (
            <div className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Rules Statistics</h2>
                <p className="text-xs text-slate-500 mt-0.5">Click a row for matcher details</p>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Rule ID', 'Type', 'Evaluations', 'Allowed', 'Blocked', 'Pass Rate'].map(h => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.ruleStats.map((stat, idx) => {
                    const rate = ((stat.allowedCount / stat.totalEvaluations) * 100).toFixed(1);
                    const rateNum = parseFloat(rate);
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRule(stat)}
                        className="border-b border-white/5 hover:bg-white/3 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3 font-mono text-xs text-slate-400">{stat.rule.id}</td>
                        <td className="px-5 py-3 text-slate-200">{stat.rule.name}</td>
                        <td className="px-5 py-3 text-slate-300">{stat.totalEvaluations}</td>
                        <td className="px-5 py-3 text-emerald-400 font-medium">{stat.allowedCount}</td>
                        <td className="px-5 py-3 text-red-400 font-medium">{stat.blockedCount}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            rateNum > 80 ? 'bg-emerald-500/15 text-emerald-400' :
                            rateNum > 50 ? 'bg-amber-500/15 text-amber-400' :
                            'bg-red-500/15 text-red-400'
                          }`}>{rate}%</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeSection === 'pickles' && (
            <div className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/5">
                <h2 className="text-sm font-semibold text-white">Pickle Viewer</h2>
                <p className="text-xs text-slate-500 mt-0.5">All unique scenarios evaluated during the run</p>
              </div>
              <div className="p-5">
                <PickleViewer decisions={report.schedulingDecisions} onDecisionClick={setSelectedDecision} />
              </div>
            </div>
          )}
        </main>
      </div>

      {selectedDecision && (
        <DecisionModal decision={selectedDecision} onClose={() => setSelectedDecision(null)} />
      )}
      {selectedRule && (
        <RuleDetailsModal ruleStats={selectedRule} onClose={() => setSelectedRule(null)} />
      )}
    </div>
  );
}

export default App;
