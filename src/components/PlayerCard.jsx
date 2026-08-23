"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { POS_COLOR } from "@/lib/posColors";

function headshotUrl(id, pos) {
  if (pos === "DEF") return `https://sleepercdn.com/images/team_logos/nfl/${id.toLowerCase()}.png`;
  return `https://sleepercdn.com/content/nfl/players/${id}.jpg`;
}

const INJURY_STYLE = {
  Out: "bg-rose-400/15 text-rose-300 border-rose-400/50",
  Doubtful: "bg-rose-400/15 text-rose-300 border-rose-400/50",
  Questionable: "bg-amber-400/15 text-amber-300 border-amber-400/50",
  IR: "bg-rose-400/15 text-rose-300 border-rose-400/50",
  PUP: "bg-slate-700/40 text-slate-400 border-slate-600",
};

// A single modal instance a component can render, driven by `playerId`
// (null = closed). `playerIndex` is the {id: {name,pos,team,...}} map
// returned from getLeagueData — every component that opens a card needs it.
export default function PlayerCard({ playerId, playerIndex, onClose }) {
  const [imgFailed, setImgFailed] = useState(false);

  if (!playerId) return null;
  const p = playerIndex?.[playerId];
  if (!p) return null;

  const color = POS_COLOR[p.pos] || "#94a3b8";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700 rounded-lg p-5 w-full max-w-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end mb-1">
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-full overflow-hidden border-2 flex items-center justify-center bg-slate-800 mb-3"
            style={{ borderColor: color }}
          >
            {!imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={headshotUrl(playerId, p.pos)}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <span className="text-lg font-black text-slate-500">{p.pos || "?"}</span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-100">{p.name}</h3>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-md"
              style={{ background: color, color: "#000" }}
            >
              {p.pos}
            </span>
            {p.team && <span className="text-xs text-slate-400 font-mono">{p.team}</span>}
            {p.number != null && <span className="text-xs text-slate-500 font-mono">#{p.number}</span>}
          </div>

          {p.injuryStatus && (
            <span
              className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${INJURY_STYLE[p.injuryStatus] ?? "bg-slate-700/40 text-slate-400 border-slate-600"}`}
            >
              {p.injuryStatus}
            </span>
          )}

          <div className="grid grid-cols-2 gap-3 w-full mt-4 pt-4 border-t border-slate-800">
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Season Pts</div>
              <div className="text-lg font-mono font-bold text-slate-100">{p.seasonPts}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-slate-500">Trade Value</div>
              <div className="text-lg font-mono font-bold text-amber-400">
                {p.value != null ? p.value.toLocaleString() : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
