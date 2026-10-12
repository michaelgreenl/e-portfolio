// Shared pieces for drawing 3D objects into a grid of characters: math helpers, the character grid, a
// pinhole camera, and the drawing primitives the scenes use (points, lines, ray-cast objects, stars).

export const RAMP = ' .·:-=+*';
export const LAST = RAMP.length - 1;
const NEAR = 0.3;

// Outline characters, indexed by grid.edge.
export const EDGE_CHARS = ' -_/\\|()·';
const EDGE = { top: 1, bottom: 2, slash: 3, backslash: 4, bar: 5, open: 6, close: 7, dot: 8 };

// Line characters, indexed by grid.lineCode. Arcs use ( and ) where they run upright.
export const LINE_CHARS = ' -\\|/()';

/* ---------- Math ---------- */

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smoothstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
};
export const easeIn = (t) => t * t * t;
export const easeOut = (t) => 1 - (1 - t) ** 3;
export const normalize = (v) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
};

export function mulberry32(seed) {
    return () => {
        seed = (seed + 0x6d2b79f5) | 0;
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// 3x3 rotation from Euler angles in XYZ order, stored row by row.
export function eulerMatrix(x, y, z) {
    const [cx, sx, cy, sy, cz, sz] = [Math.cos(x), Math.sin(x), Math.cos(y), Math.sin(y), Math.cos(z), Math.sin(z)];
    return [
        cy * cz,
        -cy * sz,
        sy,
        cx * sz + sx * sy * cz,
        cx * cz - sx * sy * sz,
        -sx * cy,
        sx * sz - cx * sy * cz,
        sx * cz + cx * sy * sz,
        cx * cy,
    ];
}

export function multiply(a, b) {
    const m = new Array(9);
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) m[r * 3 + c] = a[r * 3] * b[c] + a[r * 3 + 1] * b[3 + c] + a[r * 3 + 2] * b[6 + c];
    }
    return m;
}

// m·v and mᵀ·v, written into out.
export function transform(m, x, y, z, out) {
    out[0] = m[0] * x + m[1] * y + m[2] * z;
    out[1] = m[3] * x + m[4] * y + m[5] * z;
    out[2] = m[6] * x + m[7] * y + m[8] * z;
    return out;
}
export function transformBack(m, x, y, z, out) {
    out[0] = m[0] * x + m[3] * y + m[6] * z;
    out[1] = m[1] * x + m[4] * y + m[7] * z;
    out[2] = m[2] * x + m[5] * y + m[8] * z;
    return out;
}

/* ---------- Character grid ---------- */

export function createGrid() {
    const grid = {
        cols: 0,
        rows: 0,
        cellW: 8,
        lineH: 16,
        width: 1,
        height: 1,
        resize(width, height, cellW, lineH) {
            Object.assign(grid, { width, height, cellW, lineH });
            grid.cols = Math.ceil(width / cellW);
            grid.rows = Math.ceil(height / lineH);
            const n = grid.cols * grid.rows;
            grid.lum = new Float32Array(n); // brightness from points, stars and glows
            grid.dens = new Float32Array(n); // point density before tone mapping
            grid.lines = new Float32Array(n); // grid line strength
            grid.lineCode = new Uint8Array(n);
            grid.lineFamily = new Uint8Array(n);
            grid.cover = new Float32Array(n); // share of a cell covered by a solid object
            grid.shade = new Float32Array(n); // lighting of the solid object in a cell
            grid.opacity = new Float32Array(n); // how far the solid object has faded in
            grid.depth = new Float32Array(n); // distance from the camera to the solid object
            grid.ident = new Uint8Array(n); // which solid object covers a cell
            grid.round = new Uint8Array(n); // 1 when that object's outline is drawn with ( and )
            grid.edge = new Uint8Array(n); // outline character, see EDGE_CHARS
            grid.octant = new Int8Array(n); // direction of an outline, for traceOutlines
        },
        clear() {
            for (const key of [
                'lum',
                'dens',
                'lines',
                'lineCode',
                'lineFamily',
                'cover',
                'shade',
                'opacity',
                'depth',
                'ident',
                'round',
                'edge',
            ]) {
                grid[key].fill(0);
            }
        },
    };
    grid.resize(1, 1, 8, 16);
    return grid;
}

/* ---------- Camera ---------- */

export const createCamera = () => ({
    px: 0,
    py: 0,
    pz: 0,
    fx: 0,
    fy: 0,
    fz: -1,
    rx: 1,
    rz: 0,
    ux: 0,
    uy: 1,
    uz: 0,
    focal: 1,
    cx: 0,
    cy: 0,
});

