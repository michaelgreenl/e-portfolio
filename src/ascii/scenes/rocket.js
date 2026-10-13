// Resume: a rocket in flight. Its flame grows and the dust streams past faster while the page scrolls, and it
// burns at full thrust while it lifts off or lands.

import {
    castRegion,
    clamp01,
    eulerMatrix,
    mulberry32,
    multiply,
    normalize,
    polyline,
    screenCircle,
    splatPoints,
    transform,
    transformBack,
} from '../render.js';
import { cone, convex, plane, tube } from '../shapes.js';

// The rocket stands on its nozzle at the origin, pointing up y.
const BODY_RADIUS = 1;
const BODY_BOTTOM = 0.8;
const BODY_TOP = 5.8;
const NOSE_TIP = 7.6;
const WINDOW = { y: 4.3, radius: 0.5, angle: Math.PI / 2 };
const FIN_ANGLES = [Math.PI / 2 + Math.PI / 3, Math.PI / 2 + Math.PI, Math.PI / 2 - Math.PI / 3];
const BOUND = { y: 3.4, radius: 4.8 }; // a sphere around the whole rocket
const LIGHT = normalize([0.6, 0.5, 0.65]);
const SPIN_SECONDS = 24;
const FLAME = { count: 240, idle: 1.4, boost: 5 }; // flame length in units, at rest and at full thrust
// All the dust shows when the rocket's bound is fullRadius px or more on screen.
const DUST = { count: 80, inner: 2.6, outer: 6.5, low: -8, high: 11, fullRadius: 200 };
const FULL_THRUST_SPEED = 1400; // px of scrolling per second that gives full thrust

const NOSE = { apex: [0, NOSE_TIP, 0], axis: [0, -1, 0], k: BODY_RADIUS / (NOSE_TIP - BODY_TOP) };
const NOZZLE = { apex: [0, 2.4, 0], axis: [0, -1, 0], k: 0.3125 }; // flares from radius 0.5 to 0.75

// A fin is a thin swept plate in the plane through the axis at angle a.
function finPlanes(a) {
    const out = [Math.cos(a), 0, Math.sin(a)];
    const side = [-Math.sin(a), 0, Math.cos(a)];
    const mix = (u, y) => [out[0] * u, y, out[2] * u];
    return [
        plane(mix(-1, 0), mix(0.85, 0)), // root, inside the body
        plane(mix(1, 0), mix(2.05, 0)), // tip
        plane(mix(-0.8, -1), mix(1, 0.8)), // lower edge, from (1, 0.8) to (2, 0)
        plane(mix(1.8, 1), mix(1, 3)), // leading edge, from (1, 3) to (2, 1.2)
        plane(side, [side[0] * 0.09, 0, side[2] * 0.09]),
        plane([-side[0], 0, -side[2]], [-side[0] * 0.09, 0, -side[2] * 0.09]),
    ].flat();
}

