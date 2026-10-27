// Builds the land map in src/ascii/worldMap.js from Natural Earth's land and lakes polygons (public domain):
//
//     node scripts/world-map.mjs ne_50m_land.geojson ne_50m_lakes.geojson
//
// The files are in https://github.com/nvkelso/natural-earth-vector/tree/master/geojson.
//
// Each cell of a STEP° grid is land when land covers at least half of it, measured on SUB × SUB samples per
// cell. An island that wins no cell that way still gets the cell it covers most when it is at least MIN_ISLAND
// of a cell, so Hawaii and Puerto Rico show.

import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/ascii/worldMap.js';
const STEP = 1;
const SUB = 8;
const MIN_ISLAND = 0.4;
const COLS = 360 / STEP;
const ROWS = 180 / STEP;
const W = COLS * SUB;
const H = ROWS * SUB;

const [landPath, lakesPath] = process.argv.slice(2);
if (!lakesPath) {
    console.error('usage: node scripts/world-map.mjs <land.geojson> <lakes.geojson>');
    process.exit(1);
}

// The rings of every polygon in a GeoJSON file, as [lon, lat] points.
function rings(path) {
    const out = [];
    for (const { geometry } of JSON.parse(readFileSync(path, 'utf8')).features) {
        const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        for (const polygon of polygons) out.push(...polygon);
    }
    return out;
}

// Sets the samples inside the rings to value, by the even-odd rule, one row of samples at a time.
function fill(samples, rings, value) {
    for (let j = 0; j < H; j++) {
        const lat = 90 - ((j + 0.5) * STEP) / SUB;
        const crossings = [];
        for (const ring of rings) {
            for (let k = 1; k < ring.length; k++) {
                const [x0, y0] = ring[k - 1];
                const [x1, y1] = ring[k];
                if (y0 > lat === y1 > lat) continue;
                crossings.push(x0 + ((lat - y0) * (x1 - x0)) / (y1 - y0));
            }
        }
        crossings.sort((a, b) => a - b);
        for (let k = 0; k + 1 < crossings.length; k += 2) {
            const from = Math.max(0, Math.ceil(((crossings[k] + 180) * SUB) / STEP - 0.5));
            const to = Math.min(W - 1, Math.floor(((crossings[k + 1] + 180) * SUB) / STEP - 0.5));
            if (to >= from) samples.fill(value, j * W + from, j * W + to + 1);
        }
    }
}

const samples = new Uint8Array(W * H);
fill(samples, rings(landPath), 1);
fill(samples, rings(lakesPath), 0);

// Land samples in each cell.
const counts = new Uint16Array(COLS * ROWS);
for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
        if (samples[j * W + i]) counts[Math.floor(j / SUB) * COLS + Math.floor(i / SUB)]++;
    }
}
const land = Uint8Array.from(counts, (n) => (n * 2 >= SUB * SUB ? 1 : 0));

// Each island, as the connected land samples, with how many samples it has in each cell. An island large
// enough that has no land cell gets its fullest cell.
const seen = new Uint8Array(W * H);
for (let start = 0; start < W * H; start++) {
    if (!samples[start] || seen[start]) continue;
    const cells = new Map();
    const stack = [start];
    seen[start] = 1;
    let size = 0;
    while (stack.length) {
        const at = stack.pop();
        const i = at % W;
        const j = (at - i) / W;
        const cell = Math.floor(j / SUB) * COLS + Math.floor(i / SUB);
        cells.set(cell, (cells.get(cell) || 0) + 1);
        size++;
        for (const next of [j * W + ((i + 1) % W), j * W + ((i + W - 1) % W), at + W, at - W]) {
            if (next >= 0 && next < W * H && samples[next] && !seen[next]) {
                seen[next] = 1;
                stack.push(next);
            }
        }
    }
    if (size < MIN_ISLAND * SUB * SUB || [...cells.keys()].some((cell) => land[cell])) continue;
    land[[...cells.entries()].sort((a, b) => b[1] - a[1])[0][0]] = 1;
}

// One bit per cell, from the lowest bit of each byte, as base64 in lines that fit the file.
const bytes = new Uint8Array(Math.ceil(land.length / 8));
land.forEach((bit, k) => (bytes[k >> 3] |= bit << (k & 7)));
const lines = Buffer.from(bytes)
    .toString('base64')
    .match(/.{1,104}/g);
const literal = `const LAND = {
    step: ${STEP},
    bits:
${lines.map((line) => `        '${line}'`).join(' +\n')},
};
`;

const source = readFileSync(FILE, 'utf8');
const from = source.indexOf('const LAND = {');
const to = source.indexOf('};\n', from) + 3;
if (from < 0 || to < 3) throw new Error(`${FILE} has no LAND literal to replace`);
writeFileSync(FILE, source.slice(0, from) + literal + source.slice(to));
console.log(`${FILE}: ${land.reduce((a, b) => a + b, 0)} land cells of ${land.length}, ${bytes.length} bytes`);