// Points the camera at target. shift moves the image of the target off the screen center, as a fraction
// of the screen size.
export function aim(cam, grid, pos, target, fovDeg, shift) {
    cam.px = pos[0];
    cam.py = pos[1];
    cam.pz = pos[2];
    const f = normalize([target[0] - pos[0], target[1] - pos[1], target[2] - pos[2]]);
    const rl = Math.hypot(f[2], f[0]) || 1;
    cam.fx = f[0];
    cam.fy = f[1];
    cam.fz = f[2];
    cam.rx = -f[2] / rl;
    cam.rz = f[0] / rl;
    cam.ux = -cam.rz * f[1];
    cam.uy = cam.rz * f[0] - cam.rx * f[2];
    cam.uz = cam.rx * f[1];
    cam.focal = grid.height / 2 / Math.tan((fovDeg * Math.PI) / 360);
    cam.cx = grid.width / 2 + shift[0] * grid.width;
    cam.cy = grid.height / 2 + shift[1] * grid.height;
}

// Unit ray direction through a screen point, written into out.
function rayDir(cam, sx, sy, out) {
    const a = (sx - cam.cx) / cam.focal;
    const b = (sy - cam.cy) / cam.focal;
    const x = cam.fx + cam.rx * a - cam.ux * b;
    const y = cam.fy - cam.uy * b;
    const z = cam.fz + cam.rz * a - cam.uz * b;
    const l = Math.hypot(x, y, z);
    out[0] = x / l;
    out[1] = y / l;
    out[2] = z / l;
}

// Screen position (px) and depth of a point, written into out; false when it is behind the camera.
export function project(cam, x, y, z, out) {
    const dx = x - cam.px;
    const dy = y - cam.py;
    const dz = z - cam.pz;
    const zc = dx * cam.fx + dy * cam.fy + dz * cam.fz;
    if (zc < NEAR) return false;
    const inv = cam.focal / zc;
    out.x = cam.cx + (dx * cam.rx + dz * cam.rz) * inv;
    out.y = cam.cy - (dx * cam.ux + dy * cam.uy + dz * cam.uz) * inv;
    out.z = zc;
    return true;
}

// Screen circle (px) that holds a sphere, or null when the sphere is behind the camera.
export function screenCircle(cam, cx, cy, cz, radius) {
    const p = {};
    if (!project(cam, cx, cy, cz, p) || p.z < radius + NEAR) return null;
    return { x: p.x, y: p.y, r: (radius * cam.focal) / Math.sqrt(Math.max(1e-6, p.z * p.z - radius * radius)) };
}

/* ---------- Points ---------- */

// Adds points [x, y, z, weight, ...] to the density buffer, spread over the cells around each point.
export function splatPoints(grid, cam, points, count, gain) {
    const { cols, rows, cellW, lineH, dens } = grid;
    for (let p = 0; p < count; p++) {
        const o = p * 4;
        const dx = points[o] - cam.px;
        const dy = points[o + 1] - cam.py;
        const dz = points[o + 2] - cam.pz;
        const zc = dx * cam.fx + dy * cam.fy + dz * cam.fz;
        if (zc < NEAR) continue;
        const inv = cam.focal / zc;
        const gx = (cam.cx + (dx * cam.rx + dz * cam.rz) * inv) / cellW - 0.5;
        const gy = (cam.cy - (dx * cam.ux + dy * cam.uy + dz * cam.uz) * inv) / lineH - 0.5;
        const x0 = Math.floor(gx);
        const y0 = Math.floor(gy);
        if (x0 < -1 || y0 < -1 || x0 >= cols || y0 >= rows) continue;
        const ax = gx - x0;
        const ay = gy - y0;
        const w = points[o + 3] * gain;
        const i = y0 * cols + x0;
        if (y0 >= 0) {
            if (x0 >= 0) dens[i] += w * (1 - ax) * (1 - ay);
            if (x0 + 1 < cols) dens[i + 1] += w * ax * (1 - ay);
        }
        if (y0 + 1 < rows) {
            if (x0 >= 0) dens[i + cols] += w * (1 - ax) * ay;
            if (x0 + 1 < cols) dens[i + cols + 1] += w * ax * ay;
        }
    }
}

// Density becomes brightness with a soft shoulder, so dense spots saturate instead of clipping.
export function toneDensity(grid) {
    const { dens, lum } = grid;
    for (let i = 0; i < dens.length; i++) {
        if (dens[i] > 0) {
            lum[i] += 1 - Math.exp(-dens[i]);
            dens[i] = 0;
        }
    }
}

