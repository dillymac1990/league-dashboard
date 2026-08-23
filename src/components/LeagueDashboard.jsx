"use client";

import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, PieChart, Pie, Legend, LabelList
} from "recharts";
import { Trophy, TrendingUp, TrendingDown, Users, Shield, ArrowLeftRight, ChevronLeft, ChevronRight, Hammer, CalendarDays, X } from "lucide-react";
import TradeAnalyzer from "./TradeAnalyzer";

const TABS = [
  { id: "season", label: "In-Season" },
  { id: "weekly", label: "Weekly Summary" },
  { id: "trades", label: "Trade Lab" },
  { id: "draft", label: "Draft Stats" },
];

// Shared position palette (Sleeper-style, sampled from a real Sleeper draft
// board screenshot) — used by the Draft Board grid, Team Composition pie,
// and Points by Position chart alike. K wasn't visible in the sample this
// league doesn't roster one, so that value is a guess. FLEX has no Sleeper
// equivalent (it's a lineup slot, not a real position), so it keeps a
// neutral gray.
const POS_COLOR = {
  QB: "#B8507C",
  RB: "#4FAE7F",
  WR: "#4A85C4",
  TE: "#C98A45",
  K: "#B48EE0",
  DEF: "#A8706B",
  FLEX: "#8892A6",
};

// Red (worst) -> yellow (median) -> green (best) gradient, keyed to a team's
// rank among bench-points-left rather than the raw value, so the colors
// spread evenly across the full field regardless of how the values cluster.
function benchGradientColor(t) {
  const GREEN = [79, 209, 160]; // #4FD1A0
  const YELLOW = [245, 215, 110]; // #F5D76E
  const RED = [247, 108, 108]; // #F76C6C
  const [c1, c2, localT] = t <= 0.5 ? [GREEN, YELLOW, t / 0.5] : [YELLOW, RED, (t - 0.5) / 0.5];
  const [r, g, b] = c1.map((c, i) => Math.round(c + (c2[i] - c) * localT));
  return `rgb(${r}, ${g}, ${b})`;
}

// Colors ordered worst (D-) to best (A+) so grades read at a glance.
const GRADE_STYLES = {
  "A+": "bg-emerald-400/15 text-emerald-300 border-emerald-400/50",
  "A": "bg-emerald-400/15 text-emerald-300 border-emerald-400/50",
  "A-": "bg-emerald-400/15 text-emerald-300 border-emerald-400/50",
  "B+": "bg-sky-400/15 text-sky-300 border-sky-400/50",
  "B": "bg-sky-400/15 text-sky-300 border-sky-400/50",
  "B-": "bg-sky-400/15 text-sky-300 border-sky-400/50",
  "C+": "bg-amber-400/15 text-amber-300 border-amber-400/50",
  "C": "bg-amber-400/15 text-amber-300 border-amber-400/50",
  "C-": "bg-amber-400/15 text-amber-300 border-amber-400/50",
  "D+": "bg-rose-400/15 text-rose-300 border-rose-400/50",
  "D": "bg-rose-400/15 text-rose-300 border-rose-400/50",
  "D-": "bg-rose-400/15 text-rose-300 border-rose-400/50",
};

function GradeBadge({ grade }) {
  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md border text-[11px] font-black tracking-wide ${GRADE_STYLES[grade] ?? "bg-slate-700/40 text-slate-500 border-slate-600"}`}
    >
      {grade ?? "—"}
    </span>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-lg border border-slate-700/60 bg-slate-800/40 ${className}`}>
      {children}
    </div>
  );
}

function SectionLabel({ eyebrow, title }) {
  return (
    <div className="mb-4">
      <div className="text-[11px] tracking-[0.2em] uppercase text-amber-400 font-semibold mb-1">{eyebrow}</div>
      <h2 className="text-xl font-bold text-slate-50">{title}</h2>
    </div>
  );
}

