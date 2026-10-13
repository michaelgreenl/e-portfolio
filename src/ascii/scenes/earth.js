// Home: the Earth, turning slowly.

import { castRegion, eulerMatrix, multiply, normalize, screenCircle, smoothstep, transformBack } from '../render.js';
import { sphere } from '../shapes.js';
import { landAt } from '../worldMap.js';

const RADIUS = 6;
const HALO = 1.06; // the atmosphere glows out to this share of the radius
const TILT = eulerMatrix(0.36, 0, -0.35); // the north pole leans toward the viewer and to the right
const LIGHT = normalize([-0.4, 0.35, 0.85]);
const DAY_SECONDS = 100;
const START = (-10 * Math.PI) / 180; // Africa and Europe face the viewer first
const LAND = 1;
const SEA = 0.24;
const ICE = 0.9;
const DEGREES = 180 / Math.PI;

export function createEarth() {
    const n = [0, 0, 0];
    const q = [0, 0, 0];
    let frame = TILT;

    function sample(o, d, out) {
        const t = sphere(o, d, 0, 0, 0, RADIUS, n);
        if (t === Infinity) {
            // Closest approach of the ray to the center; the lit limb glows.
            const along = -(o[0] * d[0] + o[1] * d[1] + o[2] * d[2]);
            const px = o[0] + d[0] * along;
            const py = o[1] + d[1] * along;
            const pz = o[2] + d[2] * along;
            const dist = Math.hypot(px, py, pz);
            if (along > 0 && dist < RADIUS * HALO) {
                const fall = 1 - (dist - RADIUS) / (RADIUS * (HALO - 1));
                const lit = Math.max(0, (px * LIGHT[0] + py * LIGHT[1] + pz * LIGHT[2]) / dist);
                out.glow = 0.3 * fall * fall * lit;
            }
            return;
        }
        // Latitude and longitude of the hit, in the Earth's own turning frame.
        transformBack(frame, n[0], n[1], n[2], q);
        const lat = Math.asin(q[1]) * DEGREES;
        const lon = Math.atan2(q[0], q[2]) * DEGREES;
        const ground = SEA + (LAND - SEA) * landAt(lat, lon);
        const albedo = Math.max(ground, ICE * smoothstep(72, 80, lat));
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        out.id = 1;
        out.depth = t;
        out.shade = albedo * (0.04 + 0.96 * lit ** 0.6);
    }

    return {
        extent: [RADIUS * HALO, RADIUS * HALO],
        center: [0, 0, 0],
        view: [0, 0, 1],
        render(grid, cam, { t, gain }) {
            frame = multiply(TILT, eulerMatrix(0, START + (t * Math.PI * 2) / DAY_SECONDS, 0));
            const c = screenCircle(cam, 0, 0, 0, RADIUS * HALO);
            // Close to the Earth, as next to the rocket or the satellite, its disk has no circle on screen,
            // so the whole screen is cast.
            if (!c && Math.hypot(cam.px, cam.py, cam.pz) <= RADIUS * HALO) return;
            const box = c
                ? { x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r }
                : { x0: 0, y0: 0, x1: grid.width, y1: grid.height };
            castRegion(grid, cam, box, sample, gain, () => true);
        },
    };
}