/* ---------- Lines ---------- */

// Marks the cells along a screen segment (px) with a slope character. Cells crossed by both line families
// of a plane become '+'.
function rasterSegment(grid, x0, y0, x1, y1, strength, family) {
    const { width, height, cols, rows, cellW, lineH, lines, lineCode, lineFamily } = grid;
    if ((x0 < -width && x1 < -width) || (x0 > width * 2 && x1 > width * 2)) return;
    if ((y0 < -height && y1 < -height) || (y0 > height * 2 && y1 > height * 2)) return;
    let ang = Math.atan2(y1 - y0, x1 - x0);
    if (ang < 0) ang += Math.PI;
    const code =
        ang < Math.PI / 8 || ang >= (7 * Math.PI) / 8
            ? 1
            : ang < (3 * Math.PI) / 8
              ? 2
              : ang < (5 * Math.PI) / 8
                ? 3
                : 4;
    const gx0 = x0 / cellW;
    const gy0 = y0 / lineH;
    const gx1 = x1 / cellW;
    const gy1 = y1 / lineH;
    const steps = Math.min(600, Math.max(1, Math.ceil(Math.max(Math.abs(gx1 - gx0), Math.abs(gy1 - gy0)))));
    for (let s = 0; s <= steps; s++) {
        const f = s / steps;
        const cx = Math.floor(gx0 + (gx1 - gx0) * f);
        const cy = Math.floor(gy0 + (gy1 - gy0) * f);
        if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
        const i = cy * cols + cx;
        lineFamily[i] |= family;
        if (strength > lines[i]) {
            lines[i] = strength;
            lineCode[i] = code;
        }
    }
}

// Draws a polyline through scene points point(k) for k = 0..n, with strength strengthAt(k).
export function polyline(grid, cam, n, point, strengthAt, family) {
    const at = {};
    let hasPrev = false;
    let px = 0;
    let py = 0;
    let ps = 0;
    for (let k = 0; k <= n; k++) {
        const q = point(k);
        if (!q || !project(cam, q[0], q[1], q[2], at)) {
            hasPrev = false;
            continue;
        }
        const s = strengthAt(k);
        if (hasPrev && (s > 0.02 || ps > 0.02)) rasterSegment(grid, px, py, at.x, at.y, (s + ps) / 2, family);
        hasPrev = true;
        px = at.x;
        py = at.y;
        ps = s;
    }
}

// The x, y and z planes through a scene's center. They show only while the page changes: boost runs
// from 0 to 1 and back, and swing turns them about their vertical axis.
const PLANE_AXES = [
    [0, 2], // floor: x and z
    [0, 1], // wall: x and y
    [2, 1], // wall: z and y
];
export function drawPlanes(grid, cam, size, gain, swing, boost) {
    const LINES = 8;
    const SEGMENTS = 24;
    const strength = boost * gain * 0.5;
    if (strength < 0.01) return;
    const cs = Math.cos(swing);
    const sn = Math.sin(swing);
    const local = [0, 0, 0];
    const world = [0, 0, 0];
    const fadeAt = (u, v) => 1 - smoothstep(size * 0.25, size, Math.hypot(u, v));
    for (const [ia, ib] of PLANE_AXES) {
        for (let i = 0; i <= LINES; i++) {
            const fixed = -size + (i * size * 2) / LINES;
            for (let dir = 0; dir < 2; dir++) {
                const uv = (k) => {
                    const run = -size + (k * size * 2) / SEGMENTS;
                    return dir ? [fixed, run] : [run, fixed];
                };
                const point = (k) => {
                    const [u, v] = uv(k);
                    local[0] = local[1] = local[2] = 0;
                    local[ia] = u;
                    local[ib] = v;
                    world[0] = local[0] * cs + local[2] * sn;
                    world[1] = local[1];
                    world[2] = -local[0] * sn + local[2] * cs;
                    return world;
                };
                polyline(grid, cam, SEGMENTS, point, (k) => strength * fadeAt(...uv(k)), dir ? 2 : 1);
            }
        }
    }
}

