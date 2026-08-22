"use client";

import { useMemo, useState } from "react";
import { Scale, X, RotateCcw } from "lucide-react";

// ---------------------------------------------------------------------------
// MOCK PPR TRADE VALUES — swap for a real dynasty/redraft value chart later.
// Scale is roughly 0-99, mirroring how most fantasy trade calculators
// present value (think "trade value chart" tiers, not raw projected points).
// Matched against real roster players by last name (see valueForName below),
// since Sleeper gives full names ("Justin Jefferson") rather than the
// abbreviated first-initial style used here.
// ---------------------------------------------------------------------------
const PLAYER_VALUES = [
  { name: "J. Jefferson", pos: "WR", value: 98 },
  { name: "J. Gibbs", pos: "RB", value: 96 },
  { name: "C. Lamb", pos: "WR", value: 95 },
  { name: "L. Jackson", pos: "QB", value: 94 },
  { name: "A. St. Brown", pos: "WR", value: 93 },
  { name: "J. Allen", pos: "QB", value: 93 },
  { name: "B. Robinson", pos: "RB", value: 92 },
  { name: "C. McCaffrey", pos: "RB", value: 91 },
  { name: "D. Achane", pos: "RB", value: 90 },
  { name: "S. LaPorta", pos: "TE", value: 90 },
  { name: "S. Barkley", pos: "RB", value: 88 },
  { name: "J. Hurts", pos: "QB", value: 88 },
  { name: "D. Henry", pos: "RB", value: 85 },
  { name: "P. Mahomes", pos: "QB", value: 85 },
  { name: "J. Waddle", pos: "WR", value: 84 },
  { name: "M. Nabers", pos: "WR", value: 83 },
  { name: "K. Walker", pos: "RB", value: 82 },
  { name: "B. Bowers", pos: "TE", value: 82 },
  { name: "A. Brown", pos: "WR", value: 81 },
  { name: "J. Taylor", pos: "RB", value: 80 },
  { name: "N. Collins", pos: "WR", value: 79 },
  { name: "J. Daniels", pos: "QB", value: 79 },
  { name: "D. London", pos: "WR", value: 78 },
  { name: "T. Etienne", pos: "RB", value: 78 },
  { name: "T. Higgins", pos: "WR", value: 77 },
  { name: "T. McBride", pos: "TE", value: 76 },
  { name: "D. Metcalf", pos: "WR", value: 76 },
  { name: "T. McLaurin", pos: "WR", value: 76 },
  { name: "J. Smith-Njigba", pos: "WR", value: 74 },
  { name: "T. Hunter", pos: "WR", value: 73 },
  { name: "A. Jeanty", pos: "RB", value: 72 },
  { name: "G. Pickens", pos: "WR", value: 71 },
  { name: "B. Purdy", pos: "QB", value: 70 },
  { name: "R. Rice", pos: "WR", value: 69 },
  { name: "J. Jacobs", pos: "RB", value: 68 },
  { name: "C. Williams", pos: "QB", value: 68 },
  { name: "Z. Flowers", pos: "WR", value: 66 },
  { name: "D. Prescott", pos: "QB", value: 66 },
  { name: "J. Cook", pos: "RB", value: 65 },
  { name: "D. Kincaid", pos: "TE", value: 64 },
  { name: "D. Smith", pos: "WR", value: 63 },
  { name: "M. Andrews", pos: "TE", value: 62 },
  { name: "D. Montgomery", pos: "RB", value: 62 },
  { name: "J. Love", pos: "QB", value: 61 },
  { name: "G. Wilson", pos: "WR", value: 61 },
  { name: "T. Lawrence", pos: "QB", value: 60 },
  { name: "T. Kraft", pos: "TE", value: 60 },
  { name: "R. Stevenson", pos: "RB", value: 60 },
  { name: "S. Diggs", pos: "WR", value: 59 },
  { name: "K. Williams", pos: "RB", value: 58 },
  { name: "K. Pitts", pos: "TE", value: 58 },
  { name: "C. Sutton", pos: "WR", value: 57 },
  { name: "X. Worthy", pos: "WR", value: 56 },
  { name: "K. Shakir", pos: "WR", value: 55 },
  { name: "Q. Judkins", pos: "RB", value: 54 },
  { name: "R. Odunze", pos: "WR", value: 53 },
  { name: "B. Irving", pos: "RB", value: 52 },
  { name: "J. Downs", pos: "WR", value: 51 },
  { name: "T. Henderson", pos: "RB", value: 50 },
  { name: "A. Kamara", pos: "RB", value: 49 },
  { name: "M. Pittman", pos: "WR", value: 48 },
  { name: "J. Warren", pos: "RB", value: 48 },
  { name: "R. Harvey", pos: "RB", value: 47 },
  { name: "Z. Charbonnet", pos: "RB", value: 46 },
  { name: "D. Samuel", pos: "WR", value: 46 },
  { name: "D. Doubs", pos: "WR", value: 45 },
  { name: "O. Hampton", pos: "RB", value: 45 },
  { name: "L. Burden", pos: "WR", value: 44 },
  { name: "T. Pollard", pos: "RB", value: 44 },
  { name: "C. Skattebo", pos: "RB", value: 43 },
  { name: "J. Ferguson", pos: "TE", value: 43 },
  { name: "A. Jones", pos: "RB", value: 42 },
  { name: "R. White", pos: "RB", value: 41 },
  { name: "I. Likely", pos: "TE", value: 41 },
  { name: "J. Meyers", pos: "WR", value: 40 },
  { name: "T. Tracy", pos: "RB", value: 40 },
  { name: "T. Spears", pos: "RB", value: 39 },
  { name: "R. Shaheed", pos: "WR", value: 39 },
  { name: "J. Croskey-Merritt", pos: "RB", value: 38 },
  { name: "C. Watson", pos: "WR", value: 37 },
  { name: "K. Concepcion", pos: "WR", value: 37 },
  { name: "K. Monangai", pos: "RB", value: 36 },
  { name: "J. Mason", pos: "RB", value: 35 },
  // Defenses (matched by full team name, as Sleeper returns them)
  { name: "Buffalo Bills", pos: "DEF", value: 42 },
  { name: "Denver Broncos", pos: "DEF", value: 41 },
  { name: "Philadelphia Eagles", pos: "DEF", value: 40 },
  { name: "Pittsburgh Steelers", pos: "DEF", value: 39 },
  { name: "Houston Texans", pos: "DEF", value: 38 },
  { name: "Baltimore Ravens", pos: "DEF", value: 37 },
  { name: "Minnesota Vikings", pos: "DEF", value: 37 },
  { name: "Kansas City Chiefs", pos: "DEF", value: 36 },
  { name: "Green Bay Packers", pos: "DEF", value: 36 },
  { name: "Detroit Lions", pos: "DEF", value: 35 },
  { name: "Los Angeles Chargers", pos: "DEF", value: 35 },
  { name: "San Francisco 49ers", pos: "DEF", value: 34 },
  { name: "New York Jets", pos: "DEF", value: 34 },
  { name: "Seattle Seahawks", pos: "DEF", value: 33 },
  { name: "Los Angeles Rams", pos: "DEF", value: 33 },
  { name: "Cleveland Browns", pos: "DEF", value: 32 },
  { name: "Tampa Bay Buccaneers", pos: "DEF", value: 32 },
  { name: "Dallas Cowboys", pos: "DEF", value: 31 },
  { name: "Arizona Cardinals", pos: "DEF", value: 31 },
  { name: "Miami Dolphins", pos: "DEF", value: 30 },
  { name: "Indianapolis Colts", pos: "DEF", value: 30 },
  { name: "Chicago Bears", pos: "DEF", value: 29 },
  { name: "Cincinnati Bengals", pos: "DEF", value: 29 },
  { name: "Atlanta Falcons", pos: "DEF", value: 28 },
  { name: "Washington Commanders", pos: "DEF", value: 28 },
  { name: "New England Patriots", pos: "DEF", value: 28 },
  { name: "Las Vegas Raiders", pos: "DEF", value: 27 },
  { name: "New Orleans Saints", pos: "DEF", value: 27 },
  { name: "Jacksonville Jaguars", pos: "DEF", value: 26 },
  { name: "Carolina Panthers", pos: "DEF", value: 26 },
  { name: "New York Giants", pos: "DEF", value: 25 },
  { name: "Tennessee Titans", pos: "DEF", value: 25 },
].sort((a, b) => b.value - a.value);

