// The ASCII art behind the pages. Each page shows one object from a small shared world (see world.js), framed
// in the box its slot element marks. When the page changes, the camera flies from the old object to the new
// one: straight in or out when the two are close, and out, across and back in when they are far apart. Faint
// stars shift as the pointer moves, a finger taps, or the page scrolls.

import {
    EDGE_CHARS,
    LAST,
    LINE_CHARS,
    RAMP,
    STAR_CHARS,
    TINTS,
    aim,
    clamp01,
    createCamera,
    createGrid,
    drawStars,
    normalize,
    project,
    smoothstep,
    toneDensity,
    traceOutlines,
} from './render.js';

const FONT_SIZE = 14;
const LINE_HEIGHT = 16;
const FRAME_MS = 1000 / 30;
const LAYER_ALPHAS = [0.16, 0.3, 0.48, 0.7, 0.95];
const FOV = 30;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);

// The first object flies in from this many times its resting distance.
const INTRO = { seconds: 1.8, distance: 6 };
// A page change takes base seconds plus perStep for each step of zoom (a factor of e), within min and max.
const TRAVEL = { base: 1.2, perStep: 0.22, min: 1.2, max: 2.6 };
// On a trip the camera's target may sweep this many radians across the view. When the objects are farther
// apart, the camera backs off in the middle of the trip until the sweep fits.
const MAX_SWEEP = 1.25;
const PATH_SAMPLES = 48;
// Objects that are neither leaving nor arriving show this much in the middle of a page change.
const PASSING_GAIN = 0.8;
// During a page change, objects too small on screen to make out do not show. The arriving and leaving objects
// show from the first radius, in px, and fully from the second; other objects need PASSING_RADIUS. So the
// small rocket and satellite show only on trips to or from their own pages, once the camera is near them.
const SEEN_RADIUS = [16, 48];
const PASSING_RADIUS = [48, 96];
// Until the new page is on screen, its object aims for this part of the screen.
const GUESS_SLOT = { left: 0.55, top: 0.15, width: 0.4, height: 0.6 };
const SHOW_EASE = 0.15;

// Page content is drawn into a low-resolution mask, weighted by its opacity. Large type clears by glyph
// shape and smaller text by line box. Elements matching the surfaces selector clear their whole rounded box
// while they show a background or border. Elements with a backdrop blur clear nothing: the art shows through
// them, blurred. The blurred mask fades characters near content.
const GLYPH_MIN_FONT_SIZE = 24;
const MASK_SCALE = 6;
const MASK_INTERVAL = 150;
const CLEAR_PADDING = 12;
const BLUR_RADIUS = 3;
const BLUR_PASSES = 2;
const FADE_START = 0.08;
const FADE_END = 0.5;
const VISIBILITY_EASE = 0.3;

// A small ordered dither breaks up bands where brightness crosses from one character to the next.
const DITHER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => ((v / 16 - 0.47) / LAST) * 0.5);
const layerFor = (alpha) =>
    alpha < 0.08 ? -1 : alpha < 0.23 ? 0 : alpha < 0.39 ? 1 : alpha < 0.59 ? 2 : alpha < 0.82 ? 3 : 4;

// Material colors, see TINTS: soft on the dark theme, deeper on the light one so they hold up on a pale
// background. Ink takes the page's text color.
const PALETTE = {
    sea: ['#7fb2e5', '#2f6a9e'],
    forest: ['#6fa86a', '#2f6a34'],
    grass: ['#9fcf86', '#4f8a3d'],
    olive: ['#c2c487', '#76782f'],
    tan: ['#d4b487', '#8f6d3b'],
    sand: ['#ead6a4', '#a88a48'],
    ice: ['#e3eef7', '#5f7a8f'],
    air: ['#a9cfff', '#4a80bb'],
    hull: ['#dfe3e8', '#59616a'],
    red: ['#ec837a', '#b23c33'],
    metal: ['#a3a9b0', '#4a4f55'],
    glass: ['#8ed3ef', '#2a7fa6'],
    flame: ['#ffb877', '#d0661c'],
    zone: ['#f1e2c4', '#9a7e4e'],
    belt: ['#cf9f74', '#85552f'],
    pole: ['#b9b3aa', '#6b655d'],
    spot: ['#e2825f', '#a8462a'],
    io: ['#ead37f', '#97831f'],
    europa: ['#e9e1d2', '#83786a'],
    ganymede: ['#b8aa98', '#6c5f50'],
    callisto: ['#9d9184', '#5a5047'],
    // The site's --color-primary-light on the dark theme and --color-primary on the light one.
    accent: ['#b2cfd7', '#6b8f9e'],
};

