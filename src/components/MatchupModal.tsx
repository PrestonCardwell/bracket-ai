"use client";

import { useEffect } from "react";
import { Team, TeamStats, PlayerInfo, NotableWin } from "@/lib/types";

interface MatchupModalProps {
  teamA: Team;
  teamB: Team;
  onClose: () => void;
  onAIAction?: (action: "pick" | "insights") => void;
}

// ── Helpers ──

type CompareMode = "higher" | "lower";

interface StatDef {
  label: string;
  key: string;
  mode: CompareMode;
  getValue: (s: TeamStats) => number;
  format?: (v: number, s: TeamStats) => string;
  tooltip?: string;
}

function formatHeight(inches: number): string {
  return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`;
}

function getBarPercent(valA: number, valB: number, mode: CompareMode): number {
  const maxAbs = Math.max(Math.abs(valA), Math.abs(valB), 0.001);
  const rawDiff =
    mode === "higher"
      ? (valA - valB) / maxAbs
      : (valB - valA) / maxAbs;
  // 50 = tied, ±30 max swing
  return Math.max(20, Math.min(80, 50 + rawDiff * 30));
}

// ── Stat Sections ──

const STAT_SECTIONS: { title: string; stats: StatDef[] }[] = [
  {
    title: "Efficiency Ratings",
    stats: [
      {
        label: "Overall Rank",
        key: "kenpomRank",
        mode: "lower",
        getValue: (s) => s.kenpomRank,
        format: (v) => `#${v}`,
        tooltip: "KenPom overall ranking out of 364 D-I teams. Lower is better.",
      },
      {
        label: "Efficiency Margin",
        key: "adjEM",
        mode: "higher",
        getValue: (s) => s.adjEM,
        format: (v) => (v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2)),
        tooltip: "How many more points this team scores than it allows per 100 possessions, adjusted for opponent strength. Higher is better.",
      },
      {
        label: "Offense Rating",
        key: "adjO",
        mode: "higher",
        getValue: (s) => s.adjO,
        format: (v) => v.toFixed(1),
        tooltip: "Points scored per 100 possessions, adjusted for opponent defense quality. Higher means a more efficient offense.",
      },
      {
        label: "Defense Rating",
        key: "adjD",
        mode: "lower",
        getValue: (s) => s.adjD,
        format: (v) => v.toFixed(1),
        tooltip: "Points allowed per 100 possessions, adjusted for opponent offense quality. Lower means they have a better defense.",
      },
      {
        label: "Pace of Play",
        key: "adjT",
        mode: "higher",
        getValue: (s) => s.adjT,
        format: (v) => v.toFixed(1),
        tooltip: "Average number of possessions per 40 minutes. Higher means a faster-paced team.",
      },
    ],
  },
  {
    title: "Scoring",
    stats: [
      { label: "Points/Game", key: "ppg", mode: "higher", getValue: (s) => s.ppg },
      {
        label: "Points Allowed",
        key: "oppPpg",
        mode: "lower",
        getValue: (s) => s.oppPpg,
      },
      {
        label: "Scoring Margin",
        key: "margin",
        mode: "higher",
        getValue: (s) => s.ppg - s.oppPpg,
        format: (v) => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1)),
      },
      {
        label: "Field Goal %",
        key: "fgPct",
        mode: "higher",
        getValue: (s) => s.fgPct,
      },
      {
        label: "3-Point %",
        key: "threePtPct",
        mode: "higher",
        getValue: (s) => s.threePtPct,
      },
      {
        label: "Free Throw %",
        key: "ftPct",
        mode: "higher",
        getValue: (s) => s.ftPct,
      },
    ],
  },
  {
    title: "Ball Control",
    stats: [
      { label: "Assists/Game", key: "apg", mode: "higher", getValue: (s) => s.apg },
      { label: "Turnovers/Game", key: "tpg", mode: "lower", getValue: (s) => s.tpg },
      {
        label: "Assist/TO Ratio",
        key: "atoRatio",
        mode: "higher",
        getValue: (s) => s.atoRatio,
      },
      { label: "Steals/Game", key: "spg", mode: "higher", getValue: (s) => s.spg },
      { label: "Blocks/Game", key: "bpg", mode: "higher", getValue: (s) => s.bpg },
    ],
  },
  {
    title: "Rebounding & Size",
    stats: [
      { label: "Rebounds/Game", key: "rpg", mode: "higher", getValue: (s) => s.rpg },
      {
        label: "Offensive Reb",
        key: "orpg",
        mode: "higher",
        getValue: (s) => s.orpg,
      },
      {
        label: "Defensive Reb",
        key: "drpg",
        mode: "higher",
        getValue: (s) => s.drpg,
      },
      {
        label: "Avg Starter Ht",
        key: "avgHeightInches",
        mode: "higher",
        getValue: (s) => s.avgHeightInches,
        format: (v) => formatHeight(v),
      },
    ],
  },
  {
    title: "Strength of Schedule",
    stats: [
      {
        label: "Schedule Rating",
        key: "sos",
        mode: "higher",
        getValue: (s) => s.sos,
        format: (v) => `${v}/100`,
        tooltip: "How tough their schedule was this season on a scale of 1-100. Higher means they played harder opponents.",
      },
      {
        label: "vs Top 25",
        key: "vsTop25",
        mode: "higher",
        getValue: (s) => {
          const total = s.winsVsTop25 + s.lossesVsTop25;
          return total > 0 ? s.winsVsTop25 / total : 0;
        },
        format: (_v, s) => `${s.winsVsTop25}-${s.lossesVsTop25}`,
      },
      {
        label: "vs Top 50",
        key: "vsTop50",
        mode: "higher",
        getValue: (s) => {
          const total = s.winsVsTop50 + s.lossesVsTop50;
          return total > 0 ? s.winsVsTop50 / total : 0;
        },
        format: (_v, s) => `${s.winsVsTop50}-${s.lossesVsTop50}`,
      },
    ],
  },
];

