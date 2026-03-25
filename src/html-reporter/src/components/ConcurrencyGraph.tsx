import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ISchedulingDecision } from '@cumberstorm/reporting';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

interface ConcurrencyGraphProps {
  decisions: ISchedulingDecision[];
  onDecisionClick: (decision: ISchedulingDecision) => void;
}

export function ConcurrencyGraph({ decisions, onDecisionClick }: ConcurrencyGraphProps) {
  const chartData = useMemo(() => {
    const dataPoints = decisions.map((decision, index) => ({
      decision,
      index,
      runningCount: decision.runningPickles.length,
      allowed: decision.rules_results.every(r => r.result.allowed),
    }));

    return {
      dataPoints,
      chart: {
        labels: dataPoints.map((_, i) => `#${i + 1}`),
        datasets: [
          {
            label: 'Running Pickles',
            data: dataPoints.map(p => p.runningCount),
            borderColor: 'rgba(99, 102, 241, 1)',
            backgroundColor: 'rgba(99, 102, 241, 0.08)',
            fill: true,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 8,
            pointBackgroundColor: dataPoints.map(p => p.allowed ? '#34d399' : '#f87171'),
            pointBorderColor: '#0f1117',
            pointBorderWidth: 2,
          },
        ],
      },
    };
  }, [decisions]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    onClick: (_: unknown, elements: { index: number }[]) => {
      if (elements.length > 0) {
        const idx = elements[0].index;
        onDecisionClick(decisions[idx]);
      }
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1e2130',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        callbacks: {
          title: (items: { dataIndex: number }[]) => {
            const idx = items[0].dataIndex;
            const d = decisions[idx];
            return d.candidate.name || `Decision #${idx + 1}`;
          },
          label: (item: { dataIndex: number; raw: unknown }) => {
            const idx = item.dataIndex;
            const d = decisions[idx];
            const allowed = d.rules_results.every(r => r.result.allowed);
            return [
              ` Running: ${item.raw}`,
              ` Status: ${allowed ? '✓ Allowed' : '✗ Blocked'}`,
              ` URI: ${d.candidate.uri}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Decision', color: '#475569', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#475569', maxTicksLimit: 20 },
      },
      y: {
        title: { display: true, text: 'Running Pickles', color: '#475569', font: { size: 11 } },
        grid: { color: 'rgba(255,255,255,0.04)' },
        beginAtZero: true,
        ticks: { stepSize: 1, color: '#475569' },
      },
    },
  }), [decisions, onDecisionClick]);

  if (decisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm italic">
        No scheduling decisions to display
      </div>
    );
  }

  const allowedCount = chartData.dataPoints.filter(p => p.allowed).length;
  const blockedCount = chartData.dataPoints.length - allowedCount;
  const maxConcurrency = Math.max(...chartData.dataPoints.map(p => p.runningCount));

  return (
    <div className="space-y-4">
      <div className="h-72">
        <Line data={chartData.chart} options={options as Parameters<typeof Line>[0]['options']} />
      </div>
      <div className="flex items-center gap-6 pt-3 border-t border-white/5 flex-wrap">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          Allowed ({allowedCount})
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          Blocked ({blockedCount})
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
          Peak: {maxConcurrency}
        </div>
        <span className="ml-auto text-xs text-slate-600 italic">Click any point to open decision details</span>
      </div>
    </div>
  );
}
