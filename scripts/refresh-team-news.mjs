#!/usr/bin/env node
/**
 * Refreshes team-news.json with the latest injury/lineup news for all tournament teams.
 *
 * Uses the OpenAI search model (gpt-4o-mini-search-preview) to find current news.
 * Processes teams in batches of 5 to avoid rate limits.
 *
 * Usage:
 *   OPENAI_API_KEY=sk-xxx node scripts/refresh-team-news.mjs
 *
 * Or set the env var in your shell/profile and just run:
 *   node scripts/refresh-team-news.mjs
 */

import { readFileSync, writeFileSync } from "fs";

const API_KEY = process.env.OPENAI_API_KEY;
if (!API_KEY) {
  console.error("Error: OPENAI_API_KEY environment variable is required.");
  console.error("Usage: OPENAI_API_KEY=sk-xxx node scripts/refresh-team-news.mjs");
  process.exit(1);
}

// Load existing news to preserve structure
const existingNews = JSON.parse(readFileSync("scripts/team-news.json", "utf-8"));
const teamKeys = Object.keys(existingNews).filter((k) => k !== "_meta");

// Map slugs to display names for better search queries
const DISPLAY_NAMES = {
  "duke": "Duke Blue Devils",
  "siena": "Siena Saints",
  "ohio-st": "Ohio State Buckeyes",
  "tcu": "TCU Horned Frogs",
  "st-johns": "St. John's Red Storm",
  "n-iowa": "Northern Iowa Panthers",
  "kansas": "Kansas Jayhawks",
  "cal-baptist": "Cal Baptist Lancers",
  "louisville": "Louisville Cardinals",
  "s-florida": "South Florida Bulls",
  "mich-st": "Michigan State Spartans",
  "ndsu": "North Dakota State Bison",
  "ucla": "UCLA Bruins",
  "ucf": "UCF Knights",
  "uconn": "UConn Huskies",
  "furman": "Furman Paladins",
  "arizona": "Arizona Wildcats",
  "liu": "LIU Sharks",
  "villanova": "Villanova Wildcats",
  "utah-st": "Utah State Aggies",
  "wisconsin": "Wisconsin Badgers",
  "high-point": "High Point Panthers",
  "arkansas": "Arkansas Razorbacks",
  "hawaii": "Hawaii Rainbow Warriors",
  "nc-state": "NC State Wolfpack",
  "kennesaw-st": "Kennesaw State Owls",
  "miami-fl": "Miami Hurricanes",
  "missouri": "Missouri Tigers",
  "purdue": "Purdue Boilermakers",
  "queens": "Queens University Royals",
  "florida": "Florida Gators",
  "lehigh": "Lehigh Mountain Hawks",
  "clemson": "Clemson Tigers",
  "iowa": "Iowa Hawkeyes",
  "vanderbilt": "Vanderbilt Commodores",
  "mcneese": "McNeese Cowboys",
  "nebraska": "Nebraska Cornhuskers",
  "troy": "Troy Trojans",
  "vcu": "VCU Rams",
  "illinois": "Illinois Fighting Illini",
  "penn": "Penn Quakers",
  "st-marys": "Saint Mary's Gaels",
  "texas-am": "Texas A&M Aggies",
  "houston": "Houston Cougars",
  "idaho": "Idaho Vandals",
  "michigan": "Michigan Wolverines",
  "howard": "Howard Bison",
  "georgia": "Georgia Bulldogs",
  "saint-louis": "Saint Louis Billikens",
  "akron": "Akron Zips",
  "hofstra": "Hofstra Pride",
  "tennessee": "Tennessee Volunteers",
  "miami-oh": "Miami (OH) RedHawks",
  "virginia": "Virginia Cavaliers",
  "wright-st": "Wright State Raiders",
  "alabama": "Alabama Crimson Tide",
  "unc": "North Carolina Tar Heels",
  "byu": "BYU Cougars",
  "texas-tech": "Texas Tech Red Raiders",
  "gonzaga": "Gonzaga Bulldogs",
  "kentucky": "Kentucky Wildcats",
  "santa-clara": "Santa Clara Broncos",
  "iowa-st": "Iowa State Cyclones",
  "tenn-st": "Tennessee State Tigers",
  "texas": "Texas Longhorns",
  "prairie-view": "Prairie View A&M Panthers",
  "umbc": "UMBC Retrievers",
  "smu": "SMU Mustangs",
};