// ── Stat Row Component ──

function StatRow({
  stat,
  statsA,
  statsB,
}: {
  stat: StatDef;
  statsA: TeamStats;
  statsB: TeamStats;
}) {
  const valA = stat.getValue(statsA);
  const valB = stat.getValue(statsB);
  const fmt = stat.format || ((v: number) => v.toString());

  const aIsBetter =
    stat.mode === "higher" ? valA > valB : valA < valB;
  const bIsBetter =
    stat.mode === "higher" ? valB > valA : valB < valA;

  const barLeft = getBarPercent(valA, valB, stat.mode);

  return (
    <div className="py-2.5 px-1">
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`text-sm font-mono tabular-nums min-w-[60px] text-right ${
            aIsBetter
              ? "text-emerald-400 font-semibold"
              : "text-slate-400"
          }`}
        >
          {fmt(valA, statsA)}
        </span>
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium px-3 text-center flex-shrink-0 relative group">
          {stat.label}
          {stat.tooltip && (
            <>
              <span className="inline-block ml-1 text-slate-600 cursor-help">&#9432;</span>
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-[11px] text-slate-300 normal-case tracking-normal font-normal leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity duration-200 z-50 shadow-xl">
                {stat.tooltip}
              </span>
            </>
          )}
        </span>
        <span
          className={`text-sm font-mono tabular-nums min-w-[60px] text-left ${
            bIsBetter
              ? "text-emerald-400 font-semibold"
              : "text-slate-400"
          }`}
        >
          {fmt(valB, statsB)}
        </span>
      </div>
      <div className="h-1 rounded-full overflow-hidden flex bg-slate-800">
        <div
          className={`transition-all duration-300 ${
            aIsBetter ? "bg-emerald-500/60" : "bg-slate-600/60"
          }`}
          style={{ width: `${barLeft}%` }}
        />
        <div
          className={`transition-all duration-300 ${
            bIsBetter ? "bg-emerald-500/60" : "bg-slate-600/60"
          }`}
          style={{ width: `${100 - barLeft}%` }}
        />
      </div>
    </div>
  );
}

// ── Section Divider ──

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 pt-6 pb-2 first:pt-0">
      <div className="h-px flex-1 bg-emerald-500/20" />
      <h3 className="text-xs uppercase tracking-[0.15em] text-emerald-400/80 font-bold whitespace-nowrap">
        {title}
      </h3>
      <div className="h-px flex-1 bg-emerald-500/20" />
    </div>
  );
}

// ── Edge Count Badge ──