const isVisibleColor = (color) => color !== 'transparent' && !/[,/]\s*0\)$/.test(color);
const SIDES = ['Top', 'Right', 'Bottom', 'Left'];
const hasSurface = (style) =>
    isVisibleColor(style.backgroundColor) ||
    style.backgroundImage !== 'none' ||
    SIDES.some((side) => parseFloat(style[`border${side}Width`]) > 0 && isVisibleColor(style[`border${side}Color`]));

const lerp = (a, b, t) => a + (b - a) * t;
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Turns a vector about the vertical axis.
function turnY(v, turn) {
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
}

function boxBlur(src, dst, w, h, r) {
    const size = r * 2 + 1;
    for (let y = 0; y < h; y++) {
        let sum = 0;
        for (let x = -r; x <= r; x++) sum += src[y * w + Math.min(w - 1, Math.max(0, x))];
        for (let x = 0; x < w; x++) {
            dst[x * h + y] = sum / size;
            sum += src[y * w + Math.min(w - 1, x + r + 1)] - src[y * w + Math.max(0, x - r)];
        }
    }
}

/**
 * Starts the field on a full-window canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} options
 * @param {HTMLElement} options.root Element whose content the art keeps clear of.
 * @param {string} options.surfaces Selector for panels and controls that clear their whole box.
 * @param {string} options.slot Selector for the element that marks where the page's object goes.
 * @param {Record<string, object>} options.world Objects by name, see world.js.
 */
