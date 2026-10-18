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

// Materials, so each part of an object can draw in its own color. Index 0 draws in the page's ink.
export const TINTS = [
    'ink',
    'sea',
    'forest',
    'grass',
    'olive',
    'tan',
    'sand',
    'ice',
    'air',
    'hull',
    'red',
    'metal',
    'glass',
    'flame',
    'zone',
    'belt',
    'pole',
    'spot',
    'io',
    'europa',
    'ganymede',
    'callisto',
    'accent',
];
export const TINT = Object.fromEntries(TINTS.map((name, k) => [name, k]));

/* ---------- Math ---------- */

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smoothstep = (a, b, x) => {
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
};
export const easeIn = (t) => t * t * t;
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
        // Set before each object draws: its scene units per world unit, for depth across objects, and the
        // first id of its parts, so parts of different objects never share an id.
        depthScale: 1,
        idBase: 0,
        // Material of the points and lines drawn next, see TINTS.
        paint: 0,
        resize(width, height, cellW, lineH, rows = Math.ceil(height / lineH)) {
            Object.assign(grid, { width, height, cellW, lineH, rows });
            grid.cols = Math.ceil(width / cellW);
            const n = grid.cols * grid.rows;
            grid.lum = new Float32Array(n); // brightness from points and glows
            grid.dens = new Float32Array(n); // point density before tone mapping
            grid.lines = new Float32Array(n); // line strength
            grid.lineCode = new Uint8Array(n);
            grid.star = new Uint8Array(n); // star character, see STAR_CHARS
            grid.starAlpha = new Float32Array(n);
            grid.front = new Uint8Array(n); // 1 where the speck in a cell is in front of everything else
            grid.cover = new Float32Array(n); // share of a cell covered by a solid object
            grid.shade = new Float32Array(n); // lighting of the solid object in a cell
            grid.opacity = new Float32Array(n); // how far the solid object has faded in
            grid.depth = new Float32Array(n); // distance from the camera to the solid object, in world units
            grid.ident = new Uint8Array(n); // which solid object covers a cell
            grid.round = new Uint8Array(n); // 1 when that object's outline is drawn with ( and )
            grid.edge = new Uint8Array(n); // outline character, see EDGE_CHARS
            grid.tint = new Uint8Array(n); // material of the solid object in a cell, see TINTS
            grid.glowTint = new Uint8Array(n); // material of the points, glow or line in a cell
            grid.octant = new Int8Array(n); // direction of an outline, for traceOutlines
        },
        clear() {
            for (const key of [
                'lum',
                'dens',
                'lines',
                'lineCode',
                'star',
                'starAlpha',
                'front',
                'cover',
                'shade',
                'opacity',
                'depth',
                'ident',
                'round',
                'edge',
                'tint',
                'glowTint',
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

// Half width and half height of points around the origin, as seen along z.
export const extentOf = (points) => [
    Math.max(...points.map((p) => Math.abs(p[0]))),
    Math.max(...points.map((p) => Math.abs(p[1]))),
];

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
    const { cols, rows, cellW, lineH, dens, glowTint, paint } = grid;
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
            if (x0 >= 0) {
                dens[i] += w * (1 - ax) * (1 - ay);
                glowTint[i] = paint;
            }
            if (x0 + 1 < cols) {
                dens[i + 1] += w * ax * (1 - ay);
                glowTint[i + 1] = paint;
            }
        }
        if (y0 + 1 < rows) {
            if (x0 >= 0) {
                dens[i + cols] += w * (1 - ax) * ay;
                glowTint[i + cols] = paint;
            }
            if (x0 + 1 < cols) {
                dens[i + cols + 1] += w * ax * ay;
                glowTint[i + cols + 1] = paint;
            }
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

// Line character for a direction on screen (radians, y down), indexed into LINE_CHARS: - \ | or /.
function slopeCode(angle) {
    let a = angle % Math.PI;
    if (a < 0) a += Math.PI;
    return a < Math.PI / 8 || a >= (7 * Math.PI) / 8 ? 1 : a < (3 * Math.PI) / 8 ? 2 : a < (5 * Math.PI) / 8 ? 3 : 4;
}

// Marks the cells along a screen segment (px) with a slope character.
function rasterSegment(grid, x0, y0, x1, y1, strength) {
    const { width, height, cols, rows, cellW, lineH, lines, lineCode, glowTint, paint } = grid;
    if ((x0 < -width && x1 < -width) || (x0 > width * 2 && x1 > width * 2)) return;
    if ((y0 < -height && y1 < -height) || (y0 > height * 2 && y1 > height * 2)) return;
    const code = slopeCode(Math.atan2(y1 - y0, x1 - x0));
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
        if (strength > lines[i]) {
            lines[i] = strength;
            lineCode[i] = code;
            glowTint[i] = paint;
        }
    }
}

// Draws a polyline through scene points point(k) for k = 0..n, with strength strengthAt(k).
export function polyline(grid, cam, n, point, strengthAt) {
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
        if (hasPrev && (s > 0.02 || ps > 0.02)) rasterSegment(grid, px, py, at.x, at.y, (s + ps) / 2);
        hasPrev = true;
        px = at.x;
        py = at.y;
        ps = s;
    }
}

// Draws a wave front on screen: an arc of the circle around (cx, cy) in px that travels toward angle
// (radians, y down), spread radians to each side, fading toward its tips. Where it runs upright it uses
// ( or ), so it bulges the way it travels.
// `seed` gives each wave its own uneven brightness along the arc, which moves with the wave.
export function wave(grid, cx, cy, radius, angle, spread, strength, seed) {
    const { cols, rows, cellW, lineH, lines, lineCode, glowTint, paint } = grid;
    // Steps of about half a cell along the arc.
    const step = Math.min(cellW, lineH) / 2;
    const steps = Math.ceil((radius * spread * 2) / step) + 1;
    for (let s = 0; s <= steps; s++) {
        const off = spread * ((2 * s) / steps - 1);
        const a = angle + off;
        const px = cx + radius * Math.cos(a);
        const py = cy + radius * Math.sin(a);
        // Where the front runs steeply, only the steps near the middle of a row draw, so it stays one
        // character wide.
        if (Math.abs(Math.cos(a)) > 0.5 && Math.abs(py - (Math.floor(py / lineH) + 0.5) * lineH) > step / 2) continue;
        const x = Math.floor(px / cellW);
        const y = Math.floor(py / lineH);
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        // The front runs across its direction of travel.
        let code = slopeCode(a + Math.PI / 2);
        if (code === 3) code = Math.cos(a) < 0 ? 5 : 6;
        const v = strength * (1 - 0.5 * (off / spread) ** 2) * (0.7 + 0.3 * Math.sin(off * 11 + seed * 2.4));
        const i = y * cols + x;
        if (v > lines[i]) {
            lines[i] = v;
            lineCode[i] = code;
            glowTint[i] = paint;
        }
    }
}

/* ---------- Stars ---------- */

// Star characters, faint to bright, then the speck for a small moon, indexed by grid.star.
export const STAR_CHARS = ' .·+*°';
const SPECK = 5;
const STAR_COUNT = 16000;
const STAR_DENSITY = 1.2e-4; // stars per square px, on every screen size
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

// Faint stars, infinitely far away: only the camera's direction moves them. Brighter stars get larger
// characters. One square px shows 1 / focal² steradians of sky, so this many stars over the whole sky keep
// the same density on every screen.
export function drawStars(grid, cam, t, gain) {
    const { cols, rows, cellW, lineH, star, starAlpha } = grid;
    const used = Math.min(STAR_COUNT, Math.round(STAR_DENSITY * 4 * Math.PI * cam.focal * cam.focal));
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
        const bright = stars[o + 3];
        const alpha = (0.2 + 0.8 * bright ** 0.8) * (0.8 + 0.2 * Math.sin(t * 0.9 + stars[o + 4])) * gain;
        const i = y * cols + x;
        if (alpha > starAlpha[i]) {
            starAlpha[i] = alpha;
            star[i] = bright < 0.2 ? 1 : bright < 0.3 ? 2 : bright < 0.42 ? 3 : 4;
        }
    }
}

