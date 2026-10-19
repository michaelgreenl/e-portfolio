// Projects: Jupiter and its moons. The four large moons orbit far across the page, in front of the planet and
// behind it, and their shadows cross its clouds. The four small inner moons circle close to it, and specks for
// the many small outer moons drift all around. Orbits are squeezed so the moons stay near the page, and the
// view sways slowly, so the orbits open and close.

import {
    TINT,
    castRegion,
    drawSpecks,
    eulerMatrix,
    mulberry32,
    multiply,
    normalize,
    screenCircle,
    smoothstep,
    transform,
    transformBack,
} from '../render.js';
import { sphere } from '../shapes.js';

const RADIUS = 5;
const FLATTEN = 0.935; // polar radius over equatorial radius
// The north pole leans toward the viewer by `lean` radians, plus or minus `sway` over `seconds`. The lean is
// largest when the camera arrives, so the moons' orbits are open widest.
const VIEW = { lean: 0.13, sway: 0.06, seconds: 90, roll: -0.05 };
const LIGHT = normalize([-0.45, 0.2, 0.87]);
const DAY_SECONDS = 50; // one turn of the clouds
const IO_SECONDS = 30; // one orbit of Io; the other large moons keep Io's real ratios
const SPOT = { lat: -0.375, width: 0.34, height: 0.085 }; // the Great Red Spot, in longitude and latitude
// The moons' distances along the line of sight shrink to this share, as in a telescope view, so a moon that
// passes near the camera does not swell. This puts a moon on the near side inside the planet's depth, so
// any moon nearer the camera than the planet's center is drawn in front of the planet.
const DEPTH = 0.15;
const TAU = Math.PI * 2;

// The large moons: orbit radius and size in Jupiter radii, orbit time relative to Io, surface brightness,
// material, and where each is on its orbit when the camera arrives. Then Io is beside the planet, up and to the
// right, and Callisto is far to the left, which wide screens show. Europa and Ganymede cross low in front of the
// planet, which phones show below the header.
const MOONS = [
    { orbit: 2.4, size: 0.17, period: 1, albedo: 0.85, start: 5.26, tint: TINT.io }, // Io
    { orbit: 3.2, size: 0.15, period: 2.007, albedo: 0.95, start: 1.66, tint: TINT.europa }, // Europa
    { orbit: 4.3, size: 0.22, period: 4.044, albedo: 0.7, start: 1.48, tint: TINT.ganymede }, // Ganymede
    { orbit: 6, size: 0.2, period: 9.433, albedo: 0.5, start: 4.01, tint: TINT.callisto }, // Callisto
];
// The small inner moons, Metis, Adrastea, Amalthea and Thebe: orbit radius in Jupiter radii and orbit time in
// seconds, slower than real.
const INNER = [
    { orbit: 1.45, seconds: 11, start: 0.7 },
    { orbit: 1.5, seconds: 11.5, start: 3.9 },
    { orbit: 1.85, seconds: 15, start: 2.2 },
    { orbit: 2.2, seconds: 19, start: 5.1 },
];
// The small outer moons: how many, the range of their orbit radii in Jupiter radii, and their orbit times in
// seconds, from the nearest to the farthest. Most go round the wrong way, as the real ones do.
const OUTER = { count: 10, near: 3.2, far: 11, seconds: [200, 520], backward: 0.75 };
const SPECK_ALPHA = 0.3;

// Cloud brightness by latitude (v, about its sine) and longitude: bright zones and dark belts with wavy edges,
// and darker poles. The material goes in out.tint.
function cloudsAt(v, lon, out) {
    const u = v + 0.025 * Math.sin(lon * 6 + v * 11) + 0.015 * Math.sin(lon * 13 - v * 31);
    const a = Math.abs(u);
    const band = a < 0.11 ? 0.92 : a < 0.3 ? 0.53 : a < 0.42 ? 0.88 : a < 0.53 ? 0.66 : a < 0.63 ? 0.82 : 0.62;
    out.tint = a > 0.7 ? TINT.pole : band > 0.8 ? TINT.zone : TINT.belt;
    return band * (1 - 0.25 * smoothstep(0.65, 0.95, a));
}

