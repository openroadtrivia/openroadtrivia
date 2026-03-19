'use client';

import { NODES, EDGES } from '@/lib/game-data';

interface GameMapProps {
  currentNode: number;
  visitedNodes: number[];
  onJumpTo?: (nodeId: number) => void;
}

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/['']/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function GameMap({ currentNode, visitedNodes, onJumpTo }: GameMapProps) {
  // Current + 4 cities ahead
  const ahead: number[] = [currentNode];
  const seen = new Set(visitedNodes);
  seen.add(currentNode);
  const frontier = [currentNode];

  while (frontier.length > 0 && ahead.length < 5) {
    const nxt = frontier.shift()!;
    const edges = EDGES.filter(e => e.from === nxt || e.to === nxt);
    for (const e of edges) {
      const dest = e.from === nxt ? e.to : e.from;
      if (!seen.has(dest) && !ahead.includes(dest)) {
        ahead.push(dest);
        seen.add(dest);
        frontier.push(dest);
        if (ahead.length >= 5) break;
      }
    }
  }

  function getEdgeBetween(a: number, b: number) {
    return EDGES.find(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
  }

  return (
    <div className="mx-3 rounded-xl overflow-hidden" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid rgba(212,163,64,0.3)' }}>
      {/* Gold bar top */}
      <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #d4a340, #f5d778, #d4a340, transparent)' }} />

      <div className="px-2 py-2.5">
        <div className="flex items-end gap-0.5">
          {ahead.map((nid, i) => {
            const nd = NODES[nid];
            const isCurrent = i === 0;
            const isLast = i === ahead.length - 1;
            const cityImg = `/images/cities/${toSlug(nd.name)}.png`;
            const nextNid = !isLast ? ahead[i + 1] : null;
            const edge = nextNid !== null ? getEdgeBetween(nid, nextNid) : null;
            const canJump = !isCurrent && onJumpTo;

            return (
              <div key={nid} className="flex items-end" style={{ flex: isCurrent ? 1.4 : 1 }}>
                {/* City tile */}
                <button
                  onClick={() => canJump && onJumpTo!(nid)}
                  disabled={isCurrent}
                  className={`flex flex-col items-center flex-1 ${canJump ? 'cursor-pointer' : ''}`}
                >
                  {/* Image tile */}
                  <div
                    className={`rounded-lg overflow-hidden relative ${isCurrent ? 'w-14 h-14 ring-2 ring-amber-500/60' : 'w-10 h-10'} ${canJump ? 'hover:ring-2 hover:ring-amber-400/40 transition-all' : ''}`}
                    style={{
                      background: isCurrent
                        ? 'linear-gradient(135deg, #78350f, #92400e)'
                        : 'linear-gradient(135deg, #1f2937, #374151)',
                      boxShadow: isCurrent ? '0 0 12px rgba(245,215,120,0.3)' : 'none',
                    }}
                  >
                    <img
                      src={cityImg}
                      alt={nd.name}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    {/* Fallback: state abbreviation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`font-mono font-black ${
                        isCurrent ? 'text-amber-400/60 text-base' : 'text-gray-600 text-xs'
                      }`}>{nd.state}</span>
                    </div>

                    {/* Current pulse */}
                    {isCurrent && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2">
                        <div className="w-2 h-2 rounded-full bg-amber-400" style={{ animation: 'pulse 1.5s infinite' }} />
                      </div>
                    )}
                  </div>

                  {/* City name */}
                  <div className={`mt-1 leading-none text-center ${
                    isCurrent ? 'text-amber-300 font-bold text-[9px]' : 'text-gray-300 text-[8px]'
                  }`}>
                    {nd.name}
                  </div>

                  {/* Tap hint for future cities */}
                  {canJump && (
                    <div className="text-amber-600/40 text-[6px] font-mono">TAP</div>
                  )}
                </button>

                {/* Road connector */}
                {!isLast && (
                  <div className="flex flex-col items-center pb-5 mx-0.5" style={{ minWidth: 16 }}>
                    <div className="flex items-center gap-px w-full">
                      {[0,1,2].map(d => (
                        <div key={d} className={`h-[2px] flex-1 rounded-full ${
                          isCurrent ? 'bg-amber-500/40' : 'bg-gray-700'
                        }`} />
                      ))}
                    </div>
                    {edge && (
                      <div className="text-gray-600 text-[6px] font-mono mt-0.5">{edge.miles}mi</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Gold bar bottom */}
      <div className="h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #d4a340, #f5d778, #d4a340, transparent)' }} />
    </div>
  );
}