async function searchTeamNews(teamSlug) {
  const displayName = DISPLAY_NAMES[teamSlug] || teamSlug;
  const shortName = displayName.split(" ")[0]; // First word for brevity

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-search-preview",
        web_search_options: { search_context_size: "low" },
        max_completion_tokens: 300,
        messages: [
          {
            role: "system",
            content:
              "You are a sports news researcher. Report ONLY confirmed injury, suspension, eligibility, or returning player news for the requested team heading into the 2026 NCAA Tournament. Include the player name, their stats (PPG at minimum), and the nature/timeline of the issue. If there is no relevant news, respond with exactly: NONE",
          },
          {
            role: "user",
            content: `${displayName} basketball NCAA tournament 2026 injury suspension lineup news. Is any key player injured, suspended, or returning from injury?`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`  [${teamSlug}] API error: ${err.slice(0, 200)}`);
      return null; // Keep existing value
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";

    if (!content || content === "NONE" || content.toLowerCase().includes("no relevant") || content.toLowerCase().includes("no significant")) {
      return ""; // No news
    }

    // Strip any URLs or citation markers from the response
    const cleaned = content
      .replace(/\[?\(?(https?:\/\/[^\s)\]]+)\)?\]?/g, "")
      .replace(/\(\[?[a-zA-Z0-9.-]+\.(com|org|net|edu)[^\)]*\)?\]?/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    return cleaned;
  } catch (err) {
    console.error(`  [${teamSlug}] Fetch error: ${err.message}`);
    return null; // Keep existing value
  }
}

async function processBatch(batch) {
  return Promise.all(
    batch.map(async (slug) => {
      const result = await searchTeamNews(slug);
      return { slug, result };
    })
  );
}

async function main() {
  console.log(`Refreshing news for ${teamKeys.length} teams...`);
  console.log("Using OpenAI search model (gpt-4o-mini-search-preview)\n");

  const updatedNews = { ...existingNews };
  const BATCH_SIZE = 5;
  let updated = 0;
  let unchanged = 0;
  let errors = 0;

  for (let i = 0; i < teamKeys.length; i += BATCH_SIZE) {
    const batch = teamKeys.slice(i, i + BATCH_SIZE);
    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.join(", ")}`);

    const results = await processBatch(batch);

    for (const { slug, result } of results) {
      if (result === null) {
        // Error occurred, keep existing value
        errors++;
        console.log(`  ${slug}: [kept existing - error]`);
      } else if (result !== existingNews[slug]) {
        updatedNews[slug] = result;
        updated++;
        const preview = result ? result.slice(0, 80) + (result.length > 80 ? "..." : "") : "(cleared)";
        console.log(`  ${slug}: ${preview}`);
      } else {
        unchanged++;
        console.log(`  ${slug}: [unchanged]`);
      }
    }

    // Small delay between batches to be respectful of rate limits
    if (i + BATCH_SIZE < teamKeys.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Update metadata
  updatedNews._meta = {
    lastUpdated: new Date().toISOString(),
    source: "Aggregated via OpenAI search from ESPN, Yahoo Sports, SI, NBC Sports, RotoWire, Covers.com",
  };

  writeFileSync("scripts/team-news.json", JSON.stringify(updatedNews, null, 2) + "\n");

  console.log(`\nDone! Updated: ${updated}, Unchanged: ${unchanged}, Errors: ${errors}`);
  console.log("Run 'node scripts/build-bracket-data.mjs' to rebuild the bracket data with updated news.");
}

main();