function lastNameKey(fullName) {
  const parts = fullName.replace(/[.']/g, "").trim().split(/\s+/);
  return parts[parts.length - 1].toLowerCase();
}

const VALUE_BY_NAME = new Map(PLAYER_VALUES.map((p) => [p.name, p.value]));
// Keyed by "lastname|pos" — last name alone collides too easily (e.g. Derrick
// Henry, RB vs. Hunter Henry, TE both being "henry") and would silently hand
// a roster player the wrong player's value.
const VALUE_BY_LASTNAME_POS = new Map();
for (const p of PLAYER_VALUES) {
  const key = `${lastNameKey(p.name)}|${p.pos}`;
  if (!VALUE_BY_LASTNAME_POS.has(key)) VALUE_BY_LASTNAME_POS.set(key, p.value);
}

// Full roster names ("Justin Jefferson") don't match the abbreviated chart
// ("J. Jefferson") exactly, so fall back to a last-name+position match (never
// last name alone — that can match a different player at another position).
// Returns null (shown as "unranked") if the player isn't in the mock chart.
function valueForName(name, pos) {
  if (VALUE_BY_NAME.has(name)) return VALUE_BY_NAME.get(name);
  return VALUE_BY_LASTNAME_POS.get(`${lastNameKey(name)}|${pos}`) ?? null;
}

function rosterToPlayerList(team) {
  if (!team) return [];
  return Object.entries(team.roster)
    .flatMap(([pos, names]) => names.map((name) => ({ name, pos, value: valueForName(name, pos) })))
    .sort((a, b) => (b.value ?? -1) - (a.value ?? -1));
}

function verdictFor(totalA, totalB) {
  if (totalA === 0 && totalB === 0) {
    return { label: "Add players to both sides to analyze", style: "bg-slate-700/30 text-slate-400 border-slate-600" };
  }
  const diff = totalA - totalB;
  const bigger = Math.max(totalA, totalB) || 1;
  const diffPct = (Math.abs(diff) / bigger) * 100;

  if (diffPct <= 5) {
    return { label: "Fair Trade", style: "bg-emerald-400/15 text-emerald-300 border-emerald-400/50" };
  }
  const winner = diff > 0 ? "Side A" : "Side B";
  if (diffPct <= 15) {
    return { label: `Slight Edge: ${winner}`, style: "bg-amber-400/15 text-amber-300 border-amber-400/50" };
  }
  return { label: `Lopsided — ${winner} Wins Big`, style: "bg-rose-400/15 text-rose-300 border-rose-400/50" };
}

function TradeSide({ label, teams, teamId, onTeamChange, players, onAdd, onRemove, options }) {
  const total = players.reduce((s, p) => s + (p.value ?? 0), 0);

  return (
    <div className="rounded-md border border-slate-700/50 bg-slate-900/40 p-3 flex-1 min-w-0">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-slate-200">{label}</span>
        <span className="text-xs font-mono text-amber-400">{total} pts</span>
      </div>

      <select
        value={teamId ?? ""}
        onChange={(e) => onTeamChange(e.target.value ? Number(e.target.value) : null)}
        className="w-full bg-slate-800 border border-slate-700 rounded-md text-[11px] text-slate-300 px-2 py-1.5 mb-2"
      >
        <option value="">Select team…</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>

      <select
        value=""
        disabled={!teamId}
        onChange={(e) => e.target.value && onAdd(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-md text-[11px] text-slate-300 px-2 py-1.5 mb-2 disabled:opacity-40"
      >
        <option value="">{teamId ? "+ Add player…" : "Select a team first"}</option>
        {options.map((p) => (
          <option key={p.name} value={p.name}>
            {p.name} ({p.pos}) — {p.value ?? "unranked"}
          </option>
        ))}
      </select>

      <div className="space-y-1 min-h-[1.5rem]">
        {players.map((p) => (
          <div
            key={p.name}
            className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/60 rounded px-2 py-1"
          >
            <span className="truncate">
              {p.name} <span className="text-slate-500">({p.pos})</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-slate-400">{p.value ?? "—"}</span>
              <button
                onClick={() => onRemove(p.name)}
                className="text-slate-500 hover:text-rose-400 transition-colors"
                aria-label={`Remove ${p.name}`}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TradeAnalyzer({ teams }) {
  const [teamAId, setTeamAId] = useState(null);
  const [teamBId, setTeamBId] = useState(null);
  const [sideANames, setSideANames] = useState([]);
  const [sideBNames, setSideBNames] = useState([]);

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  const rosterA = useMemo(() => rosterToPlayerList(teamA), [teamA]);
  const rosterB = useMemo(() => rosterToPlayerList(teamB), [teamB]);

  const byNameA = new Map(rosterA.map((p) => [p.name, p]));
  const byNameB = new Map(rosterB.map((p) => [p.name, p]));
  const sideA = sideANames.map((n) => byNameA.get(n)).filter(Boolean);
  const sideB = sideBNames.map((n) => byNameB.get(n)).filter(Boolean);

  const totalA = sideA.reduce((s, p) => s + (p.value ?? 0), 0);
  const totalB = sideB.reduce((s, p) => s + (p.value ?? 0), 0);
  const verdict = verdictFor(totalA, totalB);

  const handleTeamAChange = (id) => {
    setTeamAId(id);
    setSideANames([]);
  };
  const handleTeamBChange = (id) => {
    setTeamBId(id);
    setSideBNames([]);
  };

  const reset = () => {
    setTeamAId(null);
    setTeamBId(null);
    setSideANames([]);
    setSideBNames([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[11px] tracking-[0.2em] uppercase text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
            <Scale size={12} /> Trade Calculator
          </div>
          <h2 className="text-xl font-bold text-slate-50">Trade Analyzer</h2>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <TradeSide
          label="Side A"
          teams={teams}
          teamId={teamAId}
          onTeamChange={handleTeamAChange}
          players={sideA}
          options={rosterA.filter((p) => !sideANames.includes(p.name))}
          onAdd={(name) => setSideANames((s) => [...s, name])}
          onRemove={(name) => setSideANames((s) => s.filter((n) => n !== name))}
        />
        <TradeSide
          label="Side B"
          teams={teams}
          teamId={teamBId}
          onTeamChange={handleTeamBChange}
          players={sideB}
          options={rosterB.filter((p) => !sideBNames.includes(p.name))}
          onAdd={(name) => setSideBNames((s) => [...s, name])}
          onRemove={(name) => setSideBNames((s) => s.filter((n) => n !== name))}
        />
      </div>

      <div className={`mt-3 rounded-md border px-3 py-2 text-center text-xs font-bold tracking-wide ${verdict.style}`}>
        {verdict.label}
        {(totalA > 0 || totalB > 0) && (
          <span className="ml-2 font-mono font-normal opacity-80">
            ({totalA} vs {totalB})
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 mt-2">
        Values are a mock PPR trade chart (0–99 scale) for prototyping — swap in real rankings later. Players not in the chart show as &quot;unranked&quot; and count as 0.
      </p>
    </div>
  );
}