// Draws a wave front on screen: part of a circle around (cx, cy) in px, moving right (side 1) or left
// (side -1), with spread radians above and below. One character per row: ( or ) where it runs upright,
// / and \ toward its ends, fading at the tips.
export function wave(grid, cx, cy, radius, side, spread, strength) {
    const { cols, rows, cellW, lineH, lines, lineCode } = grid;
    const reach = radius * Math.sin(spread);
    const y0 = Math.max(0, Math.floor((cy - reach) / lineH));
    const y1 = Math.min(rows - 1, Math.floor((cy + reach) / lineH));
    for (let y = y0; y <= y1; y++) {
        const dy = (y + 0.5) * lineH - cy;
        if (Math.abs(dy) > reach) continue;
        const x = Math.floor((cx + side * Math.sqrt(radius * radius - dy * dy)) / cellW);
        if (x < 0 || x >= cols) continue;
        const slant = Math.abs(dy) > radius * 0.42;
        const code = slant ? (dy < 0 === side < 0 ? 4 : 2) : side < 0 ? 5 : 6;
        const s = strength * (1 - 0.5 * (dy / reach) ** 2);
        const i = y * cols + x;
        if (s > lines[i]) {
            lines[i] = s;
            lineCode[i] = code;
        }
    }
}

/* ---------- Stars ---------- */

const STAR_COUNT = 2400;
const stars = (() => {
    const rand = mulberry32(42);
    const data = new Float32Array(STAR_COUNT * 5);
    for (let i = 0; i < STAR_COUNT; i++) {
        const z = rand() * 2 - 1;
        const a = rand() * Math.PI * 2;
        const s = Math.sqrt(1 - z * z);
        data.set([Math.cos(a) * s, z, Math.sin(a) * s, 0.12 + rand() ** 4 * 0.4, rand() * 100], i * 5);
    }
    return data;
})();

// Faint stars, infinitely far away: only the camera's direction moves them.
export function drawStars(grid, cam, t, gain) {
    const { cols, rows, cellW, lineH, lum } = grid;
    const used = Math.min(STAR_COUNT, Math.round(cols * rows * 0.25));
    for (let p = 0; p < used; p++) {
        const o = p * 5;
        const zc = stars[o] * cam.fx + stars[o + 1] * cam.fy + stars[o + 2] * cam.fz;
        if (zc < 0.05) continue;
        const inv = cam.focal / zc;
        const x = Math.floor((cam.cx + (stars[o] * cam.rx + stars[o + 2] * cam.rz) * inv) / cellW);
        const y = Math.floor(
            (cam.cy - (stars[o] * cam.ux + stars[o + 1] * cam.uy + stars[o + 2] * cam.uz) * inv) / lineH,
        );
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const b = stars[o + 3] * (0.8 + 0.2 * Math.sin(t * 0.9 + stars[o + 4])) * gain;
        const i = y * cols + x;
        if (b > lum[i]) lum[i] = b;
    }
}

/* ---------- Solid objects ---------- */

// Casts rays through every cell of a screen box, 2 x 2 samples per cell. sample(origin, dir, out) sets
// out.id (0 when the ray misses), out.shade (lighting, 0 to 1), out.depth (distance to the hit) and
// out.glow (light outside the object). rounded(id) says whether an object's outline uses ( and ).
export function castRegion(grid, cam, box, sample, gain, rounded) {
    const { cols, rows, cellW, lineH, cover, shade, opacity, depth, ident, round, lum } = grid;
    const x0 = Math.max(0, Math.floor(box.x0 / cellW));
    const x1 = Math.min(cols - 1, Math.ceil(box.x1 / cellW));
    const y0 = Math.max(0, Math.floor(box.y0 / lineH));
    const y1 = Math.min(rows - 1, Math.ceil(box.y1 / lineH));
    const origin = [cam.px, cam.py, cam.pz];
    const dir = [0, 0, 0];
    const out = { id: 0, shade: 0, depth: 0, glow: 0 };
    const ids = [0, 0, 0, 0];
    const lit = [0, 0, 0, 0];
    const far = [0, 0, 0, 0];
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            let hits = 0;
            let glow = 0;
            for (let s = 0; s < 4; s++) {
                rayDir(cam, (x + 0.25 + (s & 1) * 0.5) * cellW, (y + 0.25 + (s >> 1) * 0.5) * lineH, dir);
                out.id = 0;
                out.shade = 0;
                out.depth = 0;
                out.glow = 0;
                sample(origin, dir, out);
                ids[s] = out.id;
                lit[s] = out.shade;
                far[s] = out.depth;
                if (out.id) hits++;
                glow += out.glow;
            }
            const i = y * cols + x;
            if (glow) lum[i] += (glow / 4) * gain;
            if (!hits) continue;
            // The cell belongs to the object hit by most samples.
            let best = 0;
            let bestCount = 0;
            for (let s = 0; s < 4; s++) {
                if (!ids[s]) continue;
                let n = 0;
                for (let k = 0; k < 4; k++) if (ids[k] === ids[s]) n++;
                if (n > bestCount) {
                    best = ids[s];
                    bestCount = n;
                }
            }
            let sumLit = 0;
            let sumDepth = 0;
            for (let s = 0; s < 4; s++) {
                if (ids[s] !== best) continue;
                sumLit += lit[s];
                sumDepth += far[s];
            }
            cover[i] = hits / 4;
            shade[i] = sumLit / bestCount;
            depth[i] = sumDepth / bestCount;
            opacity[i] = gain;
            ident[i] = best;
            round[i] = rounded(best) ? 1 : 0;
        }
    }
}

