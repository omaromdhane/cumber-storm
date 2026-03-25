import { useMemo, useRef, useEffect, useState, useCallback } from 'react';
import type { ISchedulingDecision } from '@cumberstorm/reporting';

interface Props {
  decisions: ISchedulingDecision[];
  onDecisionClick: (decision: ISchedulingDecision) => void;
}

// Layout constants
const COL_W = 72;       // width per decision column
const ROW_H = 44;       // height per pickle row
const HEADER_H = 56;    // top header for decision numbers
const LABEL_W = 200;    // left label column width
const NODE_R = 13;      // node circle radius
const PAD = 24;         // outer padding

interface PickleEntry {
  id: string;
  name: string;
  uri: string;
  rowIndex: number;
}

interface DecisionNode {
  decision: ISchedulingDecision;
  colIndex: number;
  allowed: boolean;
  runningIds: Set<string>;
  doneIds: Set<string>;
}

export function DecisionNodeGraph({ decisions, onDecisionClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(900);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; node: DecisionNode } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const isPanning = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const obs = new ResizeObserver(entries => {
      setContainerW(entries[0]?.contentRect.width ?? 900);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Build ordered pickle list (all unique pickles seen as candidates, in order)
  const { pickles, nodes, svgW, svgH } = useMemo(() => {
    const pickleMap = new Map<string, PickleEntry>();
    decisions.forEach(d => {
      if (!pickleMap.has(d.candidate.id)) {
        pickleMap.set(d.candidate.id, {
          id: d.candidate.id,
          name: d.candidate.name || d.candidate.id,
          uri: d.candidate.uri,
          rowIndex: pickleMap.size,
        });
      }
    });
    const pickles = Array.from(pickleMap.values());

    const nodes: DecisionNode[] = decisions.map((d, i) => ({
      decision: d,
      colIndex: i,
      allowed: d.rules_results.every(r => r.result.allowed),
      runningIds: new Set(d.runningPickles.map(p => p.id)),
      doneIds: new Set(d.runnedPickles.map(p => p.id)),
    }));

    const svgW = PAD + LABEL_W + decisions.length * COL_W + PAD;
    const svgH = PAD + HEADER_H + pickles.length * ROW_H + PAD;

    return { pickles, nodes, svgW, svgH };
  }, [decisions]);

  // Coordinate helpers
  const colX = (col: number) => PAD + LABEL_W + col * COL_W + COL_W / 2;
  const rowY = (row: number) => PAD + HEADER_H + row * ROW_H + ROW_H / 2;

  // Pan handlers
  const [cursor, setCursor] = useState<'grab' | 'grabbing'>('grab');

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isPanning.current = true;
    setCursor('grabbing');
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning.current) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(p => ({ x: p.x + dx, y: p.y + dy }));
  }, []);

  const onMouseUp = useCallback(() => {
    isPanning.current = false;
    setCursor('grab');
  }, []);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(2, Math.max(0.3, z - e.deltaY * 0.001)));
  }, []);

  const resetView = () => { setPan({ x: 0, y: 0 }); setZoom(1); };

  if (decisions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-600 text-sm italic">
        No scheduling decisions to display
      </div>
    );
  }

  const viewH = 520;
  const allowedCount = nodes.filter(n => n.allowed).length;
  const blockedCount = nodes.length - allowedCount;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> Allowed ({allowedCount})</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Blocked ({blockedCount})</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" /> Running at decision time</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-600 inline-block" /> Completed</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.min(2, z + 0.15))} className="px-2 py-1 text-xs text-slate-400 border border-white/10 rounded hover:text-white hover:border-white/20 transition-colors">+</button>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.15))} className="px-2 py-1 text-xs text-slate-400 border border-white/10 rounded hover:text-white hover:border-white/20 transition-colors">−</button>
          <button onClick={resetView} className="px-2.5 py-1 text-xs text-slate-400 border border-white/10 rounded hover:text-white hover:border-white/20 transition-colors">Reset</button>
          <span className="text-xs text-slate-600">{Math.round(zoom * 100)}%</span>
        </div>
      </div>

      {/* Graph */}
      <div
        ref={containerRef}
        className="relative rounded-xl border border-white/5 bg-[#0d0f18] overflow-hidden select-none"
        style={{ height: viewH, cursor }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <svg
          width={svgW}
          height={svgH}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0', display: 'block' }}
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Background grid */}
          <rect width={svgW} height={svgH} fill="url(#grid)" />

          {/* Header row background */}
          <rect x={0} y={0} width={svgW} height={PAD + HEADER_H} fill="rgba(0,0,0,0.3)" />

          {/* Label column background */}
          <rect x={0} y={0} width={PAD + LABEL_W} height={svgH} fill="rgba(0,0,0,0.2)" />

          {/* Alternating row stripes */}
          {pickles.map((p, ri) => (
            <rect
              key={p.id}
              x={0} y={PAD + HEADER_H + ri * ROW_H}
              width={svgW} height={ROW_H}
              fill={ri % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent'}
            />
          ))}

          {/* Column separators */}
          {nodes.map((_, ci) => (
            <line
              key={ci}
              x1={PAD + LABEL_W + ci * COL_W} y1={PAD + HEADER_H}
              x2={PAD + LABEL_W + ci * COL_W} y2={svgH}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          ))}

          {/* Row separators */}
          {pickles.map((_, ri) => (
            <line
              key={ri}
              x1={PAD + LABEL_W} y1={PAD + HEADER_H + ri * ROW_H}
              x2={svgW} y2={PAD + HEADER_H + ri * ROW_H}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1"
            />
          ))}

          {/* Pickle labels */}
          {pickles.map(p => (
            <g key={p.id}>
              <text
                x={PAD + LABEL_W - 10}
                y={rowY(p.rowIndex) - 5}
                textAnchor="end"
                fontSize="11"
                fill="#94a3b8"
                fontFamily="ui-monospace, monospace"
              >
                {p.name.length > 26 ? p.name.slice(0, 25) + '…' : p.name}
              </text>
              <text
                x={PAD + LABEL_W - 10}
                y={rowY(p.rowIndex) + 9}
                textAnchor="end"
                fontSize="9"
                fill="#475569"
                fontFamily="ui-monospace, monospace"
              >
                {p.uri.length > 30 ? '…' + p.uri.slice(-29) : p.uri}
              </text>
            </g>
          ))}

          {/* Decision column headers */}
          {nodes.map(node => (
            <g key={node.colIndex}>
              {/* Header background pill */}
              <rect
                x={colX(node.colIndex) - 18} y={PAD + 8}
                width={36} height={22}
                rx={11}
                fill={node.allowed ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)'}
                stroke={node.allowed ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}
                strokeWidth="1"
              />
              <text
                x={colX(node.colIndex)} y={PAD + 23}
                textAnchor="middle"
                fontSize="10"
                fontWeight="600"
                fill={node.allowed ? '#34d399' : '#f87171'}
                fontFamily="ui-monospace, monospace"
              >
                #{node.colIndex + 1}
              </text>
            </g>
          ))}

          {/* Cells — state dots for each (decision, pickle) pair */}
          {nodes.map(node =>
            pickles.map(p => {
              const isCandidate = node.decision.candidate.id === p.id;
              const isRunning = node.runningIds.has(p.id);
              const isDone = node.doneIds.has(p.id);

              if (!isCandidate && !isRunning && !isDone) return null;

              const cx = colX(node.colIndex);
              const cy = rowY(p.rowIndex);

              if (isCandidate) {
                return (
                  <g
                    key={`${node.colIndex}-${p.id}`}
                    onClick={e => { e.stopPropagation(); onDecisionClick(node.decision); }}
                    onMouseEnter={e => {
                      const rect = (e.currentTarget.ownerSVGElement?.parentElement as HTMLElement)?.getBoundingClientRect();
                      setTooltip({ x: e.clientX - (rect?.left ?? 0), y: e.clientY - (rect?.top ?? 0), node });
                    }}
                    onMouseLeave={() => setTooltip(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Glow ring */}
                    <circle cx={cx} cy={cy} r={NODE_R + 5}
                      fill={node.allowed ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)'}
                    />
                    <circle cx={cx} cy={cy} r={NODE_R}
                      fill={node.allowed ? '#059669' : '#dc2626'}
                      stroke={node.allowed ? '#34d399' : '#f87171'}
                      strokeWidth="1.5"
                    />
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fontWeight="700" fill="white" pointerEvents="none">
                      {node.allowed ? '✓' : '✗'}
                    </text>
                  </g>
                );
              }

              if (isRunning) {
                return (
                  <g key={`${node.colIndex}-${p.id}-run`}>
                    <circle cx={cx} cy={cy} r={6} fill="rgba(99,102,241,0.25)" stroke="#818cf8" strokeWidth="1" />
                    <circle cx={cx} cy={cy} r={3} fill="#818cf8" />
                  </g>
                );
              }

              // isDone
              return (
                <g key={`${node.colIndex}-${p.id}-done`}>
                  <circle cx={cx} cy={cy} r={4} fill="rgba(100,116,139,0.3)" stroke="#475569" strokeWidth="1" />
                </g>
              );
            })
          )}

          {/* Horizontal flow lines connecting candidate nodes for each pickle */}
          {pickles.map(p => {
            const candidateNodes = nodes.filter(n => n.decision.candidate.id === p.id);
            if (candidateNodes.length < 2) return null;
            return candidateNodes.slice(0, -1).map((n, i) => {
              const next = candidateNodes[i + 1]!;
              return (
                <line
                  key={`flow-${p.id}-${i}`}
                  x1={colX(n.colIndex) + NODE_R} y1={rowY(p.rowIndex)}
                  x2={colX(next.colIndex) - NODE_R} y2={rowY(p.rowIndex)}
                  stroke="rgba(148,163,184,0.15)" strokeWidth="1" strokeDasharray="4,4"
                />
              );
            });
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute z-20 pointer-events-none bg-[#1e2130] border border-white/10 rounded-xl shadow-2xl p-3 text-xs min-w-[220px]"
            style={{ left: Math.min(tooltip.x + 12, containerW - 240), top: Math.max(tooltip.y - 80, 8) }}
          >
            <p className="font-semibold text-white mb-1">Decision #{tooltip.node.colIndex + 1}</p>
            <p className="text-slate-400 mb-2 leading-snug">{tooltip.node.decision.candidate.name}</p>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                tooltip.node.allowed ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'
              }`}>
                {tooltip.node.allowed ? '✓ Allowed' : '✗ Blocked'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] mt-2">
              <span className="text-slate-500">Running</span><span className="text-indigo-300">{tooltip.node.runningIds.size}</span>
              <span className="text-slate-500">Completed</span><span className="text-slate-300">{tooltip.node.doneIds.size}</span>
              <span className="text-slate-500">Rules</span><span className="text-slate-300">{tooltip.node.decision.rules_results.length}</span>
            </div>
            <p className="text-slate-600 text-[10px] mt-2">Click to open details</p>
          </div>
        )}

        {/* Scroll hint */}
        <div className="absolute bottom-3 right-3 text-[10px] text-slate-700 pointer-events-none">
          Scroll to zoom · Drag to pan
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 text-xs text-slate-500 px-1">
        <span>{decisions.length} decisions</span>
        <span>{pickles.length} unique scenarios</span>
        <span className="text-emerald-500">{allowedCount} allowed</span>
        <span className="text-red-500">{blockedCount} blocked</span>
      </div>
    </div>
  );
}
