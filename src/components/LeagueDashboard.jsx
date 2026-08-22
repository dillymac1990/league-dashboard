"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ReferenceLine, PieChart, Pie, Legend
} from "recharts";
import { Trophy, TrendingUp, TrendingDown, Users, Shield, ArrowLeftRight, ChevronLeft, ChevronRight } from "lucide-react";
import TradeAnalyzer from "./TradeAnalyzer";

// ---------------------------------------------------------------------------
// MOCK LEAGUE DATA — swap this block for live Sleeper API data later.
// Structure mirrors what you'd get back from /league/rosters + /league/users
// plus a season-to-date points-by-position rollup you'd compute server-side.
// ---------------------------------------------------------------------------

const POSITIONS = ["QB", "RB", "WR", "TE", "FLEX", "DEF", "K"];

const POS_COLOR = {
  QB: "#E8A33D",
  RB: "#4FD1A0",
  WR: "#5FA8F5",
  TE: "#C77DFF",
  FLEX: "#8892A6",
  DEF: "#F76C6C",
  K: "#F5D76E",
};

const TEAMS = [
  {
    id: 1, name: "Gridiron Guillotine", owner: "Dylan", record: [9, 3], pf: 1487.2, pa: 1301.4, benchPtsLeft: 62.4,
    roster: { QB: ["J. Allen"], RB: ["J. Gibbs", "K. Walker", "T. Etienne"], WR: ["A. Brown", "D. London", "J. Waddle"], TE: ["T. McBride"], FLEX: ["R. Rice"], DEF: ["BUF"], K: ["B. McManus"] },
    ptsByPos: { QB: 312.4, RB: 398.6, WR: 356.1, TE: 118.4, FLEX: 91.2, DEF: 104.8, K: 105.7 },
  },
  {
    id: 2, name: "Kelce's Angels", owner: "Marcus", record: [8, 4], pf: 1442.8, pa: 1358.9, benchPtsLeft: 88.1,
    roster: { QB: ["L. Jackson"], RB: ["B. Robinson", "D. Achane", "C. Brown"], WR: ["C. Lamb", "N. Collins", "T. Higgins"], TE: ["S. LaPorta"], FLEX: ["J. Jacobs"], DEF: ["SF"], K: ["J. Tucker"] },
    ptsByPos: { QB: 289.1, RB: 421.3, WR: 340.7, TE: 88.2, FLEX: 76.4, DEF: 92.1, K: 98.3 },
  },
  {
    id: 3, name: "Purdy League Champs", owner: "Sam", record: [8, 4], pf: 1398.5, pa: 1290.1, benchPtsLeft: 45.7,
    roster: { QB: ["B. Purdy"], RB: ["J. Taylor", "S. Barkley", "R. Stevenson"], WR: ["J. Jefferson", "G. Pickens", "Z. Flowers"], TE: ["B. Bowers"], FLEX: ["D. Montgomery"], DEF: ["DAL"], K: ["H. Butker"] },
    ptsByPos: { QB: 254.9, RB: 372.4, WR: 401.8, TE: 141.6, FLEX: 68.9, DEF: 88.5, K: 96.2 },
  },
  {
    id: 4, name: "Waiver Wire Wizards", owner: "Priya", record: [7, 5], pf: 1361.0, pa: 1339.7, benchPtsLeft: 103.6,
    roster: { QB: ["J. Daniels"], RB: ["A. Jeanty", "J. Cook", "K. Williams"], WR: ["M. Nabers", "C. Olave", "D. Smith"], TE: ["D. Kincaid"], FLEX: ["C. Skattebo"], DEF: ["PIT"], K: ["Y. Koo"] },
    ptsByPos: { QB: 271.5, RB: 344.9, WR: 318.2, TE: 79.3, FLEX: 82.7, DEF: 95.6, K: 91.4 },
  },
  {
    id: 5, name: "Sunday Scaries", owner: "Nate", record: [6, 6], pf: 1305.6, pa: 1312.3, benchPtsLeft: 71.3,
    roster: { QB: ["J. Hurts"], RB: ["D. Henry", "O. Hampton", "J. Warren"], WR: ["A. St. Brown", "T. McLaurin", "J. Smith-Njigba"], TE: ["T. Kraft"], FLEX: ["D. Adams"], DEF: ["BAL"], K: ["C. Boswell"] },
    ptsByPos: { QB: 249.8, RB: 331.2, WR: 289.4, TE: 71.8, FLEX: 74.1, DEF: 84.9, K: 89.7 },
  },
  {
    id: 6, name: "Fumble Rooski", owner: "Chris", record: [6, 6], pf: 1288.9, pa: 1301.5, benchPtsLeft: 129.8,
    roster: { QB: ["D. Prescott"], RB: ["J. Jacobs", "B. Irving", "T. Pollard"], WR: ["D. Metcalf", "C. Sutton", "R. Rice"], TE: ["K. Pitts"], FLEX: ["C. Watson"], DEF: ["HOU"], K: ["D. Carlson"] },
    ptsByPos: { QB: 238.7, RB: 298.5, WR: 312.6, TE: 62.4, FLEX: 79.8, DEF: 90.2, K: 88.1 },
  },
  {
    id: 7, name: "Hurts So Good", owner: "Elena", record: [5, 7], pf: 1256.3, pa: 1329.8, benchPtsLeft: 58.9,
    roster: { QB: ["C. Williams"], RB: ["C. McCaffrey", "R. Harvey", "T. Henderson"], WR: ["G. Wilson", "L. Burden", "S. Diggs"], TE: ["T. Warren"], FLEX: ["J. Downs"], DEF: ["NYJ"], K: ["W. Lutz"] },
    ptsByPos: { QB: 219.4, RB: 289.1, WR: 301.7, TE: 96.3, FLEX: 69.5, DEF: 78.4, K: 83.9 },
  },
  {
    id: 8, name: "Third and Long Island", owner: "Omar", record: [5, 7], pf: 1231.7, pa: 1318.2, benchPtsLeft: 94.2,
    roster: { QB: ["T. Lawrence"], RB: ["J. Croskey-Merritt", "K. Monangai", "A. Jones"], WR: ["T. Hunter", "K. Shakir", "J. Meyers"], TE: ["M. Andrews"], FLEX: ["Q. Judkins"], DEF: ["MIA"], K: ["M. Gay"] },
    ptsByPos: { QB: 224.6, RB: 251.8, WR: 279.3, TE: 84.7, FLEX: 71.2, DEF: 81.6, K: 82.5 },
  },
  {
    id: 9, name: "Interception Junction", owner: "Robin", record: [4, 8], pf: 1198.4, pa: 1341.6, benchPtsLeft: 142.5,
    roster: { QB: ["J. Love"], RB: ["Z. Charbonnet", "T. Tracy", "J. Mason"], WR: ["J. Waddle", "R. Odunze", "M. Pittman"], TE: ["I. Likely"], FLEX: ["D. Doubs"], DEF: ["CLE"], K: ["G. Zuerlein"] },
    ptsByPos: { QB: 198.3, RB: 268.4, WR: 274.1, TE: 58.9, FLEX: 66.7, DEF: 74.3, K: 79.8 },
  },
  {
    id: 10, name: "Mahomes Alone", owner: "Bilal", record: [3, 9], pf: 1142.1, pa: 1389.4, benchPtsLeft: 76.8,
    roster: { QB: ["P. Mahomes"], RB: ["A. Kamara", "R. White", "T. Spears"], WR: ["X. Worthy", "R. Shaheed", "K. Concepcion"], TE: ["J. Ferguson"], FLEX: ["D. Samuel"], DEF: ["NE"], K: ["C. Santos"] },
    ptsByPos: { QB: 187.9, RB: 231.6, WR: 249.8, TE: 51.2, FLEX: 61.4, DEF: 68.7, K: 76.9 },
  },
];

