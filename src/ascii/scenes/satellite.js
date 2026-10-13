// Contact: a satellite in orbit around the Earth, sending signal waves home.

import {
    castRegion,
    eulerMatrix,
    extentOf,
    multiply,
    normalize,
    project,
    screenCircle,
    smoothstep,
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
const LIGHT = normalize([0.3, 0.55, 0.75]);
// The dish turns left and partly toward the viewer, and sways a little. Then the whole satellite leans
// (roll), so the dish aims down and to the left.
const YAW = { base: Math.atan2(-0.55, -0.82), sway: 0.25, seconds: 16 };
const PITCH = 0.1;
const ROLL = Math.PI / 9;
// A wave leaves every `every` seconds and grows by `grow` dish radii per second, at most `most` at a time. It
// dims to `dim` of its strength by the far edge of the screen. The waves show only when the satellite's
// radius on screen, in px, is past `near`, so they fade in and out with the camera's trip.
const WAVES = { every: 2.2, grow: 0.45, spread: 0.6, most: 70, dim: 0.35, near: [80, 160] };

const frameAt = (yaw) => multiply(eulerMatrix(0, 0, ROLL), multiply(eulerMatrix(PITCH, 0, 0), eulerMatrix(0, yaw, 0)));

// The satellite's outline at rest, from its wing corners, dish rim and feed, in the scene's units.
function outline() {
    const frame = frameAt(YAW.base);
    const rim = DISH.k * DISH.far;
    const points = [[DISH.apex[0] + DISH.far + 1, 0, 0]];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) points.push([sx * WING.half, sy * WING.outer, 0]);
    for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2;
        points.push([DISH.apex[0] + DISH.far, Math.cos(a) * rim, Math.sin(a) * rim]);
    }
    return points.map((q) => transform(frame, q[0], q[1], q[2], [0, 0, 0]));
}

// Parts: 1 body, 2 to 5 the four panels of each wing, so their seams are outlined, 6 the dish.
export function createSatellite() {
    const o = [0, 0, 0];
    const d = [0, 0, 0];
    const n = [0, 0, 0];
    const hit = [0, 0, 0];
    const rim = { x: 0, y: 0, z: 0 };
    const ahead = { x: 0, y: 0, z: 0 };
    let frame = frameAt(YAW.base);

    function sample(origin, dir, out) {
        transformBack(frame, origin[0], origin[1], origin[2], o);
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

    // Arcs leave the dish along its axis on screen and grow slowly until they pass the far edge of the screen,
    // dimming as they go. They scale with the dish on screen, so they look the same at any zoom.
    function drawWaves(grid, cam, t, gain) {
        const at = transform(frame, DISH.apex[0] + DISH.far, 0, 0, [0, 0, 0]);
        const to = transform(frame, DISH.apex[0] + DISH.far + 1, 0, 0, [0, 0, 0]);
        if (!project(cam, at[0], at[1], at[2], rim) || !project(cam, to[0], to[1], to[2], ahead)) return;
        const dish = (DISH.k * DISH.far * cam.focal) / rim.z;
        const angle = Math.atan2(ahead.y - rim.y, ahead.x - rim.x);
        const reach = Math.hypot(Math.max(rim.x, grid.width - rim.x), Math.max(rim.y, grid.height - rim.y));
        const life = Math.min(WAVES.most * WAVES.every, (reach / dish - 1) / WAVES.grow);
        const newest = Math.floor(t / WAVES.every);
        for (let k = 0; k * WAVES.every < life; k++) {
            const age = t - newest * WAVES.every + k * WAVES.every;
            if (age >= life) continue;
            const radius = dish * (1 + age * WAVES.grow);
            const strength = gain * (1 - (1 - WAVES.dim) * Math.min(1, radius / reach));
            wave(grid, rim.x, rim.y, radius, angle, WAVES.spread, strength, newest - k);
        }
    }

    const points = outline();

    return {
        extent: extentOf(points),
        outline: points,
        center: [0, 0, 0],
        view: [0, 0.12, 1],
        render(grid, cam, { t, gain }) {
            frame = frameAt(YAW.base + YAW.sway * Math.sin((t * Math.PI * 2) / YAW.seconds));
            const c = screenCircle(cam, 0, 0, 0, BOUND);
            const near = c ? smoothstep(WAVES.near[0], WAVES.near[1], c.r) : 1;
            if (near > 0) drawWaves(grid, cam, t, gain * near);
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
