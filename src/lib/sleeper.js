import { unstable_cache } from "next/cache";
import { getTradeGrades } from "./tradeGrades";
import { getPlayerValues } from "./fantasycalc";

// Server-only data layer for the Sleeper Fantasy Football API (no API key needed).
// To point this at a different league (e.g. once the current season has
// drafted), set the SLEEPER_LEAGUE_ID env var — everything below adapts
// automatically from the league's own settings (scoring, roster slots,
// regular-season length).
const LEAGUE_ID = process.env.SLEEPER_LEAGUE_ID || "1185408325105057792";
const BASE = "https://api.sleeper.app/v1";

const POS_ORDER = ["QB", "RB", "WR", "TE", "FLEX", "DEF", "K"];

async function sleeperFetch(path, revalidate) {
  const res = await fetch(`${BASE}${path}`, { next: { revalidate } });
  if (!res.ok) throw new Error(`Sleeper API ${path} failed: ${res.status}`);
  return res.json();
}

// The full /players/nfl file is ~20MB — over Next's 2MB fetch-cache item
// limit, so a plain cached fetch silently falls back to uncached (and
// re-downloads 20MB on every request). Fetch it once, strip it down to just
// {name, position} per player (~1MB), and cache that instead.
const getSlimPlayers = unstable_cache(
  async () => {
    const res = await fetch(`${BASE}/players/nfl`);
    if (!res.ok) throw new Error(`Sleeper players fetch failed: ${res.status}`);
    const full = await res.json();
    const slim = {};
    for (const [id, p] of Object.entries(full)) {
      slim[id] = {
        name: p.full_name || `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim() || id,
        position: p.position || p.fantasy_positions?.[0] || null,
      };
    }
    return slim;
  },
  ["sleeper-players-nfl"],
  { revalidate: 86400 }
);

function playerName(players, pid) {
  return players[pid]?.name || pid;
}

function playerLabel(players, pid) {
  const pos = players[pid]?.position ?? "?";
  return `${playerName(players, pid)} (${pos})`;
}

function pickLabel(pick) {
  return `${pick.season} Round ${pick.round}`;
}

export async function getLeagueData() {
  const league = await sleeperFetch(`/league/${LEAGUE_ID}`, 3600);
  const [rosters, users, players] = await Promise.all([
    sleeperFetch(`/league/${LEAGUE_ID}/rosters`, 300),
    sleeperFetch(`/league/${LEAGUE_ID}/users`, 3600),
    getSlimPlayers(),
  ]);

  const regularSeasonWeeks = league.settings.last_report || league.settings.playoff_week_start - 1;
  const lastWeekPlayed = Math.max(1, league.settings.leg || 1);

  // Starting slot order (excludes bench/taxi/IR) — drives the "points by slot" breakdown.
  const startSlots = league.roster_positions.filter((p) => !["BN", "TAXI", "IR"].includes(p));
  const slotPositions = [...new Set(startSlots)].sort(
    (a, b) => POS_ORDER.indexOf(a) - POS_ORDER.indexOf(b)
  );
  const rosterPositions = slotPositions.filter((p) => p !== "FLEX");

  const rosterIdToOwner = {};
  for (const r of rosters) {
    const u = users.find((u) => u.user_id === r.owner_id);
    rosterIdToOwner[r.roster_id] = {
      teamName: u?.metadata?.team_name || u?.display_name || `Team ${r.roster_id}`,
      owner: u?.display_name || "Unknown",
    };
  }

  // --- Points by starting slot, summed across the regular season; also
  // collect each roster's weekly score (for luck) and each player's season
  // total (for draft value) along the way — same fetch, three uses. ---
  const ptsByPosByRoster = {};
  const weeklyScoresByRoster = {};
  const seasonPtsByPlayerId = {};
  for (let w = 1; w <= regularSeasonWeeks; w++) {
    const matchups = await sleeperFetch(`/league/${LEAGUE_ID}/matchups/${w}`, 300);
    for (const m of matchups) {
      (weeklyScoresByRoster[m.roster_id] ??= []).push(m.points || 0);
      for (const [pid, pts] of Object.entries(m.players_points || {})) {
        seasonPtsByPlayerId[pid] = (seasonPtsByPlayerId[pid] || 0) + pts;
      }
      if (!m.starters || !m.starters_points) continue;
      const bucket = (ptsByPosByRoster[m.roster_id] ??= {});
      m.starters.forEach((pid, i) => {
        const slot = startSlots[i] || "FLEX";
        bucket[slot] = (bucket[slot] || 0) + (m.starters_points[i] || 0);
      });
    }
  }

  // All-play luck: each week, compare a team's score against every other
  // team (not just their actual opponent) to get a hypothetical win total.
  // Luck = actual wins - expected wins from that all-play record. Positive
  // means the schedule was kind (weaker matchups than their scoring earned);
  // negative means the schedule was tougher than their scoring deserved.
  const luckByRoster = {};
  for (const rosterId in weeklyScoresByRoster) {
    let allPlayWins = 0;
    let allPlayTies = 0;
    let allPlayGames = 0;
    const ownScores = weeklyScoresByRoster[rosterId];
    ownScores.forEach((score, week) => {
      for (const otherId in weeklyScoresByRoster) {
        if (otherId === rosterId) continue;
        const otherScore = weeklyScoresByRoster[otherId][week];
        if (otherScore == null) continue;
        allPlayGames++;
        if (score > otherScore) allPlayWins++;
        else if (score === otherScore) allPlayTies++;
      }
    });
    const allPlayWinPct = allPlayGames ? (allPlayWins + allPlayTies * 0.5) / allPlayGames : 0;
    luckByRoster[rosterId] = allPlayWinPct * ownScores.length;
  }

  const teams = rosters.map((r) => {
    const pf = r.settings.fpts + (r.settings.fpts_decimal || 0) / 100;
    const pa = r.settings.fpts_against + (r.settings.fpts_against_decimal || 0) / 100;
    const optimal = r.settings.ppts + (r.settings.ppts_decimal || 0) / 100;

    const roster = {};
    for (const pos of rosterPositions) roster[pos] = [];
    for (const pid of r.players || []) {
      const pos = players[pid]?.position;
      if (pos && roster[pos]) roster[pos].push({ id: pid, name: playerName(players, pid) });
    }

    const ptsByPos = {};
    for (const pos of slotPositions) ptsByPos[pos] = Number((ptsByPosByRoster[r.roster_id]?.[pos] || 0).toFixed(1));

    const expectedWins = luckByRoster[r.roster_id] ?? 0;
    const luckIndex = Number((r.settings.wins - expectedWins).toFixed(1));

    return {
      id: r.roster_id,
      name: rosterIdToOwner[r.roster_id].teamName,
      owner: rosterIdToOwner[r.roster_id].owner,
      record: [r.settings.wins, r.settings.losses],
      pf: Number(pf.toFixed(1)),
      pa: Number(pa.toFixed(1)),
      benchPtsLeft: Number(Math.max(0, optimal - pf).toFixed(1)),
      luckIndex,
      expectedWins: Number(expectedWins.toFixed(1)),
      roster,
      ptsByPos,
    };
  });

  // --- Trades ---
  const trades = [];
  for (let w = 1; w <= lastWeekPlayed; w++) {
    const txns = await sleeperFetch(`/league/${LEAGUE_ID}/transactions/${w}`, 300);
    const weekTrades = txns.filter((t) => t.type === "trade" && t.status === "complete");
    for (const t of weekTrades) {
      const [rA, rB] = t.roster_ids;
      if (rA == null || rB == null) continue; // skip trades that aren't simple 2-team swaps

      const playersToA = Object.entries(t.adds || {}).filter(([, r]) => r === rA).map(([pid]) => playerLabel(players, pid));
      const playersToB = Object.entries(t.adds || {}).filter(([, r]) => r === rB).map(([pid]) => playerLabel(players, pid));
      const picksToA = (t.draft_picks || []).filter((p) => p.owner_id === rA).map(pickLabel);
      const picksToB = (t.draft_picks || []).filter((p) => p.owner_id === rB).map(pickLabel);
      const faabToA = (t.waiver_budget || []).filter((f) => f.receiver === rA).map((f) => `$${f.amount} FAAB`);
      const faabToB = (t.waiver_budget || []).filter((f) => f.receiver === rB).map((f) => `$${f.amount} FAAB`);
      const { gradeA, gradeB } = getTradeGrades(t.transaction_id);

      trades.push({
        id: t.transaction_id,
        week: w,
        date: new Date(t.created).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        teamA: rA,
        receiveA: [...playersToA, ...picksToA, ...faabToA],
        sendA: [...playersToB, ...picksToB, ...faabToB],
        gradeA,
        teamB: rB,
        receiveB: [...playersToB, ...picksToB, ...faabToB],
        sendB: [...playersToA, ...picksToA, ...faabToA],
        gradeB,
      });
    }
  }
  trades.sort((a, b) => b.week - a.week);

  // --- Draft ---
  // Value = pick number - "finish rank" (players sorted by season points,
  // best first). Positive means drafted later than they performed (a
  // steal); negative means drafted earlier than they performed (a reach).
  let draftPicks = [];
  let draftValueByTeam = [];
  if (league.draft_id) {
    const rawPicks = await sleeperFetch(`/draft/${league.draft_id}/picks`, 3600);
    const finishRank = {};
    [...rawPicks]
      .sort((a, b) => (seasonPtsByPlayerId[b.player_id] || 0) - (seasonPtsByPlayerId[a.player_id] || 0))
      .forEach((p, i) => (finishRank[p.player_id] = i + 1));

    draftPicks = rawPicks
      .map((p) => {
        const seasonPts = Number((seasonPtsByPlayerId[p.player_id] || 0).toFixed(1));
        return {
          pickNo: p.pick_no,
          round: p.round,
          slot: p.draft_slot,
          teamId: p.roster_id,
          teamName: rosterIdToOwner[p.roster_id]?.teamName ?? `Team ${p.roster_id}`,
          owner: rosterIdToOwner[p.roster_id]?.owner ?? "Unknown",
          player: `${p.metadata?.first_name ?? ""} ${p.metadata?.last_name ?? ""}`.trim() || playerName(players, p.player_id),
          pos: p.metadata?.position || players[p.player_id]?.position || "?",
          seasonPts,
          value: p.pick_no - finishRank[p.player_id],
        };
      })
      .sort((a, b) => a.pickNo - b.pickNo);

    const byTeam = {};
    for (const p of draftPicks) (byTeam[p.teamId] ??= []).push(p.value);
    draftValueByTeam = Object.entries(byTeam)
      .map(([teamId, values]) => ({
        name: rosterIdToOwner[teamId]?.teamName ?? `Team ${teamId}`,
        avgValue: Number((values.reduce((s, v) => s + v, 0) / values.length).toFixed(1)),
      }))
      .sort((a, b) => b.avgValue - a.avgValue);
  }

  // --- Real trade values (FantasyCalc), keyed by Sleeper player ID ---
  const numQbs = league.roster_positions.filter((p) => p === "QB").length || 1;
  const playerValues = await getPlayerValues({
    numTeams: league.settings.num_teams,
    numQbs,
    ppr: league.scoring_settings.rec ?? 1,
  });

  return {
    leagueName: league.name,
    season: league.season,
    isComplete: league.status === "complete",
    currentWeek: lastWeekPlayed,
    numTeams: league.settings.num_teams,
    positions: slotPositions,
    rosterPositions,
    teams,
    trades,
    draftPicks,
    draftValueByTeam,
    playerValues,
  };
}