export function createRocket() {
    const fins = FIN_ANGLES.map(finPlanes);
    const rand = mulberry32(7);
    const flame = Array.from({ length: FLAME.count }, () => ({
        seed: rand(),
        angle: rand() * Math.PI * 2,
        radius: Math.sqrt(rand()),
        pace: 0.85 + rand() * 0.3,
    }));
    const flamePoints = new Float32Array(FLAME.count * 4);
    const dust = Array.from({ length: DUST.count }, () => {
        const a = rand() * Math.PI * 2;
        const r = DUST.inner + rand() * (DUST.outer - DUST.inner);
        return { x: Math.cos(a) * r, z: Math.sin(a) * r, y: rand() * (DUST.high - DUST.low) };
    });
    const dustPoints = new Float32Array(DUST.count * 4);

    const o = [0, 0, 0];
    const d = [0, 0, 0];
    const n = [0, 0, 0];
    const hit = [0, 0, 0];
    let frame = eulerMatrix(0, 0, 0);
    let lift = 0;
    let thrust = 0;
    let altitude = 0;
    let lastT = 0;

    function sample(origin, dir, out) {
        // Into the rocket's own frame.
        transformBack(frame, origin[0], origin[1] - lift, origin[2], o);
        transformBack(frame, dir[0], dir[1], dir[2], d);
        const by = o[1] - BOUND.y;
        const b = o[0] * d[0] + by * d[1] + o[2] * d[2];
        if (b * b - (o[0] * o[0] + by * by + o[2] * o[2] - BOUND.radius * BOUND.radius) < 0) return;

        let best = Infinity;
        let id = 0;
        let albedo = 1;
        const take = (t, part, color) => {
            if (t >= best) return false;
            best = t;
            id = part;
            albedo = color;
            hit[0] = n[0];
            hit[1] = n[1];
            hit[2] = n[2];
            return true;
        };
        if (take(tube(o, d, BODY_RADIUS, BODY_BOTTOM, BODY_TOP, n), 1, 0.7)) {
            // A round window on the body, outlined as its own part.
            const y = o[1] + d[1] * best;
            let da = Math.atan2(n[2], n[0]) - WINDOW.angle;
            da -= Math.round(da / (Math.PI * 2)) * Math.PI * 2;
            if (Math.hypot(da * BODY_RADIUS, y - WINDOW.y) < WINDOW.radius) {
                id = 4;
                albedo = 0.1;
            }
        }
        take(cone(o, d, NOSE.apex, NOSE.axis, NOSE.k, 0, NOSE_TIP - BODY_TOP, n), 1, 0.45);
        take(cone(o, d, NOZZLE.apex, NOZZLE.axis, NOZZLE.k, 1.6, 2.4, n), 3, 0.35);
        for (const planes of fins) take(convex(o, d, planes, n), 2, 0.55);
        if (!id) return;

        transform(frame, hit[0], hit[1], hit[2], n);
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        out.id = id;
        out.depth = best;
        out.shade = albedo * (0.08 + 0.92 * lit ** 0.8);
    }

    // Exhaust: points that stream from the nozzle and fade, each on its own loop, so no state is kept.
    function drawFlame(grid, cam, t, gain) {
        const length = FLAME.idle + FLAME.boost * thrust;
        const rate = 1.4 + 1.6 * thrust;
        const p = [0, 0, 0];
        for (let i = 0; i < FLAME.count; i++) {
            const f = flame[i];
            const cycle = f.seed + t * rate * f.pace;
            const phase = cycle - Math.floor(cycle);
            const r = 0.7 * (1 - phase) ** 0.6 * f.radius;
            transform(frame, Math.cos(f.angle) * r, -0.05 - phase * length * f.pace, Math.sin(f.angle) * r, p);
            flamePoints[i * 4] = p[0];
            flamePoints[i * 4 + 1] = p[1] + lift;
            flamePoints[i * 4 + 2] = p[2];
            flamePoints[i * 4 + 3] = 0.3 * (1 - phase) ** 1.2;
        }
        splatPoints(grid, cam, flamePoints, FLAME.count, gain);
    }

    // Dust in a column around the rocket, sliding down as the rocket climbs; fast enough, it draws streaks.
    // Only a share of the dust shows; the last point shown fades in, so the share can change smoothly.
    function drawDust(grid, cam, step, gain, share) {
        const span = DUST.high - DUST.low;
        const streak = step * 2.5;
        const shown = share * DUST.count;
        const at = [0, 0, 0];
        let used = 0;
        for (let i = 0; i < shown; i++) {
            const g = dust[i];
            const weight = Math.min(1, shown - i);
            const y = DUST.low + ((((g.y - altitude) % span) + span) % span);
            if (streak > 0.4) {
                const point = (k) => {
                    at[0] = g.x;
                    at[1] = y + k * streak;
                    at[2] = g.z;
                    return at;
                };
                polyline(grid, cam, 1, point, () => 0.45 * weight * gain);
            } else {
                dustPoints[used * 4] = g.x;
                dustPoints[used * 4 + 1] = y;
                dustPoints[used * 4 + 2] = g.z;
                dustPoints[used * 4 + 3] = 0.5 * weight;
                used++;
            }
        }
        splatPoints(grid, cam, dustPoints, used, gain);
    }

    return {
        // The frame holds the rocket and its flame at rest; at full thrust the flame reaches past it.
        extent: [2.4, (NOSE_TIP + FLAME.idle + 1) / 2],
        center: [0, (NOSE_TIP - FLAME.idle - 1) / 2, 0],
        view: [0.25, 0.12, 1],
        render(grid, cam, { t, gain, speed, burn }) {
            const dt = clamp01(t - lastT);
            lastT = t;
            // Thrust rises quickly with scrolling and settles slowly.
            const want = Math.max(burn, clamp01(speed / FULL_THRUST_SPEED));
            thrust += (want - thrust) * (1 - Math.exp(-dt / (want > thrust ? 0.15 : 0.8)));
            const climb = 0.6 + 14 * thrust;
            altitude += climb * dt;

            // Spin about its own axis, then lean a little.
            frame = multiply(
                eulerMatrix(0, 0, 0.03 * Math.sin(t * 0.7)),
                eulerMatrix(0, (t * Math.PI * 2) / SPIN_SECONDS, 0),
            );
            lift = 0.12 * Math.sin(t * 1.3);
            const c = screenCircle(cam, 0, BOUND.y + lift, 0, BOUND.radius);
            // A rocket that is small on screen gets less dust, so its dust is as sparse as a large rocket's.
            const share = c ? Math.min(1, (c.r / DUST.fullRadius) ** 2) : 1;
            drawDust(grid, cam, climb * 0.05, gain, share);
            drawFlame(grid, cam, t, gain);
            if (!c) return;
            castRegion(
                grid,
                cam,
                { x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r },
                sample,
                gain,
                (id) => id === 4,
            );
        },
    };
}
