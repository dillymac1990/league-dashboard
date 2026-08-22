// Manual trade grades — Sleeper has no grading data, so these are set by hand.
// Key: the trade's transaction_id (visible in the Recent Trades card data,
// or via the Sleeper API's /league/<id>/transactions/<week> endpoint).
// Value: { gradeA, gradeB } as letter grades D- through A+, matching "Side A"
// / "Side B" in the same order the dashboard shows them for that trade.
// Leave a trade's value as null (or omit it) to show "—" (ungraded).

const TRADE_GRADES = {
  // Week 1 · One Play Away got Zay Flowers, Rome Odunze <-> Worthy Baby Dak Ribs 💦 got Joe Mixon, Khalil Shakir, George Pickens
  "1267610189670924288": null,

  // Week 2 · Up Pitts Creek got Rome Odunze <-> One Play Away got Jameson Williams
  "1272676044347830272": null,

  // Week 4 · Jahmyr Year got Jared Goff <-> Time Machine got $5 FAAB
  "1278911833771610112": null,

  // Week 4 · One Play Away got Ladd McConkey <-> Time Machine got Chris Olave
  "1278377975150043136": null,

  // Week 4 · Up Pitts Creek got Isiah Pacheco <-> One Play Away got Chris Olave
  "1276645376320892928": null,

  // Week 8 · One Play Away got Terry McLaurin <-> Worthy Baby Dak Ribs 💦 got Kenneth Walker
  "1287444618769616896": null,

  // Week 9 · Puka Nachewa got Tee Higgins <-> Cromartie's Kids got Travis Etienne
  "1291500515317792768": null,

  // Week 12 · One Play Away got Matthew Stafford, Quinshon Judkins <-> Amon Ma Bidness got Josh Jacobs, Blake Corum
  "1298128727510630400": null,
};

export function getTradeGrades(transactionId) {
  return TRADE_GRADES[transactionId] ?? { gradeA: null, gradeB: null };
}
