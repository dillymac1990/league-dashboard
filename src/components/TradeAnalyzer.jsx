"use client";

import { useMemo, useState } from "react";
import { Scale, X, RotateCcw, Send } from "lucide-react";

function fmtValue(v) {
  return v == null ? "unranked" : v.toLocaleString();
}

// playerValues is { [sleeperPlayerId]: number }, fetched server-side from
// FantasyCalc and keyed by Sleeper ID — see src/lib/fantasycalc.js. Players
// FantasyCalc doesn't value at all (DEF, unranked rookies) show as
// "unranked" and count as 0 toward a side's total.
function rosterToPlayerList(team, playerValues) {
  if (!team) return [];
  return Object.entries(team.roster)
    .flatMap(([pos, players]) =>
      players.map((p) => ({ id: p.id, name: p.name, pos, value: playerValues[p.id] ?? null }))
    )
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
        <span className="text-xs font-mono text-amber-400">{total.toLocaleString()}</span>
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
          <option key={p.id} value={p.id}>
            {p.name} ({p.pos}) — {fmtValue(p.value)}
          </option>
        ))}
      </select>

      <div className="space-y-1 min-h-[1.5rem]">
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-800/60 rounded px-2 py-1"
          >
            <span className="truncate">
              {p.name} <span className="text-slate-500">({p.pos})</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-slate-400">{fmtValue(p.value)}</span>
              <button
                onClick={() => onRemove(p.id)}
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

export default function TradeAnalyzer({ teams, playerValues }) {
  const [teamAId, setTeamAId] = useState(null);
  const [teamBId, setTeamBId] = useState(null);
  const [sideAIds, setSideAIds] = useState([]);
  const [sideBIds, setSideBIds] = useState([]);
  const [postState, setPostState] = useState("idle"); // idle | posting | success | error

  const teamA = teams.find((t) => t.id === teamAId);
  const teamB = teams.find((t) => t.id === teamBId);

  const rosterA = useMemo(() => rosterToPlayerList(teamA, playerValues), [teamA, playerValues]);
  const rosterB = useMemo(() => rosterToPlayerList(teamB, playerValues), [teamB, playerValues]);

  const byIdA = new Map(rosterA.map((p) => [p.id, p]));
  const byIdB = new Map(rosterB.map((p) => [p.id, p]));
  const sideA = sideAIds.map((id) => byIdA.get(id)).filter(Boolean);
  const sideB = sideBIds.map((id) => byIdB.get(id)).filter(Boolean);

  const totalA = sideA.reduce((s, p) => s + (p.value ?? 0), 0);
  const totalB = sideB.reduce((s, p) => s + (p.value ?? 0), 0);
  const verdict = verdictFor(totalA, totalB);

  const handleTeamAChange = (id) => {
    setTeamAId(id);
    setSideAIds([]);
  };
  const handleTeamBChange = (id) => {
    setTeamBId(id);
    setSideBIds([]);
  };

  const reset = () => {
    setTeamAId(null);
    setTeamBId(null);
    setSideAIds([]);
    setSideBIds([]);
    setPostState("idle");
  };

  const postToDiscord = async () => {
    setPostState("posting");
    try {
      const res = await fetch("/api/post-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamAName: teamA?.name,
          teamBName: teamB?.name,
          sideA,
          sideB,
          verdictLabel: verdict.label,
          totalA,
          totalB,
        }),
      });
      setPostState(res.ok ? "success" : "error");
    } catch {
      setPostState("error");
    }
  };

  const canPost = teamA && teamB && (sideA.length > 0 || sideB.length > 0);

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
          options={rosterA.filter((p) => !sideAIds.includes(p.id))}
          onAdd={(id) => setSideAIds((s) => [...s, id])}
          onRemove={(id) => setSideAIds((s) => s.filter((n) => n !== id))}
        />
        <TradeSide
          label="Side B"
          teams={teams}
          teamId={teamBId}
          onTeamChange={handleTeamBChange}
          players={sideB}
          options={rosterB.filter((p) => !sideBIds.includes(p.id))}
          onAdd={(id) => setSideBIds((s) => [...s, id])}
          onRemove={(id) => setSideBIds((s) => s.filter((n) => n !== id))}
        />
      </div>

      <div className={`mt-3 rounded-md border px-3 py-2 text-center text-xs font-bold tracking-wide ${verdict.style}`}>
        {verdict.label}
        {(totalA > 0 || totalB > 0) && (
          <span className="ml-2 font-mono font-normal opacity-80">
            ({totalA.toLocaleString()} vs {totalB.toLocaleString()})
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={postToDiscord}
          disabled={!canPost || postState === "posting"}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 disabled:text-slate-500 rounded-md px-3 py-1.5 transition-colors"
        >
          <Send size={12} /> {postState === "posting" ? "Posting…" : "Post to Discord"}
        </button>
        {postState === "success" && <span className="text-[11px] text-emerald-400">Posted!</span>}
        {postState === "error" && <span className="text-[11px] text-rose-400">Failed to post — try again.</span>}
      </div>

      <p className="text-[11px] text-slate-500 mt-2">
        Values are live market trade values from FantasyCalc, matched to your league&apos;s actual scoring and team count. Defenses aren&apos;t valued by FantasyCalc and show as &quot;unranked&quot; (counted as 0).
      </p>
    </div>
  );
}
