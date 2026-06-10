import fs from "node:fs";
import https from "node:https";
import path from "node:path";

const output = process.argv[2] || "prototype/data/cards.json";
const baseUrl = "https://www.ea.com/en/games/ea-sports-fc/ratings";

const firstPage = await fetchText(baseUrl);
const nextData = extractNextData(firstPage);
const positions = nextData.props.pageProps.auxData.defaultLocaleFilters.positions;
const allCards = [];

for (const position of positions) {
  const url = `${baseUrl}?position=${encodeURIComponent(position.id)}`;
  const page = await fetchText(url);
  const data = extractNextData(page);
  const items = data.props.pageProps.ratingDetails.items || [];
  for (const item of items) allCards.push(normalizeEaCard(item));
  console.log(`${position.shortLabel}: ${items.length}`);
}

const deduped = [...new Map(allCards.map(card => [card.id, card])).values()]
  .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
const finalCards = applyPromoOverrides(deduped);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(finalCards, null, 2)}\n`);
console.log(`Wrote ${finalCards.length} EA cards to ${output}`);

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "user-agent": "Mozilla/5.0" } }, response => {
      if (response.statusCode < 200 || response.statusCode >= 300) {
        reject(new Error(`HTTP ${response.statusCode} for ${url}`));
        response.resume();
        return;
      }
      let data = "";
      response.setEncoding("utf8");
      response.on("data", chunk => data += chunk);
      response.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Could not find __NEXT_DATA__ in EA ratings page");
  return JSON.parse(match[1]);
}

function normalizeEaCard(item) {
  const name = item.commonName || `${item.firstName || ""} ${item.lastName || ""}`.trim();
  const stats = item.stats || {};
  const pos = item.position?.shortLabel || "";
  return {
    id: `ea-${item.id}-${pos}`.toLowerCase(),
    source: "EA FC Ratings",
    sourceId: item.id,
    name,
    pos,
    alternatePositions: (item.alternatePositions || []).map(position => position.shortLabel).filter(Boolean),
    role: roleFromPos(pos),
    nation: item.nationality?.label || "",
    league: item.leagueName || "",
    club: item.team?.label || "",
    cardType: "Gold",
    image: item.avatarUrl || "",
    shieldUrl: item.shieldUrl || "",
    ovr: number(item.overallRating, 75),
    pac: stat(stats, "pac", 70),
    sho: stat(stats, "sho", 60),
    pas: stat(stats, "pas", 60),
    dri: stat(stats, "dri", 60),
    def: stat(stats, "def", 50),
    phy: stat(stats, "phy", 60),
    skillMoves: number(item.skillMoves, 0),
    weakFoot: number(item.weakFootAbility, 0),
    clutch: stat(stats, "composure", number(item.overallRating, 75)),
    playStyles: (item.playerAbilities || []).map(ability => ability.label).filter(Boolean)
  };
}

function stat(stats, key, fallback) {
  return number(stats[key]?.value, fallback);
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roleFromPos(pos) {
  if (["ST", "CF"].includes(pos)) return "FRV";
  if (["LW", "RW", "LM", "RM"].includes(pos)) return "KNT";
  if (["LB", "RB", "LWB", "RWB"].includes(pos)) return "BEK";
  if (pos === "CB") return "STP";
  if (pos === "GK") return "KL";
  return "OS";
}

function applyPromoOverrides(cards) {
  const overridePath = "prototype/data/promo-overrides.json";
  if (!fs.existsSync(overridePath)) return cards;
  const overrides = JSON.parse(fs.readFileSync(overridePath, "utf8"));
  const extras = [];
  for (const override of overrides) {
    const base = cards.find(card =>
      (override.sourceId && String(card.sourceId) === String(override.sourceId)) ||
      (override.name && card.name.toLowerCase() === String(override.name).toLowerCase() && (!override.pos || card.pos === override.pos))
    );
    if (!base) continue;
    const cardType = override.cardType || "Promo";
    extras.push({
      ...base,
      ...override,
      id: `promo-${base.sourceId}-${slug(cardType)}-${override.pos || base.pos}`.toLowerCase(),
      source: override.source || "Promo Override",
      cardType,
      pos: override.pos || base.pos,
      role: roleFromPos(override.pos || base.pos),
      ovr: number(override.ovr, base.ovr),
      pac: number(override.pac, base.pac),
      sho: number(override.sho, base.sho),
      pas: number(override.pas, base.pas),
      dri: number(override.dri, base.dri),
      def: number(override.def, base.def),
      phy: number(override.phy, base.phy),
      clutch: number(override.clutch, override.ovr || base.clutch)
    });
  }
  return [...cards, ...extras].sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