export default function LeagueDashboard({
  leagueName,
  season,
  isComplete,
  currentWeek,
  numTeams,
  positions,
  rosterPositions,
  teams,
  trades,
  draftPicks,
  draftValueByTeam,
  playerValues,
}) {
  const [activeTab, setActiveTab] = useState("season");
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0].id);
  const [rosterModalPos, setRosterModalPos] = useState(null);
  const [tradePage, setTradePage] = useState(0);

  const teamName = (id) => teams.find((t) => t.id === id)?.name ?? "Unknown";

  const leagueAvgByPos = useMemo(
    () =>
      positions.reduce((acc, pos) => {
        acc[pos] = teams.reduce((s, t) => s + t.ptsByPos[pos], 0) / teams.length;
        return acc;
      }, {}),
    [positions, teams]
  );

  const standings = useMemo(
    () => [...teams].sort((a, b) => (b.record[0] - a.record[0]) || (b.pf - a.pf)),
    [teams]
  );

  const benchData = useMemo(
    () =>
      [...teams]
        .map((t) => ({
          name: t.name,
          actual: t.pf,
          optimal: Number((t.pf + t.benchPtsLeft).toFixed(1)),
          left: t.benchPtsLeft,
        }))
        .sort((a, b) => a.left - b.left)
        .map((t, i, arr) => ({ ...t, color: benchGradientColor(arr.length > 1 ? i / (arr.length - 1) : 0) })),
    [teams]
  );

  const luckData = useMemo(
    () =>
      [...teams]
        .map((t) => ({
          name: t.name,
          luck: t.luckIndex,
          wins: t.record[0],
          expected: t.expectedWins,
        }))
        .sort((a, b) => b.luck - a.luck)
        .map((t, i, arr) => ({ ...t, color: benchGradientColor(arr.length > 1 ? i / (arr.length - 1) : 0) })),
    [teams]
  );

  const draftValueData = useMemo(
    () =>
      [...(draftValueByTeam ?? [])]
        .sort((a, b) => b.avgValue - a.avgValue)
        .map((t, i, arr) => ({ ...t, color: benchGradientColor(arr.length > 1 ? i / (arr.length - 1) : 0) })),
    [draftValueByTeam]
  );

  const nonQbPicks = useMemo(() => (draftPicks ?? []).filter((p) => p.pos !== "QB"), [draftPicks]);
  const topSteals = useMemo(
    () => [...nonQbPicks].sort((a, b) => b.value - a.value).slice(0, 5),
    [nonQbPicks]
  );
  const topReaches = useMemo(
    () => [...nonQbPicks].sort((a, b) => a.value - b.value).slice(0, 5),
    [nonQbPicks]
  );
  const draftBoard = useMemo(() => {
    const picks = draftPicks ?? [];
    const slots = [...new Set(picks.map((p) => p.slot))].sort((a, b) => a - b);
    const rounds = [...new Set(picks.map((p) => p.round))].sort((a, b) => a - b);
    const slotHeader = {};
    for (const p of picks) if (!slotHeader[p.slot]) slotHeader[p.slot] = { teamName: p.teamName, owner: p.owner };
    const cell = {};
    for (const p of picks) cell[`${p.round}-${p.slot}`] = p;
    const values = picks.map((p) => p.value);
    const valueRange = { min: Math.min(...values, 0), max: Math.max(...values, 0) };
    return { slots, rounds, slotHeader, cell, valueRange };
  }, [draftPicks]);

  const TRADES_PER_PAGE = 3;
  const totalTradePages = Math.ceil(trades.length / TRADES_PER_PAGE);
  const pagedTrades = trades.slice(
    tradePage * TRADES_PER_PAGE,
    tradePage * TRADES_PER_PAGE + TRADES_PER_PAGE
  );
  const team = teams.find((t) => t.id === selectedTeamId);

  const compositionData = useMemo(
    () => rosterPositions.map((pos) => ({ name: pos, value: team.roster[pos]?.length ?? 0 })),
    [team, rosterPositions]
  );

  const scoringData = useMemo(
    () => positions.map((pos) => ({ pos, points: team.ptsByPos[pos] })),
    [team, positions]
  );

  const diffData = useMemo(
    () =>
      positions.map((pos) => {
        const diff = team.ptsByPos[pos] - leagueAvgByPos[pos];
        const pct = leagueAvgByPos[pos] ? (diff / leagueAvgByPos[pos]) * 100 : 0;
        return { pos, diff: Number(diff.toFixed(1)), pct: Number(pct.toFixed(1)) };
      }).sort((a, b) => b.pct - a.pct),
    [team, positions, leagueAvgByPos]
  );

  const strongest = diffData[0];
  const weakest = diffData[diffData.length - 1];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
      <div className="max-w-6xl mx-auto px-5 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-5">
          <div>
            <div className="text-[11px] tracking-[0.25em] uppercase text-slate-500 font-semibold mb-1">
              {season} Season &nbsp;·&nbsp; {numTeams}-Team PPR
            </div>
            <h1 className="text-3xl font-black text-slate-50 tracking-tight">{leagueName}</h1>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy size={18} />
            <span className="text-sm font-semibold">{isComplete ? "Final" : `Week ${currentWeek}`}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 border-b border-slate-800">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-amber-400 text-amber-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "season" && (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Standings */}
          <Card className="lg:col-span-1 p-5">
            <SectionLabel eyebrow="Standings" title="League Table" />
            <div className="space-y-1">
              {standings.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-left transition-colors ${
                    t.id === selectedTeamId ? "bg-amber-400/10 border border-amber-400/40" : "hover:bg-slate-700/30 border border-transparent"
                  }`}
                >
                  <span className="text-xs font-mono text-slate-500 w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-100 truncate">{t.name}</div>
                    <div className="text-[11px] text-slate-500">{t.owner}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-mono text-slate-200">{t.record[0]}-{t.record[1]}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{t.pf.toFixed(1)} PF</div>
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Team detail */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <div className="text-[11px] tracking-[0.2em] uppercase text-amber-400 font-semibold mb-1">Selected Team</div>
                  <h2 className="text-xl font-bold text-slate-50">{team.name}</h2>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-mono font-bold text-slate-100">{team.record[0]}-{team.record[1]}</div>
                  <div className="text-xs text-slate-500">{team.pf.toFixed(1)} PF · {team.pa.toFixed(1)} PA</div>
                </div>
              </div>
            </Card>

            {/* Composition + Scoring by position side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-5">
                <SectionLabel eyebrow="Roster" title="Team Composition" />
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={compositionData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                      onClick={(entry) => entry.value > 0 && setRosterModalPos(entry.name)}
                      cursor="pointer"
                      isAnimationActive={false}
                    >
                      {compositionData.map((entry) => (
                        <Cell key={entry.name} fill={POS_COLOR[entry.name]} stroke="#0f172a" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                    />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                      itemStyle={{ color: "#e2e8f0" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-5">
                <SectionLabel eyebrow="Season Total" title="Points by Position" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={scoringData} layout="vertical" margin={{ left: 8, right: 36 }}>
                    <CartesianGrid stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} />
                    <YAxis dataKey="pos" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} width={40} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                      itemStyle={{ color: "#e2e8f0" }}
                      formatter={(v) => [`${v} pts`, "Season"]}
                    />
                    <Bar dataKey="points" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {scoringData.map((entry) => (
                        <Cell key={entry.pos} fill={POS_COLOR[entry.pos]} />
                      ))}
                      <LabelList dataKey="points" position="right" fill="#94a3b8" fontSize={11} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Strengths / weaknesses */}
            <Card className="p-5">
              <SectionLabel eyebrow="Vs. League Average" title="Strengths &amp; Weaknesses" />
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <TrendingUp size={14} /> Strength: {strongest.pos} (+{strongest.pct}%)
                </div>
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold">
                  <TrendingDown size={14} /> Weakness: {weakest.pos} ({weakest.pct}%)
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={diffData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                  <CartesianGrid stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="pos" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} unit="%" />
                  <ReferenceLine y={0} stroke="#475569" />
                  <Tooltip
                    contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                    itemStyle={{ color: "#e2e8f0" }}
                    formatter={(v) => [`${v}%`, "vs. league avg"]}
                  />
                  <Bar dataKey="pct" radius={[4, 4, 0, 0]}>
                    {diffData.map((entry) => (
                      <Cell key={entry.pos} fill={entry.pct >= 0 ? "#4FD1A0" : "#F76C6C"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[11px] text-slate-500 mt-2">
                Bars show each position's share of this team's season points, relative to the {numTeams}-team league average at that position.
              </p>
            </Card>
          </div>
        </div>

        {/* Bench points left on the table */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5">
            <SectionLabel eyebrow="Lineup Efficiency" title="Points Left on the Bench" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={benchData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} unit=" pts" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(v, _n, p) => [`${v} pts (actual ${p.payload.actual} / optimal ${p.payload.optimal})`, "Left on bench"]}
                />
                <Bar dataKey="left" radius={[0, 4, 4, 0]}>
                  {benchData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-500 mt-2">
              Season-to-date points each team's optimal lineup would have scored, minus what they actually started.
            </p>
          </Card>

          <Card className="p-5">
            <SectionLabel eyebrow="Schedule Luck" title="Luck Index" />
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={luckData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  width={110}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(v, _n, p) => [`${v > 0 ? "+" : ""}${v} (${p.payload.wins} actual wins vs. ${p.payload.expected} expected)`, "Luck"]}
                />
                <Bar dataKey="luck" radius={[4, 4, 4, 4]} isAnimationActive={false}>
                  {luckData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-500 mt-2">
              Actual wins minus expected wins from an all-play record. Positive means a kinder schedule than their scoring earned; negative means a tougher one.
            </p>
          </Card>
        </div>
        </>
        )}

        {activeTab === "trades" && (
        <>
        {/* Trade Analyzer */}
        <div>
          <Card className="p-5">
            <TradeAnalyzer teams={teams} playerValues={playerValues} />
          </Card>
        </div>

        {/* Trades */}
        <div className="mt-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel eyebrow="Transaction Log" title="Recent Trades" />
              <span className="text-[11px] text-slate-500 font-mono">{trades.length} this season</span>
            </div>
            <div className="space-y-3">
              {pagedTrades.map((tr) => (
                <div key={tr.id} className="rounded-md border border-slate-700/50 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold">
                      <ArrowLeftRight size={12} className="text-amber-400" />
                      Week {tr.week} &nbsp;·&nbsp; {tr.date}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-200">{teamName(tr.teamA)}</span>
                        <GradeBadge grade={tr.gradeA} />
                      </div>
                      <div className="text-[11px] text-emerald-400 mb-0.5">
                        {tr.receiveA.map((p) => (
                          <div key={p}>+ {p}</div>
                        ))}
                      </div>
                      <div className="text-[11px] text-rose-400">
                        {tr.sendA.map((p) => (
                          <div key={p}>− {p}</div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-slate-200">{teamName(tr.teamB)}</span>
                        <GradeBadge grade={tr.gradeB} />
                      </div>
                      <div className="text-[11px] text-emerald-400 mb-0.5">
                        {tr.receiveB.map((p) => (
                          <div key={p}>+ {p}</div>
                        ))}
                      </div>
                      <div className="text-[11px] text-rose-400">
                        {tr.sendB.map((p) => (
                          <div key={p}>− {p}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {trades.length === 0 && (
                <div className="text-xs text-slate-500">No trades yet this season.</div>
              )}
            </div>
            {totalTradePages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-700/50">
                <button
                  onClick={() => setTradePage((p) => Math.max(0, p - 1))}
                  disabled={tradePage === 0}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span className="text-[11px] text-slate-500 font-mono">
                  Page {tradePage + 1} of {totalTradePages}
                </span>
                <button
                  onClick={() => setTradePage((p) => Math.min(totalTradePages - 1, p + 1))}
                  disabled={tradePage === totalTradePages - 1}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </Card>
        </div>
        </>
        )}

        {activeTab === "draft" && (
        <>
        {draftPicks && draftPicks.length > 0 ? (
        <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-5">
            <SectionLabel eyebrow="Value Over Finish" title="Draft Value by Team" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={draftValueData} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={{ stroke: "#334155" }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                  axisLine={{ stroke: "#334155" }}
                  width={110}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                  itemStyle={{ color: "#e2e8f0" }}
                  formatter={(v) => [`${v > 0 ? "+" : ""}${v} avg. spots per pick`, "Draft value"]}
                />
                <Bar dataKey="avgValue" radius={[4, 4, 4, 4]}>
                  {draftValueData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="text-[11px] text-slate-500 mt-2">
              Average of (pick number − season points finish rank) across each team&apos;s picks. Positive means players outperformed where they were drafted.
            </p>
          </Card>

          <Card className="p-5">
            <SectionLabel eyebrow="Hits &amp; Misses" title="Values &amp; Busts" />
            <div className="mb-1 text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
              <TrendingUp size={12} /> Biggest Values
            </div>
            <div className="space-y-1 mb-4">
              {topSteals.map((p) => (
                <div key={p.pickNo} className="flex items-center justify-between text-[11px] bg-slate-900/40 rounded px-2 py-1.5">
                  <span className="text-slate-300 truncate">
                    R{p.round}.{String(((p.pickNo - 1) % numTeams) + 1).padStart(2, "0")} {p.player} <span className="text-slate-500">({p.pos})</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-slate-500 truncate max-w-[90px]">{p.owner}</span>
                    <span className="font-mono text-emerald-400">+{p.value}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mb-1 text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
              <TrendingDown size={12} /> Biggest Busts
            </div>
            <div className="space-y-1">
              {topReaches.map((p) => (
                <div key={p.pickNo} className="flex items-center justify-between text-[11px] bg-slate-900/40 rounded px-2 py-1.5">
                  <span className="text-slate-300 truncate">
                    R{p.round}.{String(((p.pickNo - 1) % numTeams) + 1).padStart(2, "0")} {p.player} <span className="text-slate-500">({p.pos})</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-slate-500 truncate max-w-[90px]">{p.owner}</span>
                    <span className="font-mono text-rose-400">{p.value}</span>
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="mt-6">
          <Card className="p-5">
            <SectionLabel eyebrow="Pick By Pick" title="Draft Board" />
            <div className="overflow-x-auto">
              <table className="border-separate border-spacing-1 w-full table-fixed">
                <colgroup>
                  <col style={{ width: "34px" }} />
                  {draftBoard.slots.map((slot) => (
                    <col key={slot} />
                  ))}
                </colgroup>
                <thead>
                  <tr>
                    <th className="bg-slate-800 text-[10px] text-slate-500 font-mono font-normal px-1.5 py-1.5 text-left">
                      Rd
                    </th>
                    {draftBoard.slots.map((slot) => (
                      <th
                        key={slot}
                        title={draftBoard.slotHeader[slot]?.teamName}
                        className="bg-slate-800 text-[10px] text-slate-300 font-semibold px-1.5 py-1.5 text-left truncate"
                      >
                        {draftBoard.slotHeader[slot]?.owner}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {draftBoard.rounds.map((round) => (
                    <tr key={round}>
                      <td className="bg-slate-800 text-[10px] font-mono text-amber-400 px-1.5 py-1.5">
                        {round}
                      </td>
                      {draftBoard.slots.map((slot) => {
                        const p = draftBoard.cell[`${round}-${slot}`];
                        if (!p) return <td key={slot} className="bg-slate-900/40 rounded" />;
                        const bg = POS_COLOR[p.pos] || "#94a3b8";
                        return (
                          <td
                            key={slot}
                            title={`Pick ${p.pickNo} · ${p.player} (${p.pos}) · ${p.seasonPts} pts · ${p.value > 0 ? "+" : ""}${p.value} value`}
                            className="text-[10px] px-1.5 py-1.5 rounded overflow-hidden"
                            style={{ background: bg }}
                          >
                            <div className="text-black font-semibold truncate">{p.player}</div>
                            <div className="text-black/70 font-mono truncate">{p.pos} · {p.pickNo}</div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3">
              {Object.entries(POS_COLOR).filter(([pos]) => pos !== "FLEX").map(([pos, color]) => (
                <div key={pos} className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span className="text-[10px] text-slate-500">{pos}</span>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Columns are draft slots (fixed per manager for the whole snake draft).
            </p>
          </Card>
        </div>
        </>
        ) : (
          <Card className="p-8 text-center">
            <Hammer size={28} className="mx-auto text-slate-600 mb-3" />
            <h2 className="text-lg font-bold text-slate-200 mb-1">No draft data available</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              This league&apos;s draft hasn&apos;t happened yet, or Sleeper has no draft on record for it.
            </p>
          </Card>
        )}
        </>
        )}

        {activeTab === "weekly" && (
          <Card className="p-8 text-center">
            <CalendarDays size={28} className="mx-auto text-slate-600 mb-3" />
            <h2 className="text-lg font-bold text-slate-200 mb-1">Weekly Summary coming soon</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Reserved for a week-by-week recap — matchup results, top performers, closest game, biggest blowout. Needs matchup pairings pulled in from Sleeper, which aren&apos;t wired up yet.
            </p>
          </Card>
        )}

        <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-600">
          <Shield size={12} />
          Live data via Sleeper &nbsp;·&nbsp; {season} season
        </div>
      </div>

      {rosterModalPos && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setRosterModalPos(null)}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-sm max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm" style={{ background: POS_COLOR[rosterModalPos] }} />
                <h3 className="text-sm font-bold text-slate-100">{team.name} — {rosterModalPos}</h3>
              </div>
              <button
                onClick={() => setRosterModalPos(null)}
                className="text-slate-500 hover:text-slate-200 transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-1">
              {(team.roster[rosterModalPos] ?? []).map((p) => (
                <div key={p.id} className="text-xs text-slate-300 bg-slate-800/60 rounded px-2 py-1.5">
                  {p.name}
                </div>
              ))}
              {(team.roster[rosterModalPos] ?? []).length === 0 && (
                <div className="text-xs text-slate-500">No players at this position.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