// Small moons, too small to cast: points [x, y, z, ...], each one ° character. They show behind any solid
// object, or in front of everything when front is true.
export function drawSpecks(grid, cam, points, count, alpha, front = false) {
    const { cols, rows, cellW, lineH, star, starAlpha } = grid;
    const at = {};
    for (let p = 0; p < count; p++) {
        if (!project(cam, points[p * 3], points[p * 3 + 1], points[p * 3 + 2], at)) continue;
        const x = Math.floor(at.x / cellW);
        const y = Math.floor(at.y / lineH);
        if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
        const i = y * cols + x;
        if (front || alpha > starAlpha[i]) {
            starAlpha[i] = alpha;
            star[i] = SPECK;
            if (front) grid.front[i] = 1;
        }
    }
}

/* ---------- Solid objects ---------- */

// Casts rays through every cell of a screen box, 2 x 2 samples per cell. sample(origin, dir, out) sets
// out.id (0 when the ray misses), out.shade (lighting, 0 to 1), out.depth (distance to the hit) and
// out.glow (light outside the object), and may set out.tint (its material, see TINTS). rounded(id) says
// whether an object's outline uses ( and ).
export function castRegion(grid, cam, box, sample, gain, rounded) {
    const {
        cols,
        rows,
        cellW,
        lineH,
        cover,
        shade,
        opacity,
        depth,
        ident,
        round,
        tint,
        glowTint,
        lum,
        depthScale,
        idBase,
    } = grid;
    const x0 = Math.max(0, Math.floor(box.x0 / cellW));
    const x1 = Math.min(cols - 1, Math.ceil(box.x1 / cellW));
    const y0 = Math.max(0, Math.floor(box.y0 / lineH));
    const y1 = Math.min(rows - 1, Math.ceil(box.y1 / lineH));
    const origin = [cam.px, cam.py, cam.pz];
    const dir = [0, 0, 0];
    const out = { id: 0, shade: 0, depth: 0, glow: 0, tint: 0 };
    const ids = [0, 0, 0, 0];
    const tints = [0, 0, 0, 0];
    const lit = [0, 0, 0, 0];
    const far = [0, 0, 0, 0];
    for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
            let hits = 0;
            let glow = 0;
            let glowPaint = 0;
            for (let s = 0; s < 4; s++) {
                rayDir(cam, (x + 0.25 + (s & 1) * 0.5) * cellW, (y + 0.25 + (s >> 1) * 0.5) * lineH, dir);
                out.id = 0;
                out.shade = 0;
                out.depth = 0;
                out.glow = 0;
                out.tint = 0;
                sample(origin, dir, out);
                ids[s] = out.id;
                tints[s] = out.tint;
                lit[s] = out.shade;
                far[s] = out.depth;
                if (out.id) hits++;
                if (out.glow) {
                    glow += out.glow;
                    glowPaint = out.tint;
                }
            }
            const i = y * cols + x;
            if (glow) {
                lum[i] += (glow / 4) * gain;
                glowTint[i] = glowPaint;
            }
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
            let bestTint = 0;
            for (let s = 0; s < 4; s++) {
                if (ids[s] !== best) continue;
                sumLit += lit[s];
                sumDepth += far[s];
                bestTint = tints[s];
            }
            // A nearer object drawn earlier keeps the cell.
            const near = (sumDepth / bestCount) * depthScale;
            if (cover[i] >= 0.5 && depth[i] < near) continue;
            cover[i] = hits / 4;
            shade[i] = sumLit / bestCount;
            depth[i] = near;
            opacity[i] = gain;
            ident[i] = idBase + best;
            tint[i] = bestTint;
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

// The 8 cells around a cell, the 4 straight ones first.
const NEIGHBORS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
];

