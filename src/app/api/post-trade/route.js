// Forwards a proposed trade from the Trade Analyzer widget to a Discord
// channel via webhook. The webhook URL is a bearer credential — it lives
// only in the DISCORD_WEBHOOK_URL server env var, never in client code or
// the repo (this repo is public on GitHub).
export async function POST(request) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    return Response.json({ error: "Discord webhook is not configured" }, { status: 500 });
  }

  const { teamAName, teamBName, sideA, sideB, verdictLabel, totalA, totalB } = await request.json();

  const formatSide = (players) =>
    players.length
      ? players.map((p) => `${p.name} (${p.pos}) — ${p.value != null ? p.value.toLocaleString() : "unranked"}`).join("\n")
      : "*nothing*";

  // sideA/sideB are each team's OWN roster picks — i.e. what that team is
  // sending away, not what they're getting back (see TradeAnalyzer.jsx).
  const embed = {
    title: "🔄 Trade Proposal",
    color: 0xe8a33d,
    fields: [
      { name: `${teamAName || "Side A"} sends`, value: formatSide(sideA), inline: true },
      { name: `${teamBName || "Side B"} sends`, value: formatSide(sideB), inline: true },
      { name: "Verdict", value: `${verdictLabel} (${totalA.toLocaleString()} vs ${totalB.toLocaleString()})` },
    ],
    footer: { text: "League of Integrity — Trade Analyzer" },
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ embeds: [embed] }),
  });

  if (!res.ok) {
    return Response.json({ error: `Discord responded with ${res.status}` }, { status: 502 });
  }
  return Response.json({ ok: true });
}
