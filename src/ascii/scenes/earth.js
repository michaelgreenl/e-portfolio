// Home: the Earth, turning slowly.

import {
    TINT,
    castRegion,
    eulerMatrix,
    fbm,
    multiply,
    normalize,
    screenCircle,
    smoothstep,
    transformBack,
} from '../render.js';
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
const POLAR = 64; // land past this latitude, north or south, reads as ice
// The land's materials come from a map on a grid of this many degrees, made once.
const MAP_STEP = 2;
const MAP_COLS = 360 / MAP_STEP;
const MAP_ROWS = 180 / MAP_STEP;

// Calls fn(q, lat, index) for the middle of each map cell, with q the point on the unit sphere.
function eachCell(fn) {
    const q = [0, 0, 0];
    for (let row = 0; row < MAP_ROWS; row++) {
        const lat = 90 - (row + 0.5) * MAP_STEP;
        for (let col = 0; col < MAP_COLS; col++) {
            const lon = -180 + (col + 0.5) * MAP_STEP;
            const c = Math.cos(lat / DEGREES);
            q[0] = c * Math.sin(lon / DEGREES);
            q[1] = Math.sin(lat / DEGREES);
            q[2] = c * Math.cos(lon / DEGREES);
            fn(q, lat, row * MAP_COLS + col);
        }
    }
}

// Land material by climate: rainforest near the equator, savanna, desert in the subtropics, steppe, green
// temperate land and dark boreal forest. Noise moves the bands about and mixes wetter and drier land in.
function landMap() {
    const map = new Uint8Array(MAP_COLS * MAP_ROWS);
    eachCell((q, lat, i) => {
        const band = Math.abs(lat) + 30 * (fbm(q[0] * 2 + 7, q[1] * 2, q[2] * 2, 2) - 0.5);
        const wet = fbm(q[0] * 4, q[1] * 4 + 3, q[2] * 4, 3);
        let tint;
        if (band < 10) tint = wet > 0.42 ? TINT.forest : TINT.grass;
        else if (band < 18) tint = wet > 0.55 ? TINT.grass : TINT.olive;
        else if (band < 32) tint = wet > 0.62 ? TINT.olive : wet > 0.48 ? TINT.tan : TINT.sand;
        else if (band < 40) tint = wet > 0.5 ? TINT.olive : TINT.tan;
        else if (band < 54) tint = wet > 0.42 ? TINT.grass : TINT.olive;
        else tint = wet > 0.38 ? TINT.forest : TINT.grass;
        map[i] = tint;
    });
    return map;
}

const LAND_MAP = landMap();

// The land map's material at a latitude and longitude in degrees.
function landTintAt(lat, lon) {
    const row = Math.min(MAP_ROWS - 1, Math.floor((90 - lat) / MAP_STEP));
    const col = Math.floor((lon + 180) / MAP_STEP) % MAP_COLS;
    return LAND_MAP[row * MAP_COLS + col];
}

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
                out.tint = TINT.air;
            }
            return;
        }
        // Latitude and longitude of the hit, in the Earth's own turning frame.
        transformBack(frame, n[0], n[1], n[2], q);
        const lat = Math.asin(q[1]) * DEGREES;
        const lon = Math.atan2(q[0], q[2]) * DEGREES;
        const land = landAt(lat, lon);
        const ground = SEA + (LAND - SEA) * land;
        const seaIce = ICE * smoothstep(72, 80, lat);
        const albedo = Math.max(ground, seaIce);
        if (seaIce > ground || (land > 0.5 && Math.abs(lat) > POLAR)) out.tint = TINT.ice;
        else out.tint = land > 0.5 ? landTintAt(lat, lon) : TINT.sea;
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