export function createAsciiField(canvas, { root, surfaces, slot, world }) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const grid = createGrid();
    const cam = createCamera();
    const local = createCamera();
    const probe = createCamera();
    const range = document.createRange();
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    const listeners = new AbortController();
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, inside: 0, until: 0 };
    const startTime = performance.now();
    const names = Object.keys(world);
    // Parts of different objects get different ids, so their outlines meet cleanly.
    const idBase = Object.fromEntries(names.map((name, k) => [name, k * 8]));
    const show = Object.fromEntries(names.map((name) => [name, 0]));
    // Each object's scene time is zero when the camera arrives at it from out of sight, so it arrives
    // showing what its scene sets up for time zero, such as the Earth's land and Jupiter's moons.
    const epoch = Object.fromEntries(names.map((name) => [name, 0]));
    const drawn = Object.fromEntries(names.map((name) => [name, 0])); // gain in the last frame
    // Where the camera last rested for each object; a first guess at its framing on the next visit.
    const lastFraming = {};

    let ink = '';
    let colors = []; // by material, see TINTS
    let viewW = 1;
    let viewH = 1;
    let maskA = new Float32Array(0);
    let maskB = new Float32Array(0);
    let targetVisibility = new Float32Array(0);
    let visibility = new Float32Array(0);
    let rowLayers = [];

    let page = null; // name of the object the current page shows
    let current = null; // where the camera is now: { target, view, distance, shift }
    let travel = null; // the page change in progress: { from, to, start, duration, a }
    let oldSlot = null; // the leaving page's slot, which the new page's object must not use
    let slotReady = true; // false while the new page is not on screen yet

    let clock = 0;
    let frameId = 0;
    let lastFrame = 0;
    let lastMask = 0;
    let lastScrollY = window.scrollY;
    let velocity = 0; // how fast the page scrolls, in px per second, down positive
    let tilt = 0;

    /* ---------- Size and colors ---------- */

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.font = `${FONT_SIZE}px ${getComputedStyle(canvas).fontFamily}`;
        ctx.textBaseline = 'top';

        viewW = width;
        viewH = height;
        grid.resize(width, height, ctx.measureText('M').width, LINE_HEIGHT);
        const n = grid.cols * grid.rows;
        maskCanvas.width = Math.ceil(width / MASK_SCALE);
        maskCanvas.height = Math.ceil(height / MASK_SCALE);
        maskA = new Float32Array(maskCanvas.width * maskCanvas.height);
        maskB = new Float32Array(maskA.length);
        targetVisibility = new Float32Array(n);
        visibility = new Float32Array(n);
        // One row of characters for each material and opacity layer.
        rowLayers = TINTS.map((_, material) =>
            LAYER_ALPHAS.map((alpha) => ({ material, alpha, chars: new Array(grid.cols).fill(' ') })),
        );

        rebuildMask(true);
        if (reducedMotion) redraw();
    }

    function refreshColors() {
        // The computed color resolves the theme's CSS variables to a plain rgb() string the canvas accepts.
        ink = getComputedStyle(canvas).color;
        // Light ink means the dark theme.
        const [r, g, b] = ink.match(/\d+/g).map(Number);
        const shade = r + g + b > 382 ? 0 : 1;
        colors = TINTS.map((name) => (name === 'ink' ? ink : PALETTE[name][shade]));
        if (reducedMotion) redraw();
    }

    /* ---------- Content mask ---------- */

    function drawBox(rect, radius) {
        if (!rect.width && !rect.height) return;
        if (rect.bottom < -CLEAR_PADDING * 3 || rect.top > viewH + CLEAR_PADDING * 3) return;
        const r = Math.min(radius, rect.width / 2, rect.height / 2) + CLEAR_PADDING;
        maskCtx.beginPath();
        maskCtx.roundRect(
            rect.left - CLEAR_PADDING,
            rect.top - CLEAR_PADDING,
            rect.width + CLEAR_PADDING * 2,
            rect.height + CLEAR_PADDING * 2,
            r,
        );
        maskCtx.fill();
    }

    // Draws each character at its rendered position; the round stroke adds even padding around the glyph.
    function drawGlyphs(node, style) {
        range.selectNodeContents(node);
        const box = range.getBoundingClientRect();
        if (box.bottom < -CLEAR_PADDING || box.top > viewH + CLEAR_PADDING) return;
        maskCtx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const ascent = maskCtx.measureText('M').fontBoundingBoxAscent;
        let offset = 0;
        for (const char of node.data) {
            const end = offset + char.length;
            if (char.trim()) {
                range.setStart(node, offset);
                range.setEnd(node, end);
                const rect = range.getBoundingClientRect();
                if (rect.width) {
                    maskCtx.strokeText(char, rect.left, rect.top + ascent);
                    maskCtx.fillText(char, rect.left, rect.top + ascent);
                }
            }
            offset = end;
        }
    }

    function rebuildMask(snap) {
        const w = maskCanvas.width;
        const h = maskCanvas.height;
        if (!w || !h) return;

        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.clearRect(0, 0, w, h);
        maskCtx.setTransform(1 / MASK_SCALE, 0, 0, 1 / MASK_SCALE, 0, 0);
        maskCtx.lineWidth = CLEAR_PADDING * 2;
        maskCtx.lineJoin = 'round';
        maskCtx.textBaseline = 'alphabetic';

        // Memoized per rebuild: computed styles, inherited opacity, and whether an ancestor is a surface.
        const styles = new Map();
        const opacities = new Map();
        const covered = new Map();
        const styleOf = (el) => {
            if (!styles.has(el)) styles.set(el, getComputedStyle(el));
            return styles.get(el);
        };
        const opacityOf = (el) => {
            if (!el || el === root) return 1;
            if (!opacities.has(el)) opacities.set(el, parseFloat(styleOf(el).opacity) * opacityOf(el.parentElement));
            return opacities.get(el);
        };
        const alphaOf = (el) => (styleOf(el).visibility === 'hidden' ? 0 : opacityOf(el));
        const shields = new Set();
        const frosted = new Set();
        for (const el of root.querySelectorAll(surfaces)) {
            const style = styleOf(el);
            if (style.backdropFilter !== 'none') frosted.add(el);
            else if (hasSurface(style)) shields.add(el);
        }
        const isCovered = (el) => {
            if (!el || el === root) return false;
            if (!covered.has(el)) {
                const parent = el.parentElement;
                covered.set(el, shields.has(parent) || frosted.has(parent) || isCovered(parent));
            }
            return covered.get(el);
        };

        for (const surface of shields) {
            if (isCovered(surface)) continue;
            maskCtx.globalAlpha = alphaOf(surface);
            drawBox(surface.getBoundingClientRect(), parseFloat(styleOf(surface).borderTopLeftRadius) || 0);
        }
        for (const el of root.querySelectorAll('svg, hr, img, video')) {
            if (shields.has(el) || frosted.has(el) || isCovered(el)) continue;
            maskCtx.globalAlpha = alphaOf(el);
            drawBox(el.getBoundingClientRect(), 4);
        }
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const el = node.parentElement;
            if (!el || !node.data.trim() || shields.has(el) || frosted.has(el) || isCovered(el)) continue;
            const alpha = alphaOf(el);
            if (alpha < 0.02) continue;
            maskCtx.globalAlpha = alpha;
            const style = styleOf(el);
            if (parseFloat(style.fontSize) >= GLYPH_MIN_FONT_SIZE) {
                drawGlyphs(node, style);
            } else {
                range.selectNodeContents(node);
                for (const rect of range.getClientRects()) drawBox(rect, rect.height / 2);
            }
        }
        maskCtx.globalAlpha = 1;

        // Two box-blur passes give a soft, even falloff around content.
        const { data } = maskCtx.getImageData(0, 0, w, h);
        for (let i = 0; i < maskA.length; i++) maskA[i] = data[i * 4 + 3] / 255;
        for (let pass = 0; pass < BLUR_PASSES; pass++) {
            boxBlur(maskA, maskB, w, h, BLUR_RADIUS);
            boxBlur(maskB, maskA, h, w, BLUR_RADIUS);
        }

        const { cols, rows, cellW } = grid;
        for (let y = 0; y < rows; y++) {
            const my = Math.min(h - 1, Math.floor(((y + 0.5) * LINE_HEIGHT) / MASK_SCALE));
            for (let x = 0; x < cols; x++) {
                const mx = Math.min(w - 1, Math.floor(((x + 0.5) * cellW) / MASK_SCALE));
                const fade = clamp01((maskA[my * w + mx] - FADE_START) / (FADE_END - FADE_START));
                targetVisibility[y * cols + x] = 1 - fade * fade * (3 - 2 * fade);
            }
        }
        // Scrolling moves content a lot between frames, so the field jumps to the new mask instead of easing.
        if (snap) visibility.set(targetVisibility);
    }

    /* ---------- Framing ---------- */

    // The first slot element that shows on screen, with its box.
    function findSlot() {
        for (const el of root.querySelectorAll(slot)) {
            const rect = el.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) return { el, rect };
        }
        return null;
    }

    // The current page's slot box on screen, or null while the new page is not on screen or has no slot.
    function slotRect() {
        const found = findSlot();
        return found && (slotReady || found.el !== oldSlot) ? found.rect : null;
    }

    // Where an object's scene origin is in the world now. A rocket lifts off or lands on its way to or from
    // its launch object, keeping pace with the camera.
    function positionOf(name) {
        const { position, launch } = world[name];
        if (!launch || !travel) return position;
        const along =
            travel.to === name && travel.from === launch.from
                ? travel.across
                : travel.from === name && travel.to === launch.from
                  ? 1 - travel.across
                  : 1;
        return lerp3(launch.pad, position, along);
    }

    function burnOf(name) {
        const { launch } = world[name];
        if (!launch || !travel) return 0;
        const pair = [travel.from, travel.to];
        return pair.includes(name) && pair.includes(launch.from) ? 1 : 0;
    }

    // Camera framing that fits an object into a box on screen, by its extent. Perspective makes the near parts
    // of a large object look bigger than that, so two passes then fit its outline, if it has one, as the
    // camera sees it.
    function framingIn(name, box) {
        const { scene, scale, turn, position } = world[name];
        const [halfW, halfH] = scene.extent;
        const pxPerUnit = Math.min(box.width / (2 * halfW * scale), box.height / (2 * halfH * scale));
        const offset = turnY(scene.center, turn);
        const framing = {
            target: [0, 1, 2].map((k) => position[k] + offset[k] * scale),
            view: turnY(normalize(scene.view), turn),
            distance: viewH / 2 / TAN_HALF_FOV / pxPerUnit,
            shift: [(box.left + box.width / 2) / viewW - 0.5, (box.top + box.height / 2) / viewH - 0.5],
        };
        for (let pass = 0; scene.outline && pass < 2; pass++) fitOutline(framing, world[name], box);
        return framing;
    }

    // Moves and scales a framing so the object's outline, as the camera sees it, fills the box.
    function fitOutline(framing, { scene, scale, turn, position }, box) {
        const { target, view, distance, shift } = framing;
        const eye = [0, 1, 2].map((k) => target[k] + view[k] * distance);
        aim(probe, grid, eye, target, FOV, shift);
        const at = {};
        const xs = [];
        const ys = [];
        for (const point of scene.outline) {
            const [x, y, z] = turnY(point, turn).map((v, k) => position[k] + v * scale);
            if (project(probe, x, y, z, at)) {
                xs.push(at.x);
                ys.push(at.y);
            }
        }
        const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
        if (!(x1 > x0 && y1 > y0)) return;
        framing.distance *= Math.max((x1 - x0) / box.width, (y1 - y0) / box.height);
        framing.shift = [
            shift[0] + (box.left + box.width / 2 - (x0 + x1) / 2) / viewW,
            shift[1] + (box.top + box.height / 2 - (y0 + y1) / 2) / viewH,
        ];
    }

    // Where the camera wants to be for an object: its page's slot, or a guess until the page is on screen.
    function restingFraming(name) {
        const box = slotRect();
        if (box) return (lastFraming[name] = framingIn(name, box));
        if (lastFraming[name]) return lastFraming[name];
        return framingIn(name, {
            left: GUESS_SLOT.left * viewW,
            top: GUESS_SLOT.top * viewH,
            width: GUESS_SLOT.width * viewW,
            height: GUESS_SLOT.height * viewH,
        });
    }

    // The camera's distance at eased progress e from framing a to framing b: even steps in log scale, plus a
    // hump that backs the camera off in the middle of the trip.
    const distanceAt = (a, b, hump, e) =>
        Math.exp(lerp(Math.log(a.distance), Math.log(b.distance), e) + hump * Math.sin(Math.PI * e));

    // The camera's distance summed over the trip up to e (and over the whole trip). The target moves in step
    // with this sum: fast while the camera is far and slow while it is close. So it sweeps the same angle of
    // view on every part of the trip, and a small object next to a large one stays in view.
    function pathLength(a, b, hump, e = 1) {
        let sum = 0;
        let total = 0;
        let prev = distanceAt(a, b, hump, 0);
        for (let s = 1; s <= PATH_SAMPLES; s++) {
            const d = distanceAt(a, b, hump, s / PATH_SAMPLES);
            const step = (prev + d) / 2 / PATH_SAMPLES;
            sum += step * clamp01(e * PATH_SAMPLES - (s - 1));
            total += step;
            prev = d;
        }
        return { sum, total };
    }

    // The smallest hump that keeps the target's sweep, its travel over the summed distance, within MAX_SWEEP.
    function humpFor(a, b) {
        const gap = Math.hypot(b.target[0] - a.target[0], b.target[1] - a.target[1], b.target[2] - a.target[2]);
        const sweep = (hump) => gap / pathLength(a, b, hump).total;
        if (sweep(0) <= MAX_SWEEP) return 0;
        let low = 0;
        let high = 12;
        for (let i = 0; i < 20; i++) {
            const mid = (low + high) / 2;
            if (sweep(mid) > MAX_SWEEP) low = mid;
            else high = mid;
        }
        return high;
    }

    function progress() {
        return travel ? clamp01((clock - travel.start) / travel.duration) : 1;
    }

    function updateCamera() {
        const rest = restingFraming(page);
        if (!travel) {
            current = rest;
            return;
        }
        // The first page flies in from far away along its own line of sight.
        const a = (travel.a ??= { ...rest, distance: rest.distance * INTRO.distance });
        const k = progress();
        const e = easeInOut(k);
        const hump = humpFor(a, rest);
        const { sum, total } = pathLength(a, rest, hump, e);
        travel.across = sum / total;
        current = {
            target: lerp3(a.target, rest.target, travel.across),
            view: normalize(lerp3(a.view, rest.view, travel.across)),
            distance: distanceAt(a, rest, hump, e),
            shift: [lerp(a.shift[0], rest.shift[0], e), lerp(a.shift[1], rest.shift[1], e)],
        };
        if (k >= 1) travel = null;
    }

    /* ---------- Scenes ---------- */

    // An object's radius on screen, in px.
    function screenRadius(name) {
        const { scene, scale } = world[name];
        const [x, y, z] = positionOf(name);
        return (Math.max(...scene.extent) * scale * cam.focal) / Math.hypot(cam.px - x, cam.py - y, cam.pz - z);
    }

    // How strongly each object draws. On a trip between nearby objects, as from the Earth to the rocket, both
    // show for nearly all of it. On a long trip the arriving object fades in, the leaving one fades out near
    // the end, and others show only in the middle of the trip. Objects too small on screen do not show.
    function gainOf(name) {
        if (!travel) return name === page ? show[name] : 0;
        const k = progress();
        const { near } = travel;
        const r = screenRadius(name);
        const seen = smoothstep(SEEN_RADIUS[0], SEEN_RADIUS[1], r);
        if (name === travel.to) return seen * show[name] * smoothstep(0, near ? 0.12 : travel.from ? 0.45 : 0.6, k);
        if (name === travel.from) return seen * travel.fromShow * (1 - smoothstep(near ? 0.85 : 0.55, 1, k));
        const passing = PASSING_GAIN * smoothstep(0.1, 0.35, k) * (1 - smoothstep(0.65, 0.9, k));
        return passing * smoothstep(PASSING_RADIUS[0], PASSING_RADIUS[1], r);
    }

    // The world camera, expressed in an object's own scene units.
    function toLocal(name, position) {
        const { scale, turn } = world[name];
        const c = Math.cos(turn);
        const s = Math.sin(turn);
        const dx = cam.px - position[0];
        const dy = cam.py - position[1];
        const dz = cam.pz - position[2];
        Object.assign(local, {
            px: (c * dx - s * dz) / scale,
            py: dy / scale,
            pz: (s * dx + c * dz) / scale,
            fx: c * cam.fx - s * cam.fz,
            fy: cam.fy,
            fz: s * cam.fx + c * cam.fz,
            rx: c * cam.rx - s * cam.rz,
            rz: s * cam.rx + c * cam.rz,
            ux: c * cam.ux - s * cam.uz,
            uy: cam.uy,
            uz: s * cam.ux + c * cam.uz,
            focal: cam.focal,
            cx: cam.cx,
            cy: cam.cy,
        });
    }

    function placeCamera(f) {
        const pos = [0, 1, 2].map((k) => f.target[k] + f.view[k] * f.distance);
        aim(cam, grid, pos, f.target, FOV, f.shift);
        if (reducedMotion) return;
        // The pointer, a tap, or scrolling turns the camera a little, for depth.
        const ox = pointer.sx * f.distance * 0.06;
        const oy = (-pointer.sy * 0.04 - tilt * 0.04) * f.distance;
        pos[0] += cam.rx * ox + cam.ux * oy;
        pos[1] += cam.uy * oy;
        pos[2] += cam.rz * ox + cam.uz * oy;
        aim(cam, grid, pos, f.target, FOV, f.shift);
    }

    function renderFrame(t) {
        grid.clear();
        if (!page) return;
        updateCamera();
        placeCamera(current);
        drawStars(grid, cam, t, 1);
        for (const name of names) {
            const gain = gainOf(name);
            drawn[name] = gain;
            if (gain < 0.01) continue;
            const { scene, scale } = world[name];
            toLocal(name, positionOf(name));
            grid.depthScale = scale;
            grid.idBase = idBase[name];
            grid.paint = 0;
            scene.render(grid, local, { t: t - epoch[name], gain, speed: Math.abs(velocity), burn: burnOf(name) });
        }
        toneDensity(grid);
        traceOutlines(grid);
    }

    /* ---------- Characters ---------- */

    function draw() {
        const {
            cols,
            rows,
            lum,
            lines,
            lineCode,
            star,
            starAlpha,
            front,
            cover,
            shade,
            opacity,
            edge,
            tint,
            glowTint,
        } = grid;
        const ease = reducedMotion ? 1 : VISIBILITY_EASE;
        const used = [];

        ctx.clearRect(0, 0, viewW, viewH);
        for (let y = 0; y < rows; y++) {
            // One string per material and opacity layer keeps this to a few fillText calls per row.
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                const v = (visibility[i] += (targetVisibility[i] - visibility[i]) * ease);
                if (v <= 0.02) continue;
                let char = ' ';
                let alpha = 0;
                let material = 0;
                if (front[i]) {
                    char = STAR_CHARS[star[i]];
                    alpha = starAlpha[i];
                } else if (edge[i]) {
                    char = EDGE_CHARS[edge[i]];
                    alpha = (0.62 + 0.33 * shade[i]) * opacity[i];
                    material = tint[i];
                } else if (cover[i] >= 0.5) {
                    // Solid faces keep one character per brightness step, without dither, so flat parts stay even.
                    const level = clamp01(shade[i]);
                    char = RAMP[Math.round(level * LAST)];
                    alpha = (0.2 + 0.8 * level ** 0.8) * opacity[i];
                    material = tint[i];
                } else {
                    let level = lum[i];
                    if (level > 0.04) level = clamp01(level + DITHER[(y & 3) * 4 + (x & 3)]);
                    const step = Math.round(Math.min(1, level) * LAST);
                    if (step >= 1) {
                        char = RAMP[step];
                        alpha = 0.2 + 0.8 * level ** 0.8;
                        material = glowTint[i];
                    } else if (lines[i] > 0.04) {
                        char = LINE_CHARS[lineCode[i]];
                        alpha = lines[i] * 0.55;
                        material = glowTint[i];
                    } else if (star[i]) {
                        char = STAR_CHARS[star[i]];
                        alpha = starAlpha[i];
                    }
                }
                const layer = char === ' ' ? -1 : layerFor(alpha * v);
                if (layer < 0) continue;
                const row = rowLayers[material][layer];
                if (!used.includes(row)) used.push(row);
                row.chars[x] = char;
            }
            for (const row of used) {
                ctx.fillStyle = colors[row.material];
                ctx.globalAlpha = row.alpha;
                ctx.fillText(row.chars.join(''), 0, y * LINE_HEIGHT);
                row.chars.fill(' ');
            }
            used.length = 0;
        }
        ctx.globalAlpha = 1;
    }

    /* ---------- Loop ---------- */

    function measureScroll(dt) {
        const y = window.scrollY;
        const rate = dt > 0 ? (y - lastScrollY) / dt : 0;
        const settle = 1 - Math.exp(-dt / 0.2);
        velocity += (rate - velocity) * settle;
        tilt += (Math.max(-1, Math.min(1, velocity / 3000)) - tilt) * settle;
        const moved = y !== lastScrollY;
        lastScrollY = y;
        return moved;
    }

    function updateShow() {
        // A page without a slot on screen hides its object.
        const target = slotRect() ? 1 : slotReady ? 0 : show[page];
        show[page] += (target - show[page]) * (reducedMotion ? 1 : SHOW_EASE);
    }

    // With reduced motion the scene holds still and only redraws when content, size or colors change.
    function redraw() {
        if (!ink || !page) return;
        updateShow();
        renderFrame(0);
        draw();
    }

    function frame(now) {
        frameId = requestAnimationFrame(frame);
        if (now - lastFrame < FRAME_MS) return;
        const dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0;
        lastFrame = now;
        clock = (now - startTime) / 1000;

        // The mask follows layout on an interval, and on every frame while the page scrolls.
        const scrolled = measureScroll(dt);
        const maskDue = scrolled || now - lastMask > MASK_INTERVAL;
        if (maskDue) {
            lastMask = now;
            rebuildMask(scrolled);
        }
        if (reducedMotion) {
            if (maskDue) redraw();
            return;
        }

        const inside = pointer.inside || clock < pointer.until ? 1 : 0;
        pointer.sx += ((pointer.x / viewW - 0.5) * inside - pointer.sx) * 0.05;
        pointer.sy += ((pointer.y / viewH - 0.5) * inside - pointer.sy) * 0.05;
        if (page) updateShow();
        renderFrame(clock);
        draw();
    }

    function start() {
        if (!frameId) frameId = requestAnimationFrame(frame);
    }

    function stop() {
        cancelAnimationFrame(frameId);
        frameId = 0;
        lastFrame = 0;
    }

    /* ---------- Public ---------- */

    // Starts the trip to a page's object. The camera leaves at once; it finds the new page's slot once
    // relayout() says the new page is on screen.
    function setScene(name) {
        if (name === page || !world[name]) return;
        oldSlot = findSlot()?.el;
        slotReady = false;
        if (reducedMotion) {
            travel = null;
        } else if (page && current) {
            const rest = restingFraming(name);
            const a = { ...current };
            const hump = humpFor(a, rest);
            const zoom = Math.abs(Math.log(rest.distance / a.distance)) + 2 * hump;
            travel = {
                from: page,
                to: name,
                start: clock,
                a,
                fromShow: show[page],
                // The camera needs no hump between nearby objects, so both can show for the whole trip.
                near: hump === 0,
                duration: Math.min(TRAVEL.max, Math.max(TRAVEL.min, TRAVEL.base + TRAVEL.perStep * zoom)),
            };
        } else {
            travel = { from: null, to: name, start: clock, a: null, near: false, duration: INTRO.seconds };
        }
        if (travel && drawn[name] < 0.01) epoch[name] = travel.start + travel.duration;
        page = name;
        // Assume the new page has a slot until it is on screen without one.
        show[name] = 1;
    }

    // The new page is on screen, so its slot can be used.
    function relayout() {
        slotReady = true;
        lastMask = 0;
    }

    function destroy() {
        stop();
        listeners.abort();
        resizeObserver.disconnect();
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(canvas);

    const on = (target, type, handler) =>
        target.addEventListener(type, handler, { passive: true, signal: listeners.signal });
    on(window, 'pointermove', (e) => {
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        if (e.pointerType === 'mouse') pointer.inside = 1;
    });
    // A tap pulls the camera toward it for a moment.
    on(window, 'pointerdown', (e) => {
        if (e.pointerType === 'mouse') return;
        pointer.x = e.clientX;
        pointer.y = e.clientY;
        pointer.until = clock + 0.8;
    });
    // The camera eases back when the mouse leaves the window.
    on(window, 'pointerout', (e) => {
        if (!e.relatedTarget) pointer.inside = 0;
    });
    on(document, 'visibilitychange', () => (document.hidden ? stop() : start()));

    refreshColors();
    resize();
    start();

    return { setScene, relayout, refreshColors, destroy };
}
