"use client";

import { useCallback, useState, useRef, useEffect } from "react";
import { bracketData } from "@/data/bracket-2026";
import { useBracket } from "@/hooks/useBracket";
import { useChat } from "@/hooks/useChat";
import { getTopTeam, getBottomTeam, getAllTeams } from "@/lib/bracket";
import { getRoundName } from "@/lib/bracket";
import { Team, RegionName } from "@/lib/types";
import { BracketStyle } from "@/lib/simulate";
import { decodePicks, getShareUrl, generateBracketText } from "@/lib/share";
import { buildPickPrompt, buildInsightsPrompt } from "@/lib/prompts";
import { useAIFill } from "@/hooks/useAIFill";
import Bracket from "@/components/Bracket";
import ChatPanel from "@/components/ChatPanel";
import MatchupModal from "@/components/MatchupModal";
import WelcomeModal from "@/components/WelcomeModal";
import {
  canUseAIPick,
  canUseAIFill,
  recordAIPick,
  recordAIFill,
  getAIPicksRemaining,
  getAIFillsRemaining,
  AI_LIMITS,
} from "@/lib/usage";

const ALT_STYLES: { id: BracketStyle; label: string; desc: string }[] = [
  { id: "chalk", label: "Chalk", desc: "Mostly favorites. Safe picks." },
  { id: "madness", label: "Madness", desc: "More upsets. Embrace the chaos." },
];

