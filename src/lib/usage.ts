"use client";

const STORAGE_KEY = "bracket-ai-usage";

interface UsageData {
  aiPicks: number;
  aiFills: number;
  welcomed: boolean;
}

const LIMITS = {
  aiPicks: 63,
  aiFills: 1,
};

function getUsage(): UsageData {
  if (typeof window === "undefined") return { aiPicks: 0, aiFills: 0, welcomed: false };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { aiPicks: 0, aiFills: 0, welcomed: false };
    return JSON.parse(raw);
  } catch {
    return { aiPicks: 0, aiFills: 0, welcomed: false };
  }
}

function saveUsage(data: UsageData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function hasSeenWelcome(): boolean {
  return getUsage().welcomed;
}

export function markWelcomeSeen() {
  const usage = getUsage();
  usage.welcomed = true;
  saveUsage(usage);
}

export function getAIPicksUsed(): number {
  return getUsage().aiPicks;
}

export function getAIFillsUsed(): number {
  return getUsage().aiFills;
}

export function canUseAIPick(): boolean {
  return getUsage().aiPicks < LIMITS.aiPicks;
}

export function canUseAIFill(): boolean {
  return getUsage().aiFills < LIMITS.aiFills;
}

export function recordAIPick() {
  const usage = getUsage();
  usage.aiPicks++;
  saveUsage(usage);
}

export function recordAIFill() {
  const usage = getUsage();
  usage.aiFills++;
  saveUsage(usage);
}

export function getAIPicksRemaining(): number {
  return Math.max(0, LIMITS.aiPicks - getUsage().aiPicks);
}

export function getAIFillsRemaining(): number {
  return Math.max(0, LIMITS.aiFills - getUsage().aiFills);
}

export const AI_LIMITS = LIMITS;
