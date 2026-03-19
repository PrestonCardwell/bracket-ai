"use client";

import { useEffect, useState } from "react";
import { hasSeenWelcome, markWelcomeSeen, AI_LIMITS } from "@/lib/usage";

interface WelcomeModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export default function WelcomeModal({ forceOpen, onClose }: WelcomeModalProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setShow(true);
    }
  }, [forceOpen]);

  useEffect(() => {
    if (!hasSeenWelcome()) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    markWelcomeSeen();
    setShow(false);
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <h2 className="text-xl font-bold text-white mb-1">
          Welcome to Bracket AI
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          Fill out your March Madness bracket with AI-powered analysis and real team stats. <span className="text-emerald-400 font-medium">Completely free.</span>
        </p>

        {/* What you get */}
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mb-4">
          <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">
            What you get
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0">AI</span>
              <span className="text-white text-sm"><span className="font-semibold">{AI_LIMITS.aiPicks}</span> AI-powered picks with full analysis</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-sm shrink-0">✨</span>
              <span className="text-white text-sm"><span className="font-semibold">{AI_LIMITS.aiFills}</span> complete bracket fill where AI picks every game</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 text-sm shrink-0">📊</span>
              <span className="text-white text-sm"><span className="font-semibold">Unlimited</span> head-to-head stat comparisons</span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="mb-5">
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-2">
            How it works
          </p>
          <ul className="space-y-1.5 text-slate-300 text-xs">
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">1.</span>
              Click any team to pick them manually, or let AI help you decide.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">2.</span>
              The <span className="bg-emerald-600 text-white text-[9px] font-bold px-1 rounded mx-0.5">AI</span> button analyzes a matchup and picks a winner for you.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">3.</span>
              The <span className="text-slate-400 font-medium">?</span> button gives you matchup insights without making a pick.
            </li>
            <li className="flex gap-2">
              <span className="text-slate-600 shrink-0">4.</span>
              <span className="font-medium text-emerald-400">AI Fill Bracket</span> has AI analyze and pick every single game for you.
            </li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={dismiss}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg transition-colors text-sm"
        >
          Fill out my bracket
        </button>

        <p className="text-center text-[10px] text-slate-600 mt-3">
          Built by <a href="https://memorialridge.com" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">Memorial Ridge</a>
        </p>
      </div>
    </div>
  );
}