export default function Home() {
  const { picks, handlePick, resetBracket, fillBracket } = useBracket();
  const chat = useChat(bracketData, picks);
  const [compareTeams, setCompareTeams] = useState<{
    teamA: Team;
    teamB: Team;
    gameId?: string;
  } | null>(null);
  const [showFillMenu, setShowFillMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareCopied, setShareCopied] = useState<string | null>(null);
  const fillMenuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Load shared bracket from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get("b");
    if (encoded) {
      const shared = decodePicks(encoded);
      if (shared && Object.keys(shared).length > 0) {
        fillBracket(shared);
        // Clean the URL without reloading
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [fillBracket]);

  // Close dropdown menus on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        fillMenuRef.current &&
        !fillMenuRef.current.contains(e.target as Node)
      ) {
        setShowFillMenu(false);
      }
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(e.target as Node)
      ) {
        setShowShareMenu(false);
      }
    }
    if (showFillMenu || showShareMenu) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [showFillMenu, showShareMenu]);

  const aiFill = useAIFill(bracketData);

  const handleFill = useCallback(
    (style: BracketStyle) => {
      setShowFillMenu(false);
      if (!canUseAIFill()) {
        alert("You've used your AI Fill for this visit. You can still use individual AI picks for specific matchups.");
        return;
      }
      recordAIFill();
      // Reset bracket first so picks fill in progressively
      resetBracket();
      aiFill.fill(style, (gameId, teamId) => {
        handlePick(gameId, teamId);
      });
    },
    [aiFill, resetBracket, handlePick]
  );

  const handleAIAction = useCallback(
    (gameId: string, action: "pick" | "insights") => {
      if (!canUseAIPick()) {
        alert(`You've used all ${AI_LIMITS.aiPicks} AI picks for this visit.`);
        return;
      }
      // Usage is recorded inside useChat.sendMessage to avoid double-counting
      let topTeam: Team | null = null;
      let bottomTeam: Team | null = null;
      let round = 1;

      if (gameId.startsWith("first4-")) {
        round = 0;
        const ff = bracketData.firstFour.find((g) => g.id === gameId);
        if (ff) {
          topTeam = ff.teamA;
          bottomTeam = ff.teamB;
        }
      } else if (gameId === "final" || gameId.startsWith("ff-")) {
        const allTeams = getAllTeams(bracketData);
        if (gameId === "final") {
          round = 6;
          const ff1Winner = picks["ff-g0"];
          const ff2Winner = picks["ff-g1"];
          topTeam = ff1Winner
            ? allTeams.find((t) => t.id === ff1Winner) || null
            : null;
          bottomTeam = ff2Winner
            ? allTeams.find((t) => t.id === ff2Winner) || null
            : null;
        } else {
          round = 5;
          const idx = parseInt(gameId.split("-g")[1]);
          const [r1, r2] = bracketData.finalFourMatchups[idx];
          const r1Winner = picks[`${r1}-r4-g0`];
          const r2Winner = picks[`${r2}-r4-g0`];
          topTeam = r1Winner
            ? allTeams.find((t) => t.id === r1Winner) || null
            : null;
          bottomTeam = r2Winner
            ? allTeams.find((t) => t.id === r2Winner) || null
            : null;
        }
      } else {
        const parts = gameId.split("-");
        const regionName = parts[0] as RegionName;
        round = parseInt(parts[1].slice(1));
        const gameIndex = parseInt(parts[2].slice(1));
        const region = bracketData.regions[regionName];
        topTeam = getTopTeam(
          region,
          round,
          gameIndex,
          picks,
          bracketData.firstFour
        );
        bottomTeam = getBottomTeam(
          region,
          round,
          gameIndex,
          picks,
          bracketData.firstFour
        );
      }

      if (!topTeam || !bottomTeam) {
        alert("Both teams need to be determined before AI can analyze this matchup. Fill out the earlier rounds first.");
        return;
      }

      // Build data-rich prompt with full team stats, simulation context, and news
      const roundLabel = getRoundName(round);
      const fullPrompt =
        action === "pick"
          ? buildPickPrompt(topTeam, bottomTeam, round)
          : buildInsightsPrompt(topTeam, bottomTeam, round);
      // Clean message shown in the chat UI
      const displayMsg =
        action === "pick"
          ? `Who should I pick in the ${roundLabel} matchup: ${topTeam.name} (${topTeam.seed}) vs ${bottomTeam.name} (${bottomTeam.seed})?`
          : `Give me insights on the ${roundLabel} matchup: ${topTeam.name} (${topTeam.seed}) vs ${bottomTeam.name} (${bottomTeam.seed}).`;

      chat.open();
      chat.sendMessage(fullPrompt, action === "pick" ? gameId : undefined, displayMsg);
    },
    [picks, chat]
  );

  // Auto-apply AI pick to bracket when a pick result comes back
  useEffect(() => {
    if (!chat.lastPickResult) return;
    const { gameId, teamName } = chat.lastPickResult;
    const allTeams = getAllTeams(bracketData);
    // Normalize: lowercase, strip punctuation
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
    const normalizedPick = norm(teamName);
    const team = allTeams.find((t) => {
      const n = norm(t.name);
      const s = norm(t.shortName);
      return (
        n === normalizedPick ||
        s === normalizedPick ||
        n.includes(normalizedPick) ||
        normalizedPick.includes(n) ||
        normalizedPick.includes(s)
      );
    });
    if (team) {
      handlePick(gameId, team.id);
    }
    chat.clearPickResult();
  }, [chat.lastPickResult, handlePick, chat]);

  const handleCompare = useCallback((teamA: Team, teamB: Team) => {
    setCompareTeams({ teamA, teamB });
  }, []);

  const handleCopyLink = useCallback(() => {
    const url = getShareUrl(picks);
    navigator.clipboard.writeText(url);
    setShareCopied("link");
    setTimeout(() => setShareCopied(null), 2000);
    setShowShareMenu(false);
  }, [picks]);

  const handleCopyText = useCallback(() => {
    const text = generateBracketText(bracketData, picks);
    navigator.clipboard.writeText(text);
    setShareCopied("text");
    setTimeout(() => setShareCopied(null), 2000);
    setShowShareMenu(false);
  }, [picks]);

  return (
    <div className="min-h-screen p-4 md:p-6">
      <WelcomeModal forceOpen={showHelp} onClose={() => setShowHelp(false)} />
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Bracket AI
            <span className="text-emerald-500 ml-1 text-lg font-normal">
              2026
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-0.5 hidden sm:block">
            NCAA Tournament Bracket Builder with AI
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Fill Bracket: primary AI button + dropdown for alt styles */}
          <div className="relative flex" ref={fillMenuRef}>
            <button
              onClick={() => handleFill("balanced")}
              disabled={aiFill.filling}
              className={`px-3 py-1.5 text-sm text-white rounded-l transition-colors flex items-center gap-1.5 ${aiFill.filling ? "bg-emerald-800 cursor-not-allowed opacity-60" : "bg-emerald-600 hover:bg-emerald-500"}`}
              title="Fill entire bracket using AI analysis and historical seed data"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
                <path d="M20 3v4" /><path d="M22 5h-4" />
              </svg>
              <span className="sm:hidden">AI Fill</span>
              <span className="hidden sm:inline">AI Fill Bracket</span>
            </button>
            <button
              onClick={() => setShowFillMenu((v) => !v)}
              className="px-1.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-r border-l border-emerald-500/30 transition-colors"
              title="Choose a different fill style"
            >
              <svg
                width="10"
                height="6"
                viewBox="0 0 10 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M1 1l4 4 4-4" />
              </svg>
            </button>
            {showFillMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="px-3 py-2 border-b border-slate-700">
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
                    Alternative Styles
                  </div>
                </div>
                {ALT_STYLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleFill(s.id)}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-700/60 transition-colors"
                  >
                    <div className="text-sm font-medium text-white">
                      {s.label}
                    </div>
                    <div className="text-xs text-slate-400">{s.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => chat.open()}
            className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-500 text-white rounded transition-colors flex items-center gap-1.5"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            Chat
          </button>
          {/* Share dropdown */}
          <div className="relative" ref={shareMenuRef}>
            <button
              onClick={() => setShowShareMenu((v) => !v)}
              className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded transition-colors flex items-center gap-1.5"
            >
              {shareCopied ? (
                "Copied!"
              ) : (
                <>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                  <span className="hidden sm:inline">Share</span>
                </>
              )}
            </button>
            {showShareMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <button
                  onClick={handleCopyLink}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-700/60 transition-colors"
                >
                  <div className="text-sm font-medium text-white">
                    Copy Link
                  </div>
                  <div className="text-xs text-slate-400">
                    Shareable URL with your picks
                  </div>
                </button>
                <button
                  onClick={handleCopyText}
                  className="w-full text-left px-3 py-2.5 hover:bg-slate-700/60 transition-colors"
                >
                  <div className="text-sm font-medium text-white">
                    Copy as Text
                  </div>
                  <div className="text-xs text-slate-400">
                    Bracket summary for pasting
                  </div>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={resetBracket}
            className="px-3 py-1.5 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded transition-colors"
          >
            Reset
          </button>
          <button
            onClick={() => setShowHelp(true)}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-white border border-slate-700 hover:border-slate-500 rounded-full transition-colors text-xs font-bold"
            title="How this works"
          >
            ?
          </button>
        </div>
      </header>

      {/* Bracket */}
      <Bracket
        data={bracketData}
        picks={picks}
        onPick={handlePick}
        onAIAction={handleAIAction}
        onCompare={handleCompare}
        aiPicksRemaining={getAIPicksRemaining()}
      />

      {/* Chat Panel */}
      <ChatPanel
        isOpen={chat.isOpen}
        messages={chat.messages}
        loading={chat.loading}
        error={chat.error}
        onSend={chat.sendMessage}
        onClear={chat.clearChat}
        onClose={chat.close}
      />

      {/* Matchup Comparison Modal */}
      {compareTeams && (
        <MatchupModal
          teamA={compareTeams.teamA}
          teamB={compareTeams.teamB}
          onClose={() => setCompareTeams(null)}
          onAIAction={(action) => {
            // Find the gameId for this matchup and trigger AI
            const teamA = compareTeams.teamA;
            const teamB = compareTeams.teamB;
            // Search all possible gameIds to find the one with these two teams
            const regionNames: RegionName[] = ["east", "west", "south", "midwest"];
            for (const rn of regionNames) {
              const region = bracketData.regions[rn];
              for (let round = 1; round <= 4; round++) {
                const gamesPerRegion = 8 / Math.pow(2, round - 1);
                for (let g = 0; g < gamesPerRegion; g++) {
                  const gid = `${rn}-r${round}-g${g}`;
                  const top = getTopTeam(region, round, g, picks, bracketData.firstFour);
                  const bot = getBottomTeam(region, round, g, picks, bracketData.firstFour);
                  if ((top?.id === teamA.id && bot?.id === teamB.id) ||
                      (top?.id === teamB.id && bot?.id === teamA.id)) {
                    handleAIAction(gid, action);
                    return;
                  }
                }
              }
            }
          }}
        />
      )}

      {/* AI Fill Progress Overlay */}
      {aiFill.filling && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-8 text-center max-w-sm w-full mx-4">
            <div className="mb-4">
              <svg className="animate-spin mx-auto text-emerald-400" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">
              AI is analyzing...
            </h3>
            {aiFill.progress ? (
              <>
                <p className="text-emerald-400 font-medium text-sm mb-1">
                  {aiFill.progress.phase}
                </p>
                {aiFill.progress.currentMatchup && (
                  <p className="text-white text-sm font-medium mb-3">
                    {aiFill.progress.currentMatchup}
                  </p>
                )}
                <div className="w-full bg-slate-800 rounded-full h-2 mb-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${aiFill.progress.total > 0 ? (aiFill.progress.completed / aiFill.progress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {aiFill.progress.completed} of {aiFill.progress.total} games
                </p>
              </>
            ) : (
              <p className="text-slate-400 text-sm mb-3">
                Preparing matchup data...
              </p>
            )}
            <button
              onClick={aiFill.cancel}
              className="mt-4 px-4 py-1.5 text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
