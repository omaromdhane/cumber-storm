import { useState } from 'react';
import type { ISchedulingDecision } from '@cumberstorm/reporting';
import { ConcurrencyGraph } from './ConcurrencyGraph';
import { SchedulingDecisionsTable } from './SchedulingDecisionsTable';
import { DecisionNodeGraph } from './DecisionNodeGraph';

interface DecisionViewsProps {
  decisions: ISchedulingDecision[];
  onDecisionClick: (decision: ISchedulingDecision) => void;
}

type ViewType = 'graph' | 'table' | 'nodes';

const tabs: { id: ViewType; label: string; icon: string; desc: string }[] = [
  { id: 'graph', label: 'Line Graph', icon: '', desc: 'Concurrency over time' },
  { id: 'table', label: 'Table', icon: '', desc: 'Detailed decision list' },
  { id: 'nodes', label: 'Decision Flow', icon: '', desc: 'Decision flow' },
];

export function DecisionViews({ decisions, onDecisionClick }: DecisionViewsProps) {
  const [activeView, setActiveView] = useState<ViewType>('graph');

  return (
    <div className="space-y-4">
      <div className="bg-[#13151f] rounded-xl border border-white/5 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white">Scheduling Decisions</h2>
            <p className="text-xs text-slate-500 mt-0.5">{decisions.length} decisions across all scenarios</p>
          </div>
          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-black/30 rounded-lg p-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                title={tab.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeView === tab.id
                    ? 'bg-indigo-500 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* View content */}
        <div className="p-5">
          {activeView === 'graph' && <ConcurrencyGraph decisions={decisions} onDecisionClick={onDecisionClick} />}
          {activeView === 'table' && <SchedulingDecisionsTable decisions={decisions} onDecisionClick={onDecisionClick} />}
          {activeView === 'nodes' && <DecisionNodeGraph decisions={decisions} onDecisionClick={onDecisionClick} />}
        </div>
      </div>
    </div>
  );
}