// Marks the outermost cells of each object with an outline character that follows the edge: ( and ) or |
// on the sides, - on top, _ below, / and \ on the diagonals. An object gets an outline where it meets empty
// space or an object behind it, so a ring in front of a planet keeps its edge. Where several cells in a row
// would draw the same side, only the outermost one does, so lines stay one character thick.
const OUTWARD = [
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
];

export function traceOutlines(grid) {
    const { cols, rows, cellW, lineH, cover, depth, ident, round, edge, octant } = grid;
    // 1 where a cell holds the same object, or an object in front of it.
    const same = (x, y, id, near) => {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return 0;
        const j = y * cols + x;
        return cover[j] >= 0.5 && (ident[j] === id || depth[j] < near) ? 1 : 0;
    };
    octant.fill(-1);
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (cover[i] < 0.5) continue;
            const id = ident[i];
            const d = depth[i];
            if (same(x - 1, y, id, d) && same(x + 1, y, id, d) && same(x, y - 1, id, d) && same(x, y + 1, id, d))
                continue;
            // Sobel gradient of "same object", pointing into the object.
            const gx =
                same(x + 1, y - 1, id, d) +
                2 * same(x + 1, y, id, d) +
                same(x + 1, y + 1, id, d) -
                same(x - 1, y - 1, id, d) -
                2 * same(x - 1, y, id, d) -
                same(x - 1, y + 1, id, d);
            const gy =
                same(x - 1, y + 1, id, d) +
                2 * same(x, y + 1, id, d) +
                same(x + 1, y + 1, id, d) -
                same(x - 1, y - 1, id, d) -
                2 * same(x, y - 1, id, d) -
                same(x + 1, y - 1, id, d);
            if (!gx && !gy) {
                edge[i] = EDGE.dot;
                continue;
            }
            // Angle of the inward direction in screen pixels (y down), in eighths of a turn.
            const a = Math.atan2(gy / lineH, gx / cellW);
            octant[i] = ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8;
        }
    }
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const o = octant[i];
            if (o < 0) continue;
            // Skip this cell when the next cell outward draws the same side of the same object.
            const [dx, dy] = OUTWARD[o];
            const nx = dx ? x + dx : x;
            const ny = dx ? y : y + dy;
            if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) {
                const j = ny * cols + nx;
                const p = octant[j];
                if (
                    p >= 0 &&
                    ident[j] === ident[i] &&
                    (dx ? OUTWARD[p][0] === dx : OUTWARD[p][0] === 0 && OUTWARD[p][1] === dy)
                )
                    continue;
            }
            const side = round[i] ? (o === 0 ? EDGE.open : EDGE.close) : EDGE.bar;
            edge[i] = [side, EDGE.slash, EDGE.top, EDGE.backslash, side, EDGE.slash, EDGE.bottom, EDGE.backslash][o];
        }
    }
}

/* ---------- Free space ---------- */

// For every cell, the half width (in cells) of the largest box centered on it that holds no occupied cell,
// for boxes aspect times taller than wide (in cells). Found per row first, then per column.
export function freeDistance(occupied, w, h, aspect, out) {
    const rise = 1 / aspect;
    const across = new Float32Array(w * h); // distance to the nearest occupied cell in the same row
    for (let y = 0; y < h; y++) {
        let last = -Infinity;
        for (let x = 0; x < w; x++) {
            if (occupied[y * w + x]) last = x;
            across[y * w + x] = x - last;
        }
        last = Infinity;
        for (let x = w - 1; x >= 0; x--) {
            if (occupied[y * w + x]) last = x;
            across[y * w + x] = Math.min(across[y * w + x], last - x);
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            // A row k rows away limits the box once the box is tall enough to reach it.
            let best = across[y * w + x];
            for (let k = 1; k < h && k * rise < best; k++) {
                if (y - k >= 0) best = Math.min(best, Math.max(across[(y - k) * w + x], k * rise));
                if (y + k < h) best = Math.min(best, Math.max(across[(y + k) * w + x], k * rise));
            }
            out[y * w + x] = best;
        }
    }
    return out;
}
