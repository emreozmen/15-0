import fs from "node:fs";
import path from "node:path";

const input = process.argv[2];
const output = process.argv[3] || "prototype/data/cards.json";

if (!input) {
  console.error("Usage: node tools/import-fc-cards.mjs <cards.csv|cards.json> [output.json]");
  process.exit(1);
}

const raw = fs.readFileSync(input, "utf8");
const ext = path.extname(input).toLowerCase();
const rows = ext === ".json" ? JSON.parse(raw) : parseCsv(raw);
const cards = rows.map(normalizeCard).filter(card => card.name && card.pos);

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Wrote ${cards.length} cards to ${output}`);

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  const headers = splitCsvLine(lines.shift()).map(header => header.trim());
  return lines.map(line => {
    const values = splitCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function splitCsvLine(line) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells;
}

function normalizeCard(row) {
  const pos = pick(row, ["pos", "position", "Position"]).toUpperCase();
  const rating = number(pick(row, ["ovr", "rating", "Rating", "overall", "Overall"]), 75);
  return {
    id: slug(pick(row, ["id", "resource_id", "name", "Name", "player"]) || `${pick(row, ["Name", "name"])}-${pos}-${rating}`),
    name: pick(row, ["name", "Name", "player", "Player"]),
    pos,
    nation: pick(row, ["nation", "Nation", "country", "Country"]),
    league: pick(row, ["league", "League"]),
    club: pick(row, ["club", "Club", "team", "Team"]),
    cardType: pick(row, ["cardType", "version", "Version", "rarity", "Rarity"]) || "Gold",
    image: pick(row, ["image", "cardImage", "img", "photo"]),
    ovr: rating,
    pac: number(pick(row, ["pac", "PAC", "pace", "Pace"]), 70),
    sho: number(pick(row, ["sho", "SHO", "shooting", "Shooting"]), 60),
    pas: number(pick(row, ["pas", "PAS", "passing", "Passing"]), 60),
    dri: number(pick(row, ["dri", "DRI", "dribbling", "Dribbling"]), 60),
    def: number(pick(row, ["def", "DEF", "defending", "Defending"]), 50),
    phy: number(pick(row, ["phy", "PHY", "physical", "Physicality"]), 60),
    clutch: number(pick(row, ["clutch", "composure", "Composure"]), rating)
  };
}

function pick(row, keys) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return String(row[key]).trim();
  }
  return "";
}

function number(value, fallback) {
  const parsed = Number(String(value).replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
