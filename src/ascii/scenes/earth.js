// Home: the Earth, turning slowly, and the Moon going round it.

import {
    TINT,
    castRegion,
    eulerMatrix,
    fbm,
    multiply,
    normalize,
    drawSpecks,
    screenCircle,
    smoothstep,
    transform,
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
// The night side keeps this share of full daylight: enough for the sea's faintest character, so the disk
// fills out to its limb instead of fading to nothing short of its outline.
const NIGHT = 0.32;
const DEGREES = 180 / Math.PI;
const POLAR = 64; // land past this latitude, north or south, reads as ice
// The land's materials come from a map on a grid of this many degrees, made once.
const MAP_STEP = 2;
const MAP_COLS = 360 / MAP_STEP;
const MAP_ROWS = 180 / MAP_STEP;

// The Moon: real size next to the Earth, 12 Earth radii away, a fifth of its real distance. At its real distance,
// 60 Earth radii, it would be one character across from where the camera rests; from here it is a few rows
// across. It goes round the Earth the way the Earth turns, once in two of the Earth's days where the real Moon
// takes 27, so it crosses the screen about as fast as Jupiter's moons do on the projects page, on an orbit that
// leans toward the viewer as the Earth's axis does, 20° from the equator, within the real orbit's range. The
// far half of the orbit crosses above the Earth, up from the camera's resting line of sight, where it clears the
// Earth and the page's content at every screen size; the near half passes behind the camera. The sun stands 37°
// above the orbit, where the real one stays within 5°, so that the crossing runs where the page can show it. The
// camera arrives with the Moon at the top of the crossing, a little to the left, where phones show it between
// the header's buttons. The same sun lights it, so it shows the Earth's gibbous phase. It keeps its near side to
// the Earth, with the orbit's north as its north, so the maria show as darker cells when it is large enough.
const MOON_RADIUS = 0.2727 * RADIUS;
const MOON_ORBIT = 12 * RADIUS;
const MONTH_SECONDS = 2 * DAY_SECONDS; // one orbit of the Moon
const ORBIT = eulerMatrix(0.32, 0, 0); // the Moon circles this frame's y axis, which leans toward the viewer
const ORBIT_NORTH = transform(ORBIT, 0, 1, 0, [0, 0, 0]);
// Where the Moon is on its orbit when the camera arrives: the angle from its near point, the way it goes.
const MOON_START = Math.PI + 0.026;
const HIGHLAND = 0.9;
const MARE = 0.55;
// The Moon's night side keeps this share of full daylight, for its earthshine, so its disk fills to its outline.
const EARTHSHINE = 0.14;
// The Moon is cast once its disk is this many rows tall on screen; smaller, it is a speck.
const CAST_ROWS = 3;
// The near side's maria: latitude, longitude (east positive), and radius east to west and north to south, in
// degrees. Oceanus Procellarum and Mare Frigoris stretch along their long axes.
const MARIA = [
    [32.8, -15.6, 19, 19], // Imbrium
    [28, 17.5, 11, 11], // Serenitatis
    [8.5, 31.4, 14, 14], // Tranquillitatis
    [17, 59.1, 9, 8], // Crisium
    [-7.8, 51.3, 11, 14], // Fecunditatis
    [-15.2, 35.5, 5.5, 5.5], // Nectaris
    [-21.3, -16.6, 12, 10], // Nubium
    [-24.4, -38.6, 6.5, 6.5], // Humorum
    [7.5, -30.9, 8.5, 7], // Insularum
    [-10, -23.1, 6, 5], // Cognitum
    [13.3, 3.6, 4, 4], // Vaporum
    [20, -57, 16, 28], // Oceanus Procellarum
    [56, 1.4, 26, 3], // Frigoris
].map(([lat, lon, east, north]) => ({ lat, lon, east, north, flat: Math.cos(lat / DEGREES) }));
// The screen box around a screen circle.
const boxOf = (c) => ({ x0: c.x - c.r, y0: c.y - c.r, x1: c.x + c.r, y1: c.y + c.r });

// A disk a few rows tall reaches into its top or bottom row by less than half in one or two cells, which the
// outline draws as a point. Those cells are cleared, from each end in until a row holds more, so the disk stays
// round.
function trimStubs(grid, c, id) {
    const { cols, rows, cellW, lineH, cover, ident } = grid;
    const x0 = Math.max(0, Math.floor((c.x - c.r) / cellW));
    const x1 = Math.min(cols - 1, Math.ceil((c.x + c.r) / cellW));
    const y0 = Math.max(0, Math.floor((c.y - c.r) / lineH));
    const y1 = Math.min(rows - 1, Math.ceil((c.y + c.r) / lineH));
    if (x0 > x1 || y0 > y1) return;
    const solid = (x, y) => cover[y * cols + x] >= 0.5 && ident[y * cols + x] === id;
    for (const [from, to, step] of [
        [y0, y1, 1],
        [y1, y0, -1],
    ]) {
        for (let y = from; y !== to + step; y += step) {
            let count = 0;
            for (let x = x0; x <= x1; x++) if (solid(x, y)) count++;
            if (count > 2) break;
            for (let x = x0; x <= x1; x++) if (solid(x, y)) cover[y * cols + x] = 0;
        }
    }
}

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
    const moonAt = [0, 0, 0];
    // Rows: the Moon's east, north and the way to the Earth, so transform() gives a point's selenographic coordinates.
    const moonFrame = [0, 0, 0, ...ORBIT_NORTH, 0, 0, 0];

    // Puts the Moon on its orbit at time t, with its near side to the Earth.
    function placeMoon(t) {
        const a = MOON_START + (t * Math.PI * 2) / MONTH_SECONDS;
        transform(ORBIT, MOON_ORBIT * Math.sin(a), 0, MOON_ORBIT * Math.cos(a), moonAt);
        const tx = -moonAt[0] / MOON_ORBIT;
        const ty = -moonAt[1] / MOON_ORBIT;
        const tz = -moonAt[2] / MOON_ORBIT;
        const [nx, ny, nz] = ORBIT_NORTH;
        moonFrame[0] = ny * tz - nz * ty;
        moonFrame[1] = nz * tx - nx * tz;
        moonFrame[2] = nx * ty - ny * tx;
        moonFrame[6] = tx;
        moonFrame[7] = ty;
        moonFrame[8] = tz;
    }

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
        out.shade = albedo * Math.max(NIGHT, 0.04 + 0.96 * lit ** 0.6);
    }

    function sampleMoon(o, d, out) {
        const t = sphere(o, d, moonAt[0], moonAt[1], moonAt[2], MOON_RADIUS, n);
        if (t === Infinity) return;
        transform(moonFrame, n[0], n[1], n[2], q);
        const lat = Math.asin(q[1]) * DEGREES;
        const lon = Math.atan2(q[0], q[2]) * DEGREES;
        const mare = MARIA.some((m) => (((lon - m.lon) * m.flat) / m.east) ** 2 + ((lat - m.lat) / m.north) ** 2 < 1);
        const lit = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
        out.id = 2;
        out.depth = t;
        out.tint = mare ? TINT.mare : TINT.moon;
        out.shade = (mare ? MARE : HIGHLAND) * Math.max(EARTHSHINE, 0.04 + 0.96 * lit ** 0.6);
    }

    return {
        extent: [RADIUS * HALO, RADIUS * HALO],
        center: [0, 0, 0],
        view: [0, 0, 1],
        render(grid, cam, { t, gain }) {
            frame = multiply(TILT, eulerMatrix(0, START + (t * Math.PI * 2) / DAY_SECONDS, 0));
            placeMoon(t);
            const m = screenCircle(cam, moonAt[0], moonAt[1], moonAt[2], MOON_RADIUS);
            if (m && m.r * 2 < CAST_ROWS * grid.lineH) drawSpecks(grid, cam, moonAt, 1, gain);
            else if (m) {
                castRegion(grid, cam, boxOf(m), sampleMoon, gain, () => true);
                trimStubs(grid, m, grid.idBase + 2);
            }
            const c = screenCircle(cam, 0, 0, 0, RADIUS * HALO);
            // Close to the Earth, as next to the rocket or the satellite, its disk has no circle on screen,
            // so the whole screen is cast.
            if (!c && Math.hypot(cam.px, cam.py, cam.pz) <= RADIUS * HALO) return;
            const box = c ? boxOf(c) : { x0: 0, y0: 0, x1: grid.width, y1: grid.height };
            castRegion(grid, cam, box, sample, gain, () => true);
        },
    };
}