// League-average points at each position, for the strengths/weaknesses comparison
const leagueAvgByPos = POSITIONS.reduce((acc, pos) => {
  acc[pos] = TEAMS.reduce((s, t) => s + t.ptsByPos[pos], 0) / TEAMS.length;
  return acc;
}, {});

const standings = [...TEAMS].sort((a, b) => (b.record[0] - a.record[0]) || (b.pf - a.pf));

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

// Optimal lineup (actual + bench points left on the table), ranked best-managed first.
const benchData = [...TEAMS]
  .map((t) => ({
    name: t.name,
    actual: t.pf,
    optimal: Number((t.pf + t.benchPtsLeft).toFixed(1)),
    left: t.benchPtsLeft,
  }))
  .sort((a, b) => a.left - b.left)
  .map((t, i, arr) => ({ ...t, color: benchGradientColor(i / (arr.length - 1)) }));

const teamName = (id) => TEAMS.find((t) => t.id === id)?.name ?? "Unknown";

// Mock trade log — mirrors what you'd get back from
// GET /league/<league_id>/transactions/<round> filtered to type === "trade"
const TRADES = [
  {
    id: 1, week: 11, date: "Nov 18",
    teamA: 1, sendA: ["R. Rice (WR)"], receiveA: ["D. Achane (RB)", "2026 3rd"], gradeA: "B+",
    teamB: 2, sendB: ["D. Achane (RB)", "2026 3rd"], receiveB: ["R. Rice (WR)"], gradeB: "C-",
  },
  {
    id: 2, week: 10, date: "Nov 11",
    teamA: 4, sendA: ["D. Kincaid (TE)"], receiveA: ["T. Kraft (TE)", "K. Williams (RB)"], gradeA: "A-",
    teamB: 5, sendB: ["T. Kraft (TE)", "K. Williams (RB)"], receiveB: ["D. Kincaid (TE)"], gradeB: "D+",
  },
  {
    id: 3, week: 9, date: "Nov 4",
    teamA: 3, sendA: ["S. Barkley (RB)", "2026 5th"], receiveA: ["D. Henry (RB)"], gradeA: "B",
    teamB: 5, sendB: ["D. Henry (RB)"], receiveB: ["S. Barkley (RB)", "2026 5th"], gradeB: "B-",
  },
  {
    id: 4, week: 7, date: "Oct 21",
    teamA: 9, sendA: ["J. Love (QB)"], receiveA: ["D. Doubs (WR)", "R. Odunze (WR)"], gradeA: "A",
    teamB: 6, sendB: ["D. Doubs (WR)", "R. Odunze (WR)"], receiveB: ["J. Love (QB)"], gradeB: "D",
  },
  {
    id: 5, week: 5, date: "Oct 7",
    teamA: 8, sendA: ["A. Jones (RB)"], receiveA: ["Q. Judkins (RB)", "2027 4th"], gradeA: "A+",
    teamB: 4, sendB: ["Q. Judkins (RB)", "2027 4th"], receiveB: ["A. Jones (RB)"], gradeB: "D-",
  },
];

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
      className={`inline-flex items-center justify-center px-2 py-0.5 rounded-md border text-[11px] font-black tracking-wide ${GRADE_STYLES[grade] ?? "bg-slate-700/40 text-slate-300 border-slate-600"}`}
    >
      {grade}
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

