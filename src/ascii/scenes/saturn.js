// Home: Saturn and its rings, with a small moon in orbit.

import { castRegion, eulerMatrix, normalize, screenCircle, transform, transformBack } from '../render.js';
import { sphere } from '../shapes.js';

const RADIUS = 5;
const FLATTEN = 0.9; // polar radius over equatorial radius
const RING_INNER = 6.6;
const RING_OUTER = 9.6;
const TILT = eulerMatrix(0.62, 0, 0.42); // the rings open toward the viewer and rise to the right
const LIGHT = normalize([-0.55, 0.35, 0.76]);
const MOON_RADIUS = 0.9;
const MOON_ORBIT = 10.8;
const MOON_SECONDS = 48;

// Ring brightness by radius: the bright B ring, the dark Cassini division, then the dimmer A ring.
const ringAt = (r) => (r < 8.4 ? 0.6 : r < 8.65 ? 0.15 : 0.42);

// Half width and half height of the system on screen, the moon's orbit included.
function measure() {
    const p = [0, 0, 0];
    let x = RADIUS;
    let y = RADIUS;
    for (let k = 0; k < 64; k++) {
        const a = (k / 64) * Math.PI * 2;
        transform(TILT, Math.cos(a) * MOON_ORBIT, 0, Math.sin(a) * MOON_ORBIT, p);
        x = Math.max(x, Math.abs(p[0]) + MOON_RADIUS);
        y = Math.max(y, Math.abs(p[1]) + MOON_RADIUS);
    }
    return [x, y];
}

export function createSaturn() {
    const light = transformBack(TILT, LIGHT[0], LIGHT[1], LIGHT[2], [0, 0, 0]); // in the planet's frame
    const ob = [0, 0, 0];
    const db = [0, 0, 0];
    const n = [0, 0, 0];
    const moon = [0, 0, 0];

    function sample(o, d, out) {
        transformBack(TILT, o[0], o[1], o[2], ob);
        transformBack(TILT, d[0], d[1], d[2], db);
        let best = Infinity;

        // Planet: a sphere squashed along its axis, with faint bands and the rings' shadow.
        const ay = db[1] / FLATTEN;
        const py = ob[1] / FLATTEN;
        const a = db[0] * db[0] + ay * ay + db[2] * db[2];
        const b = ob[0] * db[0] + py * ay + ob[2] * db[2];
        const h = b * b - a * (ob[0] * ob[0] + py * py + ob[2] * ob[2] - RADIUS * RADIUS);
        if (h >= 0) {
            const t = (-b - Math.sqrt(h)) / a;
            if (t > 0) {
                const hx = ob[0] + db[0] * t;
                const hy = ob[1] + db[1] * t;
                const hz = ob[2] + db[2] * t;
                const nx = hx;
                const ny = hy / (FLATTEN * FLATTEN);
                const nz = hz;
                const lit = Math.max(0, (nx * light[0] + ny * light[1] + nz * light[2]) / Math.hypot(nx, ny, nz));
                const v = hy / (RADIUS * FLATTEN);
                const bands = 0.8 + 0.2 * Math.sin(v * 9 + Math.sin(v * 4) * 0.8);
                let shadow = 1;
                const s = -hy / light[1];
                if (s > 0) {
                    const r = Math.hypot(hx + light[0] * s, hz + light[2] * s);
                    if (r > RING_INNER && r < RING_OUTER) shadow = 1 - 0.7 * ringAt(r);
                }
                best = t;
                out.id = 1;
                out.depth = t;
                out.shade = 0.04 + 0.96 * lit ** 0.7 * bands * shadow;
            }
        }

        // Rings: the planet's equatorial plane, dark where the planet blocks the light.
        const t = -ob[1] / db[1];
        if (t > 0 && t < best) {
            const x = ob[0] + db[0] * t;
            const z = ob[2] + db[2] * t;
            const r = Math.hypot(x, z);
            if (r > RING_INNER && r < RING_OUTER) {
                const along = x * light[0] + z * light[2];
                const shadowed = along < 0 && along * along > r * r - RADIUS * RADIUS;
                best = t;
                out.id = 2;
                out.depth = t;
                out.shade = ringAt(r) * (shadowed ? 0.12 : 1);
            }
        }

        const tm = sphere(o, d, moon[0], moon[1], moon[2], MOON_RADIUS, n);
        if (tm < best) {
            out.id = 3;
            out.depth = tm;
            out.shade = 0.06 + 0.94 * Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]) ** 0.7;
        }
    }

    return {
        extent: measure(),
        center: [0, 0, 0],
        view: [0, 0, 1],
        fit: { max: [0.25, 0.3], min: 80 },
        prefer: (u, v) => 1 + 0.2 * u - 0.3 * Math.abs(v - 0.45),
        planeSize: RING_OUTER * 1.6,
        render(grid, cam, { t, gain }) {
            const a = (t * Math.PI * 2) / MOON_SECONDS + 2.2;
            transform(TILT, Math.cos(a) * MOON_ORBIT, 0, Math.sin(a) * MOON_ORBIT, moon);
            const c = screenCircle(cam, 0, 0, 0, MOON_ORBIT + MOON_RADIUS);
            if (!c) return;
            castRegion(
                grid,
                cam,
                { x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r },
                sample,
                gain,
                () => true,
            );
        },
    };
}