function EdgeSummary({
  teamA,
  teamB,
}: {
  teamA: Team;
  teamB: Team;
}) {
  let aEdges = 0;
  let bEdges = 0;
  let total = 0;

  for (const section of STAT_SECTIONS) {
    for (const stat of section.stats) {
      const valA = stat.getValue(teamA.stats);
      const valB = stat.getValue(teamB.stats);
      if (valA === valB) {
        total++;
        continue;
      }
      const aWins =
        stat.mode === "higher" ? valA > valB : valA < valB;
      if (aWins) aEdges++;
      else bEdges++;
      total++;
    }
  }

  return (
    <div className="flex items-center justify-center gap-6 py-3 px-4 bg-slate-800/40 rounded-lg">
      <div className="text-center">
        <div
          className={`text-lg font-bold ${
            aEdges > bEdges ? "text-emerald-400" : "text-slate-300"
          }`}
        >
          {aEdges}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
          Edges
        </div>
      </div>
      <div className="text-[10px] text-slate-600 uppercase tracking-wide">
        of {total}
      </div>
      <div className="text-center">
        <div
          className={`text-lg font-bold ${
            bEdges > aEdges ? "text-emerald-400" : "text-slate-300"
          }`}
        >
          {bEdges}
        </div>
        <div className="text-[10px] text-slate-500 uppercase tracking-wider">
          Edges
        </div>
      </div>
    </div>
  );
}

// ── Player Comparison Row ──

function PlayerComparison({
  label,
  playerA,
  playerB,
}: {
  label: string;
  playerA: PlayerInfo;
  playerB: PlayerInfo;
}) {
  return (
    <div className="flex items-start py-2.5 px-1">
      <div className="flex-1 text-right pr-3">
        <div className="text-sm font-semibold text-slate-200">{playerA.name}</div>
        <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums space-x-2">
          <span>{playerA.ppg} pts</span>
          <span>{playerA.rpg} reb</span>
          <span>{playerA.apg} ast</span>
        </div>
      </div>
      <div className="text-[10px] text-slate-600 px-1 pt-1 shrink-0">
        {label || "vs"}
      </div>
      <div className="flex-1 text-left pl-3">
        <div className="text-sm font-semibold text-slate-200">{playerB.name}</div>
        <div className="text-xs text-slate-400 mt-0.5 font-mono tabular-nums space-x-2">
          <span>{playerB.ppg} pts</span>
          <span>{playerB.rpg} reb</span>
          <span>{playerB.apg} ast</span>
        </div>
      </div>
    </div>
  );
}

// ── Win Row ──

function WinRow({ win }: { win: NotableWin }) {
  // Shorten opponent name (e.g., "Michigan Wolverines" -> "Michigan")
  const shortName = win.opponent.split(/\s+/).slice(0, -1).join(" ") || win.opponent;
  return (
    <div className="py-1 px-1">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-slate-300 truncate">
          {win.rank > 0 && (
            <span className="text-emerald-400/80 font-semibold mr-1">#{win.rank}</span>
          )}
          {shortName}
        </span>
        <span className="text-xs text-slate-500 font-mono tabular-nums ml-2 shrink-0">
          {win.score}
        </span>
      </div>
    </div>
  );
}

// ── Main Modal ──