export function traceOutlines(grid) {
    const { cols, rows, cellW, lineH, cover, depth, ident, round, edge, octant } = grid;
    // 1 where a cell holds the same object, or an object in front of it. Past the screen edge the object
    // goes on, so it gets no outline there.
    const same = (x, y, id, near) => {
        if (x < 0 || y < 0 || x >= cols || y >= rows) return 1;
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
            const left = same(x - 1, y, id, d);
            const right = same(x + 1, y, id, d);
            const up = same(x, y - 1, id, d);
            const down = same(x, y + 1, id, d);
            if (left + right + up + down === 4) continue;
            // A cell open on one side only is on a straight run of the outline, such as the inner corner of a
            // step along a gentle curve, so it takes that side's straight character.
            if (left + right + up + down === 3) {
                octant[i] = !left ? 0 : !up ? 2 : !right ? 4 : 6;
                continue;
            }
            // Sobel gradient of "same object", pointing into the object.
            const gx =
                same(x + 1, y - 1, id, d) +
                2 * right +
                same(x + 1, y + 1, id, d) -
                same(x - 1, y - 1, id, d) -
                2 * left -
                same(x - 1, y + 1, id, d);
            const gy =
                same(x - 1, y + 1, id, d) +
                2 * down +
                same(x + 1, y + 1, id, d) -
                same(x - 1, y - 1, id, d) -
                2 * up -
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
    // The cells past the screen edge are unknown, so an outline cell on the edge takes the direction of the
    // outline next to it, inside the screen. The outline then runs on past the edge with the same character.
    const inside = (x, y) => x > 0 && y > 0 && x < cols - 1 && y < rows - 1;
    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            if (octant[i] < 0 || inside(x, y)) continue;
            for (const [dx, dy] of NEIGHBORS) {
                const j = (y + dy) * cols + x + dx;
                if (inside(x + dx, y + dy) && octant[j] >= 0 && ident[j] === ident[i]) {
                    octant[i] = octant[j];
                    break;
                }
            }
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
