import fs from "node:fs";
import path from "node:path";

const output = process.argv[2] || "prototype/data/cards.json";
const maxPagesArg = Number(process.argv[3] || 0);
const endpoint = "https://www.fut.gg/api/fut/players/v2/26/";
const assetBase = "https://game-assets.fut.gg/cdn-cgi/image/quality=85,format=auto,width=400/";

const cards = [];
let page = 1;
let total = null;

while (page) {
  if (maxPagesArg && page > maxPagesArg) break;
  const url = `${endpoint}?page=${page}&sort=-overall`;
  const json = await fetchJson(url);
  total ??= json.total;
  cards.push(...json.data.map(normalizeFutggItem).filter(Boolean));
  console.log(`page ${json.currentPage || page}: ${cards.length}/${total || "?"}`);
  page = json.next || 0;
}

const deduped = [...new Map(cards.map(card => [card.id, card])).values()]
  .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(deduped, null, 2)}\n`);
console.log(`Wrote ${deduped.length} FUT.GG cards to ${output}`);

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "application/json",
      "user-agent": "Mozilla/5.0 15-0 Draft Prototype"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function normalizeFutggItem(item) {
  const pos = positionName(item.positionId ?? item.position);
  if (!pos) return null;
  const stats = item.faceStatsV2 || item.faceStats || {};
  const name = item.commonName || item.nickname || `${item.firstName || ""} ${item.lastName || ""}`.trim();
  const alternatePositions = (item.alternativePositionIds || [])
    .map(positionName)
    .filter(Boolean)
    .filter(position => position !== pos);

  return {
    id: `futgg-${item.eaId}-${pos}`.toLowerCase(),
    source: "FUT.GG",
    sourceUrl: item.url ? `https://www.fut.gg${item.url}` : "",
    sourceId: item.basePlayerEaId || item.eaId,
    itemId: item.eaId,
    name,
    pos,
    alternatePositions,
    role: roleFromPos(pos),
    nation: item.nation?.name || "",
    league: item.league?.name || "",
    club: item.club?.name || item.uniqueClub?.name || "",
    cardType: item.rarityName || item.cardName || (item.isSpecial ? "Special" : "Gold"),
    isIcon: Boolean(item.isIcon),
    isHero: Boolean(item.isHero),
    image: imageUrl(item.imagePath),
    cardImage: imageUrl(item.cardImagePath || item.simpleCardImagePath),
    ovr: number(item.overall, 75),
    pac: faceStat(stats, "facePace", "gkFaceDiving", 70),
    sho: faceStat(stats, "faceShooting", "gkFaceHandling", 60),
    pas: faceStat(stats, "facePassing", "gkFaceKicking", 60),
    dri: faceStat(stats, "faceDribbling", "gkFaceReflexes", 60),
    def: faceStat(stats, "faceDefending", "gkFaceSpeed", 50),
    phy: faceStat(stats, "facePhysicality", "gkFacePositioning", 60),
    skillMoves: number(item.skillMoves, 0),
    weakFoot: number(item.weakFoot, 0),
    clutch: number(item.overall, 75),
    price: number(item.price || item.currentDbPrice, 0)
  };
}

function imageUrl(src) {
  if (!src) return "";
  if (String(src).startsWith("http")) return src;
  return `${assetBase}${src}`;
}

function number(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function faceStat(stats, outfieldKey, keeperKey, fallback) {
  return number(stats[outfieldKey], 0) || number(stats[keeperKey], fallback);
}

function positionName(value) {
  if (typeof value === "string" && value.length <= 4) return value.toUpperCase();
  return ({
    0: "GK",
    2: "RWB",
    3: "RB",
    5: "CB",
    7: "LB",
    8: "LWB",
    10: "CDM",
    12: "RM",
    14: "CM",
    16: "LM",
    18: "CAM",
    21: "CF",
    23: "RW",
    25: "ST",
    27: "LW"
  })[Number(value)] || "";
}

function roleFromPos(pos) {
  if (["ST", "CF"].includes(pos)) return "FRV";
  if (["LW", "RW", "LM", "RM"].includes(pos)) return "KNT";
  if (["LB", "RB", "LWB", "RWB"].includes(pos)) return "BEK";
  if (pos === "CB") return "STP";
  if (pos === "GK") return "KL";
  return "OS";
}
