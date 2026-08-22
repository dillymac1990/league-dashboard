// Server-only client for FantasyCalc's public trade value API (no key needed).
// Docs are informal/community-known; verified directly against the live
// endpoint. Returns market trade values, keyed by Sleeper player ID so they
// match up with roster data with no name-matching guesswork.
const BASE = "https://api.fantasycalc.com/values/current";

function nearestSupportedPpr(rec) {
  // FantasyCalc only supports 0 / 0.5 / 1 — snap whatever the league scores to.
  const options = [0, 0.5, 1];
  return options.reduce((best, o) => (Math.abs(o - rec) < Math.abs(best - rec) ? o : best));
}

export async function getPlayerValues({ numTeams, numQbs, ppr, isDynasty = false }) {
  const params = new URLSearchParams({
    isDynasty: String(isDynasty),
    numQbs: String(numQbs),
    numTeams: String(numTeams),
    ppr: String(nearestSupportedPpr(ppr)),
  });

  const res = await fetch(`${BASE}?${params}`, { next: { revalidate: 21600 } });
  if (!res.ok) return {};

  const data = await res.json();
  const values = {};
  for (const entry of data) {
    const sleeperId = entry.player?.sleeperId;
    if (sleeperId) values[sleeperId] = entry.value;
  }
  return values;
}