export default function MatchupModal({
  teamA,
  teamB,
  onClose,
  onAIAction,
}: MatchupModalProps) {
  // Escape key closes modal
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const streakA =
    teamA.stats.streak > 0
      ? `W${teamA.stats.streak}`
      : teamA.stats.streak < 0
        ? `L${Math.abs(teamA.stats.streak)}`
        : "—";
  const streakB =
    teamB.stats.streak > 0
      ? `W${teamB.stats.streak}`
      : teamB.stats.streak < 0
        ? `L${Math.abs(teamB.stats.streak)}`
        : "—";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 sm:rounded-xl rounded-lg shadow-2xl shadow-black/40 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="px-3 sm:px-6 pt-4 sm:pt-5 pb-3 sm:pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[11px] uppercase tracking-[0.15em] text-slate-500 font-semibold">
              Matchup Comparison
            </h2>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-md hover:bg-slate-800"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Team Cards */}
          <div className="flex items-stretch gap-3">
            {/* Team A */}
            <div className="flex-1 bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700/50">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-700/60 text-white font-bold text-lg mb-2">
                {teamA.seed}
              </div>
              <div className="text-sm font-semibold text-white leading-tight">
                {teamA.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {teamA.record} · {teamA.conference}
              </div>
              <div className="text-[11px] text-emerald-400/80 font-medium mt-1.5">
                KenPom #{teamA.stats.kenpomRank}
              </div>
            </div>

            {/* VS divider */}
            <div className="flex items-center shrink-0">
              <span className="text-slate-600 font-bold text-xs tracking-widest">
                VS
              </span>
            </div>

            {/* Team B */}
            <div className="flex-1 bg-slate-800/50 rounded-lg p-4 text-center border border-slate-700/50">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-700/60 text-white font-bold text-lg mb-2">
                {teamB.seed}
              </div>
              <div className="text-sm font-semibold text-white leading-tight">
                {teamB.name}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {teamB.record} · {teamB.conference}
              </div>
              <div className="text-[11px] text-emerald-400/80 font-medium mt-1.5">
                KenPom #{teamB.stats.kenpomRank}
              </div>
            </div>
          </div>

          {/* Edge summary */}
          <div className="mt-3">
            <EdgeSummary teamA={teamA} teamB={teamB} />
          </div>

          {/* AI actions — mobile only (desktop has hover buttons on the bracket) */}
          {onAIAction && (
            <div className="flex gap-2 mt-3 sm:hidden">
              <button
                onClick={() => { onAIAction("pick"); onClose(); }}
                className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="bg-white/20 text-[9px] font-bold px-1 rounded">AI</span>
                AI Pick
              </button>
              <button
                onClick={() => { onAIAction("insights"); onClose(); }}
                className="flex-1 py-2 bg-violet-600/60 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <span className="text-[10px]">?</span>
                Matchup Insights
              </button>
            </div>
          )}
        </div>

        {/* ── Scrollable Stats ── */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-2 min-h-0">
          {/* ── Key Players (top section) ── */}
          <SectionHeader title="Key Players" />
          <PlayerComparison
            label="Star"
            playerA={teamA.starPlayer}
            playerB={teamB.starPlayer}
          />
          {teamA.notablePlayers.length > 0 && teamB.notablePlayers.length > 0 && (
            <>
              <PlayerComparison
                label=""
                playerA={teamA.notablePlayers[0]}
                playerB={teamB.notablePlayers[0]}
              />
              {teamA.notablePlayers[1] && teamB.notablePlayers[1] && (
                <PlayerComparison
                  label=""
                  playerA={teamA.notablePlayers[1]}
                  playerB={teamB.notablePlayers[1]}
                />
              )}
            </>
          )}

          {/* ── Best Wins ── */}
          {(teamA.bestWins.length > 0 || teamB.bestWins.length > 0) && (
            <>
              <SectionHeader title="Best Wins" />
              <div className="flex gap-3 py-2">
                <div className="flex-1">
                  {teamA.bestWins.slice(0, 4).map((w, i) => (
                    <WinRow key={i} win={w} />
                  ))}
                  {teamA.bestWins.length === 0 && (
                    <div className="text-xs text-slate-600 italic">No ranked wins</div>
                  )}
                </div>
                <div className="w-px bg-slate-700/40 shrink-0" />
                <div className="flex-1">
                  {teamB.bestWins.slice(0, 4).map((w, i) => (
                    <WinRow key={i} win={w} />
                  ))}
                  {teamB.bestWins.length === 0 && (
                    <div className="text-xs text-slate-600 italic">No ranked wins</div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ── Momentum ── */}
          <SectionHeader title="Momentum" />
          <div className="py-2">
            <div className="flex items-center justify-between py-1.5 px-1">
              <span className="text-sm font-mono tabular-nums text-slate-300 min-w-[60px] text-right">
                {teamA.stats.last10}
              </span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium px-3">
                Last 10 Games
              </span>
              <span className="text-sm font-mono tabular-nums text-slate-300 min-w-[60px] text-left">
                {teamB.stats.last10}
              </span>
            </div>
            <div className="flex items-center justify-between py-1.5 px-1">
              <span
                className={`text-sm font-mono tabular-nums min-w-[60px] text-right font-semibold ${
                  teamA.stats.streak > 0
                    ? "text-emerald-400"
                    : teamA.stats.streak < 0
                      ? "text-red-400"
                      : "text-slate-400"
                }`}
              >
                {streakA}
              </span>
              <span className="text-[11px] text-slate-500 uppercase tracking-wider font-medium px-3">
                Current Streak
              </span>
              <span
                className={`text-sm font-mono tabular-nums min-w-[60px] text-left font-semibold ${
                  teamB.stats.streak > 0
                    ? "text-emerald-400"
                    : teamB.stats.streak < 0
                      ? "text-red-400"
                      : "text-slate-400"
                }`}
              >
                {streakB}
              </span>
            </div>
          </div>

          {/* ── Statistical Breakdown ── */}
          {STAT_SECTIONS.map((section) => (
            <div key={section.title}>
              <SectionHeader title={section.title} />
              {section.title === "Efficiency Ratings" && (
                <div className="text-[10px] text-slate-500 text-center py-1 italic">
                  Powered by KenPom analytics
                </div>
              )}
              {section.stats.map((stat) => (
                <StatRow
                  key={stat.key}
                  stat={stat}
                  statsA={teamA.stats}
                  statsB={teamB.stats}
                />
              ))}
            </div>
          ))}

          {/* Bottom padding */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
