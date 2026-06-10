import fs from "node:fs";
import path from "node:path";

const urlFile = process.argv[2] || "prototype/data/futgg-promo-urls.txt";
const cardsFile = process.argv[3] || "prototype/data/cards.json";
const assetBase = "https://game-assets.fut.gg/cdn-cgi/image/quality=85,format=auto,width=400/";

const urls = fs.readFileSync(urlFile, "utf8")
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith("#"));

const existing = fs.existsSync(cardsFile) ? JSON.parse(fs.readFileSync(cardsFile, "utf8")) : [];
const promos = [];

for (const url of urls) {
  try {
    const html = await fetchText(url);
    const card = parseFutggCard(html, url);
    promos.push(card);
    console.log(`${card.ovr} ${card.pos} ${card.name} - ${card.cardType}`);
  } catch (error) {
    console.warn(`Skipped ${url}: ${error.message}`);
  }
}

const merged = [...new Map([...existing, ...promos].map(card => [card.id, card])).values()]
  .sort((a, b) => b.ovr - a.ovr || a.name.localeCompare(b.name));

fs.mkdirSync(path.dirname(cardsFile), { recursive: true });
fs.writeFileSync(cardsFile, `${JSON.stringify(merged, null, 2)}\n`);
console.log(`Wrote ${merged.length} cards (${promos.length} FUT.GG promos read) to ${cardsFile}`);

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html",
      "user-agent": "Mozilla/5.0 15-0 Draft Prototype"
    }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.text();
}

function parseFutggCard(html, url) {
  const start = html.indexOf("playerDef:$R");
  if (start < 0) throw new Error("playerDef not found");
  const block = html.slice(start, start + 14000);
  const eaId = num(block, /eaId:(\d+)/);
  const basePlayerEaId = num(block, /basePlayerEaId:(\d+)/);
  const pos = posFromId(num(block, /position:(\d+)/));
  const name = str(block, /nickname:"([^"]*)"/)
    || str(block, /commonName:"([^"]*)"/)
    || `${str(block, /firstName:"([^"]*)"/) || ""} ${str(block, /lastName:"([^"]*)"/) || ""}`.trim();
  const rarity = nestedName(block, "rarity") || "Promo";
  const club = nestedName(block, "club");
  const nation = nestedName(block, "nation");
  const league = nestedName(block, "league");
  const imagePath = str(block, /imagePath:"([^"]*)"/);
  const cardImagePath = str(block, /cardImagePath:"([^"]*)"/);

  return {
    id: `futgg-${eaId}-${pos}`.toLowerCase(),
    source: "FUT.GG",
    sourceUrl: url,
    sourceId: basePlayerEaId || eaId,
    itemId: eaId,
    name: decode(name),
    pos,
    role: roleFromPos(pos),
    nation: decode(nation),
    league: decode(league),
    club: decode(club),
    cardType: decode(rarity),
    image: imagePath ? `${assetBase}${imagePath}` : "",
    cardImage: cardImagePath ? `${assetBase}${cardImagePath}` : "",
    ovr: num(block, /overall:(\d+)/, 75),
    pac: stat(block, "facePace", "gkFaceDiving", 70),
    sho: stat(block, "faceShooting", "gkFaceHandling", 60),
    pas: stat(block, "facePassing", "gkFaceKicking", 60),
    dri: stat(block, "faceDribbling", "gkFaceReflexes", 60),
    def: stat(block, "faceDefending", "gkFaceSpeed", 50),
    phy: stat(block, "facePhysicality", "gkFacePositioning", 60),
    skillMoves: num(block, /skillMoves:(\d+)/, 0),
    weakFoot: num(block, /weakFoot:(\d+)/, 0),
    clutch: num(block, /overall:(\d+)/, 75)
  };
}

function str(text, regex) {
  return text.match(regex)?.[1] || "";
}

function num(text, regex, fallback = 0) {
  const value = Number(text.match(regex)?.[1]);
  return Number.isFinite(value) ? value : fallback;
}

function stat(text, outfieldKey, keeperKey, fallback) {
  const outfield = num(text, new RegExp(`${outfieldKey}:(\\d+)`), 0);
  if (outfield) return outfield;
  return num(text, new RegExp(`${keeperKey}:(\\d+)`), fallback);
}

function nestedName(text, key) {
  return str(text, new RegExp(`${key}:\\$R\\[\\d+\\]=\\{[\\s\\S]{0,800}?name:"([^"]*)"`));
}

function decode(value) {
  return String(value || "").replace(/\\u([\dA-Fa-f]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function posFromId(id) {
  return ({
    0: "GK",
    3: "RB",
    5: "CB",
    7: "LB",
    10: "CDM",
    12: "RM",
    14: "CM",
    16: "LM",
    18: "CAM",
    23: "RW",
    25: "ST",
    27: "LW"
  })[id] || "CM";
}

function roleFromPos(pos) {
  if (["ST", "CF"].includes(pos)) return "FRV";
  if (["LW", "RW", "LM", "RM"].includes(pos)) return "KNT";
  if (["LB", "RB", "LWB", "RWB"].includes(pos)) return "BEK";
  if (pos === "CB") return "STP";
  if (pos === "GK") return "KL";
  return "OS";
}
