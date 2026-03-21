'use client';
import { useState, useEffect } from 'react';
import { usePlayer, type LeaderboardEntry } from '@/lib/player-context';

export default function Leaderboard({ onClose }: { onClose: () => void }) {
  const { getLeaderboard, player } = usePlayer();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getLeaderboard('route66', 50);
      setEntries(data);
      setLoading(false);
    }
    load();
  }, [getLeaderboard]);

  return (
    <div className="min-h-screen game-bg pb-10">
      <div className="deco-bg px-4 pt-5 pb-4 rounded-b-2xl">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-amber-400 font-mono text-[9px] tracking-[5px]">ROUTE 66</div>
            <h1 className="text-white text-xl font-bold mt-1">Leaderboard</h1>
          </div>
          <button onClick={onClose} className="text-gray-400 text-sm">✕ Close</button>
        </div>
      </div>

      <div className="px-4 mt-4">
        {loading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="card p-6 text-center">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-gray-900 font-bold">No scores yet</div>
            <div className="text-gray-500 text-sm mt-1">Complete a trip to post your score!</div>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => {
              const isMe = player?.id === entry.player_id;
              const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
              return (
                <div
                  key={entry.id}
                  className={`card p-3 flex items-center gap-3 ${isMe ? 'ring-2 ring-amber-400' : ''}`}
                >
                  <div className="text-lg font-bold w-8 text-center">{medal}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-900 text-sm font-semibold truncate">
                      {entry.display_name}
                      {isMe && <span className="text-amber-500 text-[10px] ml-1">YOU</span>}
                    </div>
                    <div className="text-gray-400 text-[10px] font-mono">
                      {entry.accuracy_pct}% accuracy · {entry.completion_time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-amber-500 text-lg font-bold">{entry.score.toLocaleString()}</div>
                    <div className="text-gray-400 text-[9px] font-mono">PTS</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