const nearerThanCenter = (cam, p) =>
    (p[0] - cam.px) ** 2 + (p[1] - cam.py) ** 2 + (p[2] - cam.pz) ** 2 < cam.px ** 2 + cam.py ** 2 + cam.pz ** 2;

// The outer moons' orbits: each turns a circle in the planet's equator to its own tilt.
function outerOrbits() {
    const rand = mulberry32(11);
    return Array.from({ length: OUTER.count }, () => {
        const backward = rand() < OUTER.backward;
        const tilt = backward ? Math.PI - (0.2 + rand() * 0.45) : 0.4 + rand() * 0.5;
        const share = rand();
        return {
            frame: multiply(eulerMatrix(0, rand() * TAU, 0), eulerMatrix(tilt, 0, 0)),
            orbit: (OUTER.near + share * (OUTER.far - OUTER.near)) * RADIUS,
            seconds: OUTER.seconds[0] + share * (OUTER.seconds[1] - OUTER.seconds[0]),
            start: rand() * TAU,
        };
    });
}

export function createJupiter() {
    const outer = outerOrbits();
    const moons = MOONS.map((m, k) => ({ ...m, id: 3 + k, at: [0, 0, 0], local: [0, 0, 0], radius: m.size * RADIUS }));
    const behind = new Float32Array((INNER.length + OUTER.count) * 3);
    const inFront = new Float32Array(behind.length);
    const light = [0, 0, 0]; // in the planet's frame
    const ob = [0, 0, 0];
    const db = [0, 0, 0];
    const n = [0, 0, 0];
    const p = [0, 0, 0];
    let view = eulerMatrix(VIEW.lean, 0, VIEW.roll);
    let spin = 0;
    let current = moons[0];

    // Planet: a sphere squashed along its axis, with belts, the Great Red Spot, and the moons' shadows.
    function sample(o, d, out) {
        transformBack(view, o[0], o[1], o[2], ob);
        transformBack(view, d[0], d[1], d[2], db);
        const ay = db[1] / FLATTEN;
        const py = ob[1] / FLATTEN;
        const a = db[0] * db[0] + ay * ay + db[2] * db[2];
        const b = ob[0] * db[0] + py * ay + ob[2] * db[2];
        const h = b * b - a * (ob[0] * ob[0] + py * py + ob[2] * ob[2] - RADIUS * RADIUS);
        if (h < 0) return;
        const t = (-b - Math.sqrt(h)) / a;
        if (t <= 0) return;
        const hx = ob[0] + db[0] * t;
        const hy = ob[1] + db[1] * t;
        const hz = ob[2] + db[2] * t;
        const ny = hy / (FLATTEN * FLATTEN);
        const lit = Math.max(0, (hx * light[0] + ny * light[1] + hz * light[2]) / Math.hypot(hx, ny, hz));
        const v = hy / (RADIUS * FLATTEN);
        const lon = Math.atan2(hz, hx) - spin;
        const off = Math.atan2(Math.sin(lon), Math.cos(lon));
        const spot = Math.hypot(off / SPOT.width, (v - SPOT.lat) / SPOT.height);
        // A point is in a moon's shadow when the way to the sun from it passes through the moon.
        let shadow = 1;
        for (const m of moons) {
            const lx = m.local[0] - hx;
            const ly = m.local[1] - hy;
            const lz = m.local[2] - hz;
            const along = lx * light[0] + ly * light[1] + lz * light[2];
            if (along > 0 && lx * lx + ly * ly + lz * lz - along * along < m.radius * m.radius) shadow = 0.12;
        }
        out.id = spot < 1 ? 2 : 1;
        out.depth = t;
        // The spot is darker than the zone around it, with a paler middle.
        out.tint = TINT.spot;
        const albedo = spot < 1 ? 0.34 + 0.3 * (1 - spot) ** 2 : cloudsAt(v, lon, out);
        out.shade = albedo * (0.05 + 0.95 * lit ** 0.7) * shadow;
    }

    // A large moon: a mottled sphere that keeps one face to Jupiter.
    function sampleMoon(o, d, out) {
        const m = current;
        const t = sphere(o, d, m.at[0], m.at[1], m.at[2], m.radius, n);
        if (t === Infinity) return;
        transformBack(view, n[0], n[1], n[2], p);
        const c = Math.cos(m.angle);
        const s = Math.sin(m.angle);
        const x = c * p[0] + s * p[2];
        const z = c * p[2] - s * p[0];
        const mottle = 0.82 + 0.18 * Math.sin(5 * x + 3 * Math.sin(4 * p[1])) * Math.sin(4 * z + 2 * p[1]);
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        out.id = m.id;
        out.tint = m.tint;
        // Nearer than the planet by its radius, so it is in front of every part of the planet.
        out.depth = m.front ? t - RADIUS : t;
        out.shade = m.albedo * mottle * (0.06 + 0.94 * lit ** 0.7);
    }

    const cast = (grid, cam, c, fn, gain) =>
        castRegion(grid, cam, { x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r }, fn, gain, () => true);

    return {
        // The frame holds the planet; the moons reach far past it.
        extent: [1.25 * RADIUS, 1.15 * RADIUS],
        center: [0, 0, 0],
        view: [0, 0, 1],
        render(grid, cam, { t, gain }) {
            view = eulerMatrix(VIEW.lean + VIEW.sway * Math.cos((t * TAU) / VIEW.seconds), 0, VIEW.roll);
            transformBack(view, LIGHT[0], LIGHT[1], LIGHT[2], light);
            spin = (t * TAU) / DAY_SECONDS;

            for (const m of moons) {
                m.angle = m.start + (t * TAU) / (IO_SECONDS * m.period);
                const r = m.orbit * RADIUS;
                transform(view, Math.cos(m.angle) * r, 0, Math.sin(m.angle) * r, m.at);
                m.at[2] *= DEPTH;
                m.front = nearerThanCenter(cam, m.at);
                transformBack(view, m.at[0], m.at[1], m.at[2], m.local);
            }

            let behindCount = 0;
            let frontCount = 0;
            const addSpeck = () => {
                if (nearerThanCenter(cam, p)) inFront.set(p, frontCount++ * 3);
                else behind.set(p, behindCount++ * 3);
            };
            for (const m of INNER) {
                const a = m.start + (t * TAU) / m.seconds;
                transform(view, Math.cos(a) * m.orbit * RADIUS, 0, Math.sin(a) * m.orbit * RADIUS, p);
                p[2] *= DEPTH;
                addSpeck();
            }
            for (const m of outer) {
                const a = m.start + (t * TAU) / m.seconds;
                transform(m.frame, Math.cos(a) * m.orbit, 0, Math.sin(a) * m.orbit, p);
                transform(view, p[0], p[1], p[2], p);
                p[2] *= DEPTH;
                addSpeck();
            }
            drawSpecks(grid, cam, behind, behindCount, SPECK_ALPHA * gain);
            drawSpecks(grid, cam, inFront, frontCount, SPECK_ALPHA * gain, true);

            const c = screenCircle(cam, 0, 0, 0, RADIUS);
            if (c) cast(grid, cam, c, sample, gain);
            for (const m of moons) {
                const mc = screenCircle(cam, m.at[0], m.at[1], m.at[2], m.radius);
                if (!mc) continue;
                current = m;
                cast(grid, cam, mc, sampleMoon, gain);
            }
        },
    };
}
