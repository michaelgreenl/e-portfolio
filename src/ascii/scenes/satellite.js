// Contact: a satellite that sends signal waves toward the page content.

import {
    castRegion,
    eulerMatrix,
    multiply,
    normalize,
    project,
    screenCircle,
    transform,
    transformBack,
    wave,
} from '../render.js';
import { boxPlanes, cone, convex, sphere } from '../shapes.js';

// The satellite's body sits at the origin, with its solar wings above and below and its dish facing +x.
const BODY = boxPlanes([0, 0, 0], [0.95, 1.15, 0.95]);
const ARMS = [boxPlanes([0, 1.55, 0], [0.1, 0.42, 0.1]), boxPlanes([0, -1.55, 0], [0.1, 0.42, 0.1])];
const WING = { inner: 1.95, outer: 4.75, half: 1.15, thick: 0.07 };
const WINGS = [1, -1].map((s) =>
    boxPlanes([0, (s * (WING.inner + WING.outer)) / 2, 0], [WING.half, (WING.outer - WING.inner) / 2, WING.thick]),
);
const NECK = boxPlanes([1.15, 0, 0], [0.22, 0.22, 0.22]);
const DISH = { apex: [1.35, 0, 0], axis: [1, 0, 0], k: 1.9, near: 0.08, far: 0.95 };
const FEED = boxPlanes([2.3, 0, 0], [0.9, 0.05, 0.05]);
const HORN = boxPlanes([3.25, 0, 0], [0.1, 0.12, 0.12]);
// Spheres around the whole satellite, its middle part, and each wing, so most rays skip most parts.
const BOUND = 5;
const CORE = { x: 1, radius: 2.5 };
const WING_BOUND = { y: (WING.inner + WING.outer) / 2, radius: 1.85 };
// The dish side is the long side, so the satellite sits this far off the middle of its space, away from the
// page content, which leaves room on the dish side for the signal.
const OFFSET = 1.6;
const LIGHT = normalize([0.3, 0.55, 0.75]);
// The dish turns toward the page content and partly toward the viewer.
const YAW = { left: Math.atan2(-0.55, -0.82), right: Math.atan2(-0.55, 0.82), sway: 0.25, seconds: 16 };
const WAVES = { every: 0.9, life: 2.6, speed: 110, spread: 0.6 };

// Parts: 1 body, 2 to 5 the four panels of each wing, so their seams are outlined, 6 the dish.
export function createSatellite() {
    const o = [0, 0, 0];
    const d = [0, 0, 0];
    const n = [0, 0, 0];
    const hit = [0, 0, 0];
    const rim = { x: 0, y: 0, z: 0 };
    let frame = eulerMatrix(0, 0, 0);
    let offset = 0;

    function sample(origin, dir, out) {
        transformBack(frame, origin[0] - offset, origin[1], origin[2], o);
        transformBack(frame, dir[0], dir[1], dir[2], d);
        const b = o[0] * d[0] + o[1] * d[1] + o[2] * d[2];
        if (b * b - (o[0] * o[0] + o[1] * o[1] + o[2] * o[2] - BOUND * BOUND) < 0) return;

        let best = Infinity;
        let id = 0;
        const take = (t, part) => {
            if (t >= best) return false;
            best = t;
            id = part;
            hit[0] = n[0];
            hit[1] = n[1];
            hit[2] = n[2];
            return true;
        };
        if (sphere(o, d, CORE.x, 0, 0, CORE.radius, n) < best) {
            take(convex(o, d, BODY, n), 1);
            for (const arm of ARMS) take(convex(o, d, arm, n), 1);
            take(convex(o, d, NECK, n), 1);
            take(cone(o, d, DISH.apex, DISH.axis, DISH.k, DISH.near, DISH.far, n), 6);
            take(convex(o, d, FEED, n), 6);
            take(convex(o, d, HORN, n), 6);
        }
        for (let w = 0; w < WINGS.length; w++) {
            const side = w ? -1 : 1;
            if (sphere(o, d, 0, side * WING_BOUND.y, 0, WING_BOUND.radius, n) >= best) continue;
            if (!take(convex(o, d, WINGS[w], n), 2)) continue;
            // Which of the wing's 2 x 2 panels the ray hit.
            const x = o[0] + d[0] * best;
            const y = Math.abs(o[1] + d[1] * best);
            id = 2 + (x > 0 ? 1 : 0) + (y > WING_BOUND.y ? 2 : 0);
        }
        if (!id) return;

        transform(frame, hit[0], hit[1], hit[2], n);
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        const albedo = id === 1 ? 0.8 : id === 6 ? 0.95 : 0.7;
        out.id = id;
        out.depth = best;
        out.shade = albedo * (0.1 + 0.9 * lit ** 0.8);
    }

    // Arcs leave the dish toward the content, grow, and fade.
    function drawWaves(grid, cam, t, gain, facing) {
        const at = transform(frame, DISH.apex[0] + DISH.far, 0, 0, [0, 0, 0]);
        if (!project(cam, at[0] + offset, at[1], at[2], rim)) return;
        const start = (DISH.k * DISH.far * cam.focal) / rim.z;
        for (let k = 0; k * WAVES.every < WAVES.life; k++) {
            const age = (t % WAVES.every) + k * WAVES.every;
            const fade = 1 - age / WAVES.life;
            if (fade > 0) wave(grid, rim.x, rim.y, start + age * WAVES.speed, facing, WAVES.spread, fade * gain);
        }
    }

    return {
        extent: [3.1, 5],
        center: [0, 0, 0],
        view: [0, 0.12, 1],
        fit: { max: [0.2, 0.4], min: 110 },
        prefer: (u, v) => 1 + 0.15 * u - 0.3 * Math.abs(v - 0.5),
        planeSize: 10,
        render(grid, cam, { t, gain, facing }) {
            const yaw = (facing < 0 ? YAW.left : YAW.right) + YAW.sway * Math.sin((t * Math.PI * 2) / YAW.seconds);
            frame = multiply(eulerMatrix(0.1, 0, 0), eulerMatrix(0, yaw, 0));
            offset = -facing * OFFSET;
            drawWaves(grid, cam, t, gain, facing);
            const c = screenCircle(cam, offset, 0, 0, BOUND);
            if (!c) return;
            castRegion(
                grid,
                cam,
                { x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r },
                sample,
                gain,
                (id) => id === 6,
            );
        },
    };
}
