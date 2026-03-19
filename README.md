# Bracket AI

NCAA Tournament bracket builder with AI-powered analysis. Fill your bracket manually, get AI insights on any matchup, or let the simulator fill it for you.

**BYOK** (Bring Your Own Key) — works with OpenAI or Anthropic. No accounts, no database, no tracking. Your bracket and API key stay in your browser.

## Features

- **68-team bracket** with First Four, proper seeding, and all four regions
- **AI Chat** — conversational bracket assistant that knows your picks and all 26 stats per team
- **AI Pick / Insights** — hover any matchup for one-click AI analysis
- **Stat Comparison** — side-by-side modal with visual bars across 5 stat categories
- **Fill Bracket** — Monte Carlo simulation with 3 styles:
  - Chalk (mostly favorites)
  - Balanced (some upsets)
  - Chaos (upsets everywhere)
- **Share** — copy a link or text summary of your bracket
- **26 stats per team** — KenPom advanced metrics, scoring, ball control, rebounding, momentum, star power, strength of record
- **Mobile responsive** — works on phones with touch-friendly controls

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Go to **Settings** to add your OpenAI or Anthropic API key. The key is encrypted with AES-256-GCM before being stored in your browser.

## Tech Stack

- Next.js 16 + TypeScript + React 19
- Tailwind CSS v4
- No component libraries — all custom components
- No database — localStorage for picks, settings, and chat history

## Data

Team data comes from ESPN APIs + hardcoded KenPom rankings, combined by a build script into a generated TypeScript file.

```
scripts/espn-data.json              <- ESPN team stats/roster
scripts/espn-additional.json        <- Top scorers, starting 5 heights, schedule
scripts/build-bracket-data.mjs      <- Combines all sources + KenPom data
    |
src/data/bracket-2026.ts            <- Generated file (do NOT edit directly)
```

To refresh data:

```bash
node scripts/fetch-additional-stats.mjs
node scripts/build-bracket-data.mjs
```

## How It Works

### AI

Users provide their own API key (OpenAI or Anthropic). Requests are proxied through a Next.js API route (`/api/ai`) that sends the key directly to the provider over HTTPS. The key is never logged or stored server-side.

The chat interface sends the user's current bracket state in the system prompt, so the AI can reference their specific picks when giving advice.

### Simulation

The "Fill Bracket" feature uses a Monte Carlo approach:
- **Round 1**: Historical seed upset rates from 1985-2025 (e.g., 12-seeds beat 5-seeds ~35% of the time)
- **Round 2+**: KenPom AdjEM differential converted to win probability via logistic function
- **Styles** shift the probability toward 50/50 by varying amounts to create more or fewer upsets

### Sharing

Picks are encoded into a base64 URL parameter. Anyone with the link loads the bracket with those picks pre-filled. No server required.

## Project Structure

```
src/
  app/
    page.tsx              <- Main bracket page
    settings/page.tsx     <- API key + provider settings
    api/ai/route.ts       <- AI proxy (OpenAI + Anthropic)
  components/
    Bracket.tsx            <- Tab manager (regions + Final Four)
    Region.tsx             <- Recursive bracket tree with connectors
    FinalFour.tsx          <- Final Four + Championship layout
    Matchup.tsx            <- Single game with hover actions
    TeamSlot.tsx           <- Team button (seed, name, record)
    ChatPanel.tsx          <- Conversational AI chat panel
    MatchupModal.tsx       <- Full stat comparison modal
  hooks/
    useBracket.ts          <- Pick state + localStorage persistence
    useChat.ts             <- Chat messages + AI request logic
  lib/
    types.ts               <- TypeScript types
    bracket.ts             <- Bracket logic (picks, game IDs, teams)
    prompts.ts             <- AI system prompt + per-game prompts
    simulate.ts            <- Monte Carlo bracket simulation
    seed-history.ts        <- Historical upset rates + win probability
    share.ts               <- URL encoding/decoding for bracket sharing
    crypto.ts              <- AES-256-GCM encryption for API keys
  data/
    bracket-2026.ts        <- Generated team data (68 teams, 26 stats each)
```

## License

MIT