export default function LeagueDashboard() {
  const [selectedTeamId, setSelectedTeamId] = useState(TEAMS[0].id);
  const [tradePage, setTradePage] = useState(0);

  const TRADES_PER_PAGE = 3;
  const totalTradePages = Math.ceil(TRADES.length / TRADES_PER_PAGE);
  const pagedTrades = TRADES.slice(
    tradePage * TRADES_PER_PAGE,
    tradePage * TRADES_PER_PAGE + TRADES_PER_PAGE
  );
  const team = TEAMS.find((t) => t.id === selectedTeamId);

  const compositionData = useMemo(
    () => POSITIONS.map((pos) => ({ name: pos, value: team.roster[pos].length })),
    [team]
  );

  const scoringData = useMemo(
    () => POSITIONS.map((pos) => ({ pos, points: team.ptsByPos[pos] })),
    [team]
  );

  const diffData = useMemo(
    () =>
      POSITIONS.map((pos) => {
        const diff = team.ptsByPos[pos] - leagueAvgByPos[pos];
        const pct = (diff / leagueAvgByPos[pos]) * 100;
        return { pos, diff: Number(diff.toFixed(1)), pct: Number(pct.toFixed(1)) };
      }).sort((a, b) => b.pct - a.pct),
    [team]
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
              Late Round Legends &nbsp;·&nbsp; 12-Team PPR
            </div>
            <h1 className="text-3xl font-black text-slate-50 tracking-tight">League Command Center</h1>
          </div>
          <div className="flex items-center gap-2 text-amber-400">
            <Trophy size={18} />
            <span className="text-sm font-semibold">Week 13</span>
          </div>
        </div>

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
                  <BarChart data={scoringData} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} />
                    <YAxis dataKey="pos" type="category" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={{ stroke: "#334155" }} width={40} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 6, fontSize: 12 }}
                      itemStyle={{ color: "#e2e8f0" }}
                      formatter={(v) => [`${v} pts`, "Season"]}
                    />
                    <Bar dataKey="points" radius={[0, 4, 4, 0]}>
                      {scoringData.map((entry) => (
                        <Cell key={entry.pos} fill={POS_COLOR[entry.pos]} />
                      ))}
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
                Bars show each position's share of this team's season points, relative to the 10-team league average at that position.
              </p>
            </Card>
          </div>
        </div>

        {/* Bench points left on the table */}
        <div className="mt-6">
          <Card className="p-5">
            <SectionLabel eyebrow="Lineup Efficiency" title="Points Left on the Bench" />
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={benchData} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
                <CartesianGrid stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={{ stroke: "#334155" }} unit=" pts" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={{ stroke: "#334155" }}
                  width={140}
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
        </div>

        {/* Trade Analyzer */}
        <div className="mt-6">
          <Card className="p-5">
            <TradeAnalyzer />
          </Card>
        </div>

        {/* Trades */}
        <div className="mt-6">
          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <SectionLabel eyebrow="Transaction Log" title="Recent Trades" />
              <span className="text-[11px] text-slate-500 font-mono">{TRADES.length} this season</span>
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

        <div className="mt-8 flex items-center gap-2 text-[11px] text-slate-600">
          <Shield size={12} />
          Prototype view · sample data · connects to your live Sleeper league next
        </div>
      </div>
    </div>
  );
}
