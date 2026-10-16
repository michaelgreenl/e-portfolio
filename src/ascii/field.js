// The ASCII art behind the pages. Each page shows one object from a small shared world (see world.js), framed
// in the box its slot element marks. When the page changes, the camera flies from the old object to the new
// one: straight in or out when the two are close, and out, across and back in when they are farther apart. When
// they are too far apart for that, it backs away from the old one as it fades out, and closes in on the new one
// as it fades in. Faint stars shift as the pointer moves, a finger taps, or the page scrolls.

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
    easeOut,
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
// Faint characters wash out on the light theme's pale background, so they draw this much stronger there.
const LIGHT_THEME_ALPHA = 2.8;
const FOV = 30;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);

// Settings given as [phone, desktop] pairs change from the first value at the first of these screen widths, in
// px, to the second value at the second.
const SCREEN_WIDTHS = [390, 1280];
// The first object flies in from `distance` times its resting distance over `seconds`. A phone shows less of the
// art and of the page at first, so the fly-in is shorter there.
const INTRO = { seconds: [1.1, 1.8], distance: [2.2, 6] };
// A page change takes base seconds plus perStep for each step of zoom (a factor of e), within min and max.
const TRAVEL = { base: 0.9, perStep: 0.1, min: 0.9, max: 1.3 };
// On a trip the camera's target may sweep this many radians across the view. When the objects are farther
// apart, the camera backs off in the middle of the trip until the sweep fits.
const MAX_SWEEP = 1.25;
// When the camera would have to back off by more than CUT_HUMP steps of zoom for that, the objects are too far
// apart to fly between, and the trip is a cut instead. The camera backs off from the leaving object to `back`
// times its distance over `away` seconds, as the object fades out with its page. Then it closes in on the
// arriving object from `ahead` times its resting distance over `toward` seconds, as the object fades in over the
// first third of that.
const CUT_HUMP = 1.5;
const CUT = { away: 0.4, toward: 0.7, back: 2, ahead: 2.5 };
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
// Once the new page is on screen, the camera eases from its guess to the page's slot over this many seconds.
const SETTLE_SECONDS = 0.3;
const SHOW_EASE = 0.15;

// Page content is drawn into a low-resolution mask with its opacity: a cell under content shows art only as far
// as that content has faded out, so the art fades back in as the content fades away. Each line of text clears
// one box, never the shapes of single letters: from the top of its tallest character, emoji included, to the
// bottom of its lowest, padded below and to each side but not above. Its corners curve as far as the characters
// at its ends leave room, up to TEXT_CURVE. The box starts TEXT_TOP_INSET below that top: the art's characters
// sit high in their row and leave its bottom pixels empty, so text that reaches into the bottom of a row leaves
// that row's art in place. Elements matching the surfaces selector clear their whole rounded box while they
// show a background or a border all around. One bordered on only some sides, such as a divider, clears just
// those lines. One with neither, such as a nav link, clears one box around its icon and text together, so the
// cut above them stays level, and the band where its ::after underline draws, so the art holds still while an
// underline grows in on hover. Elements with a backdrop blur clear nothing: the art shows through them,
// blurred. The mask has MASK_CELL pixels across and down for each character cell, and content covers a cell
// where any of its mask pixels reaches CLEAR_AT. So the art keeps CLEAR_PADDING clear of content, even a thin
// line, and the edge around content is a clean cut along the rows and columns, with no soft edge. Strips of art
// narrower than MIN_STRIP between content, frosted panels and the screen edge are cleared too, so no slivers
// squeeze between them, and so are runs of at most MAX_POCKET cells in a row with content at both ends and
// right below, such as art that hangs into the gap between two nav links. The padding and the narrowest strip
// kept grow from the first value at phone width to the second at desktop width.
const TEXT_TOP_INSET = 2;
const TEXT_CURVE = 24;
// With an anchor on the page, the rows of art shift down by less than one row, so the anchor line's tallest
// character starts ANCHOR_OFFSET px into a row, just below that row's characters. With the page at the top,
// the row above that line then shows in full, at every screen size.
const ANCHOR_OFFSET = 15;
const MASK_CELL = [2, 4];
const MASK_INTERVAL = 150;
const CLEAR_PADDING = [4, 6];
const CLEAR_AT = 0.25;
const MIN_STRIP = { cols: [2, 3], rows: 2 };
const MAX_POCKET = 4;

const graphemes = new Intl.Segmenter();

// A small ordered dither breaks up bands where brightness crosses from one character to the next.
const DITHER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => ((v / 16 - 0.47) / LAST) * 0.5);
const layerFor = (alpha) =>
    alpha < 0.08 ? -1 : alpha < 0.23 ? 0 : alpha < 0.39 ? 1 : alpha < 0.59 ? 2 : alpha < 0.82 ? 3 : 4;

// Material colors, see TINTS: soft on the dark theme, deeper on the light one so they hold up on a pale
// background. Ink takes the page's text color.
const PALETTE = {
    sea: ['#7fb2e5', '#174a80'],
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
    zone: ['#f1e2c4', '#6e5426'],
    belt: ['#cf9f74', '#5e3414'],
    pole: ['#b9b3aa', '#45403a'],
    spot: ['#e2825f', '#8c2f14'],
    io: ['#ead37f', '#97831f'],
    europa: ['#e9e1d2', '#83786a'],
    ganymede: ['#b8aa98', '#6c5f50'],
    callisto: ['#9d9184', '#5a5047'],
    // The site's --color-primary-light on the dark theme and --color-primary on the light one.
    accent: ['#b2cfd7', '#6b8f9e'],
};

const isVisibleColor = (color) => color !== 'transparent' && !/[,/]\s*0\)$/.test(color);
const SIDES = ['Top', 'Right', 'Bottom', 'Left'];
const hasFill = (style) => isVisibleColor(style.backgroundColor) || style.backgroundImage !== 'none';
const bordersOf = (style) =>
    SIDES.filter((side) => parseFloat(style[`border${side}Width`]) > 0 && isVisibleColor(style[`border${side}Color`]));

const lerp = (a, b, t) => a + (b - a) * t;
// How far a screen width is from phone width (0) to desktop width (1), for the [phone, desktop] settings.
const widthFit = (width) => clamp01((width - SCREEN_WIDTHS[0]) / (SCREEN_WIDTHS[1] - SCREEN_WIDTHS[0]));
const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

// Turns a vector about the vertical axis.
function turnY(v, turn) {
    const c = Math.cos(turn);
    const s = Math.sin(turn);
    return [c * v[0] + s * v[2], v[1], -s * v[0] + c * v[2]];
}

// Clears each run of open cells (255, art in full) shorter than min along a line, down to the art that the
// content at its ends shows: the run fades back in with that content. Cells under glass show art but end a run,
// as the ends of a line do. There are `lines` lines of `length` cells; a line starts at line * across and its
// cells are along apart.
function clearStrips(open, glass, lines, length, across, along, min) {
    for (let line = 0; line < lines; line++) {
        const at = (k) => line * across + k * along;
        const shownAt = (k) => (k < 0 || k >= length || glass[at(k)] ? 0 : open[at(k)]);
        let start = -1;
        for (let k = 0; k <= length; k++) {
            const isOpen = k < length && open[at(k)] === 255 && !glass[at(k)];
            if (isOpen && start < 0) start = k;
            if (isOpen || start < 0) continue;
            if (k - start < min) {
                const shown = Math.max(shownAt(start - 1), shownAt(k));
                for (let j = start; j < k; j++) open[at(j)] = shown;
            }
            start = -1;
        }
    }
}

// Clears each run of at most max open cells in a row that has content at both ends and right below all of it,
// down to the most art that content shows. It works from the bottom row up, so a narrow notch between content
// clears all the way up. Cells under glass show art, so they neither join nor end such a run.
function clearPockets(open, glass, rows, cols, max) {
    const isOpen = (i) => open[i] === 255 && !glass[i];
    const isContent = (i) => open[i] < 255 && !glass[i];
    for (let y = rows - 2; y >= 0; y--) {
        const row = y * cols;
        for (let x = 1; x < cols; x++) {
            if (!isOpen(row + x) || !isContent(row + x - 1)) continue;
            let end = x;
            while (end < cols && isOpen(row + end)) end++;
            let pocket = end < cols && isContent(row + end) && end - x <= max;
            let shown = pocket ? Math.max(open[row + x - 1], open[row + end]) : 0;
            for (let k = x; pocket && k < end; k++) {
                pocket = isContent(row + cols + k);
                shown = Math.max(shown, open[row + cols + k]);
            }
            if (pocket) open.fill(shown, row + x, row + end);
            x = end;
        }
    }
}

// A box's border on one side, as a thin box.
function borderLine(box, style, side) {
    const size = parseFloat(style[`border${side}Width`]);
    const across = side === 'Top' || side === 'Bottom';
    return new DOMRect(
        side === 'Right' ? box.right - size : box.left,
        side === 'Bottom' ? box.bottom - size : box.top,
        across ? box.width : size,
        across ? size : box.height,
    );
}

// The band under an element where its ::after underline draws, across the element's full width, or null.
function underlineOf(el) {
    const style = getComputedStyle(el, '::after');
    const draws = style.position === 'absolute' && style.display !== 'none' && isVisibleColor(style.backgroundColor);
    if (!draws) return null;
    const box = el.getBoundingClientRect();
    const bottom = box.bottom - parseFloat(style.bottom);
    const height = parseFloat(style.height);
    return height > 0 && Number.isFinite(bottom) ? new DOMRect(box.left, bottom - height, box.width, height) : null;
}

/**
 * Starts the field on a full-window canvas.
 * @param {HTMLCanvasElement} canvas
 * @param {object} options
 * @param {HTMLElement} options.root Element whose content the art keeps clear of.
 * @param {string} options.surfaces Selector for panels and controls that clear their whole box.
 * @param {string} options.slot Selector for the element that marks where the page's object goes.
 * @param {string} options.anchor Selector for the line of text that the rows of art line up with.
 * @param {Record<string, object>} options.world Objects by name, see world.js.
 */
export function createAsciiField(canvas, { root, surfaces, slot, anchor, world }) {
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
    // Where the camera last rested for each object at the top of its page; a first guess at its framing on the
    // next visit.
    let lastFraming = {};
    let guess = null; // where the camera headed while the new page was not on screen
    let guessedAt = 0; // the last time it did

    let ink = '';
    let colors = []; // by material, see TINTS
    let alphaScale = 1;
    let viewW = 1;
    let viewH = 1;
    let gridTop = 0; // where the first row of art starts, at or above the top of the screen
    let visible = new Uint8Array(0); // how much each cell shows its art, from 0 (none) to 255 (all of it)
    let glass = new Uint8Array(0); // 1 where a frosted panel covers a cell
    let clearPadding = CLEAR_PADDING[1];
    let minStripCols = MIN_STRIP.cols[1];
    let rowLayers = [];

    let page = null; // name of the object the current page shows
    let current = null; // where the camera is now: { target, view, distance, shift }
    let travel = null; // the page change in progress: { from, to, start, duration, a, cut }
    let oldSlot = null; // the leaving page's slot, which the new page's object must not use
    let slotReady = true; // false while the new page is not on screen yet

    let clock = 0;
    let frameId = 0;
    let lastFrame = 0;
    let lastMask = 0;
    let shownSum = 0; // the summed opacity of all content at the last mask rebuild
    let fading = false; // that sum changed at the last rebuild, so some content is fading in or out
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

        // A new screen width moves every slot, so the remembered framings no longer fit.
        if (width !== viewW) lastFraming = {};
        viewW = width;
        const fit = widthFit(width);
        clearPadding = lerp(CLEAR_PADDING[0], CLEAR_PADDING[1], fit);
        minStripCols = Math.round(lerp(MIN_STRIP.cols[0], MIN_STRIP.cols[1], fit));
        viewH = height;
        // One row more than the screen needs, for when the rows shift to line up with the anchor.
        grid.resize(width, height, ctx.measureText('M').width, LINE_HEIGHT, Math.ceil(height / LINE_HEIGHT) + 1);
        const n = grid.cols * grid.rows;
        maskCanvas.width = grid.cols * MASK_CELL[0];
        maskCanvas.height = grid.rows * MASK_CELL[1];
        visible = new Uint8Array(n);
        glass = new Uint8Array(n);
        // One row of characters for each material and opacity layer.
        rowLayers = TINTS.map((_, material) =>
            LAYER_ALPHAS.map((alpha) => ({ material, alpha, chars: new Array(grid.cols).fill(' ') })),
        );

        rebuildMask();
        if (reducedMotion) redraw();
    }

    function refreshColors() {
        // The computed color resolves the theme's CSS variables to a plain rgb() string the canvas accepts.
        ink = getComputedStyle(canvas).color;
        // Light ink means the dark theme.
        const [r, g, b] = ink.match(/\d+/g).map(Number);
        const shade = r + g + b > 382 ? 0 : 1;
        colors = TINTS.map((name) => (name === 'ink' ? ink : PALETTE[name][shade]));
        alphaScale = shade ? LIGHT_THEME_ALPHA : 1;
        if (reducedMotion) redraw();
    }

    /* ---------- Content mask ---------- */

    function drawBox(rect, radius) {
        if (!rect.width && !rect.height) return;
        if (rect.bottom < -clearPadding * 3 || rect.top > viewH + clearPadding * 3) return;
        const r = Math.min(radius, rect.width / 2, rect.height / 2) + clearPadding;
        maskCtx.beginPath();
        maskCtx.roundRect(
            rect.left - clearPadding,
            rect.top - clearPadding,
            rect.width + clearPadding * 2,
            rect.height + clearPadding * 2,
            r,
        );
        maskCtx.fill();
    }

    // Where a text's characters draw in its line box: the top of their ink below the box's top, the ink's height,
    // and how far the ink reaches above and below the baseline.
    function inkOf(text, style) {
        maskCtx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const metrics = maskCtx.measureText(text);
        const ascent = metrics.actualBoundingBoxAscent;
        const descent = metrics.actualBoundingBoxDescent;
        return { top: metrics.fontBoundingBoxAscent - ascent, height: ascent + descent, ascent, descent };
    }

    // How far a corner of a line's box can curve and still hold the ink of the character at that end, which sits
    // room px in from the box's top or bottom edge and clearPadding in from its side. Without that room, the
    // corner curves only as far as clearPadding.
    function curveFor(room) {
        if (!(room > 0)) return clearPadding;
        return Math.min(TEXT_CURVE, clearPadding + room + Math.sqrt(2 * clearPadding * room));
    }

    // A line of text clears its characters' ink from TEXT_TOP_INSET below their top, padded below and to each side.
    // start and end are the ink of the characters at the line's ends, where the text starts and ends on it.
    function drawLine(rect, ink, start, end) {
        const top = rect.top + ink.top + TEXT_TOP_INSET;
        const height = ink.height - TEXT_TOP_INSET + clearPadding;
        if (top + height < -clearPadding || top > viewH + clearPadding) return;
        const above = (char) => char && ink.ascent - char.ascent - TEXT_TOP_INSET;
        const below = (char) => (char ? ink.descent - char.descent : 0) + clearPadding;
        maskCtx.beginPath();
        maskCtx.roundRect(rect.left - clearPadding, top, rect.width + clearPadding * 2, height, [
            curveFor(above(start)),
            curveFor(above(end)),
            curveFor(below(end)),
            curveFor(below(start)),
        ]);
        maskCtx.fill();
    }

    // Where the first row of art starts so that the anchor line's tallest character starts ANCHOR_OFFSET into a
    // row, or 0 without an anchor. It uses the line's place on the page at rest: its place on screen plus the
    // scroll, less the shift an animation gives it, so the rows hold still while the page scrolls or the line
    // slides in.
    function rowsTop() {
        const el = anchor && root.querySelector(anchor);
        const line = el && document.createTreeWalker(el, NodeFilter.SHOW_TEXT).nextNode();
        if (!line) return 0;
        range.selectNodeContents(line);
        const rect = range.getClientRects()[0];
        if (!rect) return 0;
        let top = rect.top + inkOf(line.data, getComputedStyle(line.parentElement)).top + window.scrollY;
        for (let e = el; e && e !== root; e = e.parentElement) {
            top -= new DOMMatrixReadOnly(getComputedStyle(e).transform).m42;
        }
        return ((((top - ANCHOR_OFFSET) % LINE_HEIGHT) + LINE_HEIGHT) % LINE_HEIGHT) - LINE_HEIGHT;
    }

    function rebuildMask() {
        const w = maskCanvas.width;
        const h = maskCanvas.height;
        if (!w || !h) return;

        gridTop = rowsTop();
        const scaleY = MASK_CELL[1] / LINE_HEIGHT;
        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.clearRect(0, 0, w, h);
        maskCtx.setTransform(MASK_CELL[0] / grid.cellW, 0, 0, scaleY, 0, -gridTop * scaleY);
        maskCtx.globalCompositeOperation = 'lighten';

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
        // Content fills its zones with red as strong as its opacity; where zones overlap, the stronger red stays.
        // Content that has faded out draws nothing.
        let sum = 0;
        const paint = (el) => {
            const alpha = alphaOf(el);
            sum += alpha;
            maskCtx.fillStyle = `rgb(${Math.round(alpha * 255)}, 0, 0)`;
            return alpha >= 0.02;
        };
        const shields = new Set();
        const frosted = new Set();
        const dividers = [];
        const controls = [];
        for (const el of root.querySelectorAll(surfaces)) {
            const style = styleOf(el);
            const borders = bordersOf(style).length;
            if (style.backdropFilter !== 'none') frosted.add(el);
            else if (hasFill(style) || borders === SIDES.length) shields.add(el);
            else if (borders) dividers.push(el);
            else controls.push(el);
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
            if (isCovered(surface) || !paint(surface)) continue;
            drawBox(surface.getBoundingClientRect(), parseFloat(styleOf(surface).borderTopLeftRadius) || 0);
        }
        for (const el of dividers) {
            if (isCovered(el) || !paint(el)) continue;
            const style = styleOf(el);
            const box = el.getBoundingClientRect();
            for (const side of bordersOf(style)) drawBox(borderLine(box, style, side), 0);
        }
        for (const el of controls) {
            if (isCovered(el) || !paint(el)) continue;
            range.selectNodeContents(el);
            drawBox(range.getBoundingClientRect(), 0);
            const band = underlineOf(el);
            if (band) drawBox(band, 0);
        }
        for (const el of root.querySelectorAll('svg, hr, img, video')) {
            if (shields.has(el) || frosted.has(el) || isCovered(el) || !paint(el)) continue;
            drawBox(el.getBoundingClientRect(), 4);
        }
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const el = node.parentElement;
            if (!el || !node.data.trim() || shields.has(el) || frosted.has(el) || isCovered(el)) continue;
            if (!paint(el)) continue;
            const style = styleOf(el);
            const ink = inkOf(node.data, style);
            const text = node.data.trim();
            const chars = graphemes.segment(text);
            const start = inkOf(chars.containing(0).segment, style);
            const end = inkOf(chars.containing(text.length - 1).segment, style);
            range.selectNodeContents(node);
            const rects = range.getClientRects();
            for (let i = 0; i < rects.length; i++) {
                drawLine(rects[i], ink, i === 0 && start, i === rects.length - 1 && end);
            }
        }
        fading = sum !== shownSum;
        shownSum = sum;

        // A cell takes the strongest red of the content that covers it, and shows that much less of its art.
        const { data } = maskCtx.getImageData(0, 0, w, h);
        const { cols, rows, cellW } = grid;
        const [across, down] = MASK_CELL;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                let veil = 0;
                for (let my = y * down; my < (y + 1) * down; my++) {
                    for (let mx = x * across; mx < (x + 1) * across; mx++) {
                        const k = (my * w + mx) * 4;
                        if (data[k + 3] >= CLEAR_AT * 255) veil = Math.max(veil, data[k]);
                    }
                }
                visible[y * cols + x] = 255 - veil;
            }
        }
        // Rows below the screen show nothing, so strips of art end at the screen's edge.
        visible.fill(0, Math.ceil((viewH - gridTop) / LINE_HEIGHT) * cols);
        glass.fill(0);
        for (const panel of frosted) {
            if (isCovered(panel)) continue;
            const rect = panel.getBoundingClientRect();
            const y1 = Math.min(rows, Math.round((rect.bottom - gridTop) / LINE_HEIGHT));
            const x1 = Math.min(cols, Math.round(rect.right / cellW));
            for (let y = Math.max(0, Math.round((rect.top - gridTop) / LINE_HEIGHT)); y < y1; y++) {
                for (let x = Math.max(0, Math.round(rect.left / cellW)); x < x1; x++) glass[y * cols + x] = 1;
            }
        }
        clearStrips(visible, glass, rows, cols, cols, 1, minStripCols);
        clearStrips(visible, glass, cols, rows, 1, cols, MIN_STRIP.rows);
        clearPockets(visible, glass, rows, cols, MAX_POCKET);
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

    // Where the camera wants to be for an object: its page's slot. Until the page is on screen, it heads for
    // where the object last rested, or a guess, and then eases from there to the slot, so the trip bends
    // instead of jumping.
    function restingFraming(name) {
        const box = slotRect();
        if (!box) {
            guess =
                lastFraming[name] ??
                framingIn(name, {
                    left: GUESS_SLOT.left * viewW,
                    top: GUESS_SLOT.top * viewH,
                    width: GUESS_SLOT.width * viewW,
                    height: GUESS_SLOT.height * viewH,
                });
            guessedAt = clock;
            return guess;
        }
        const framing = framingIn(name, box);
        // Each visit starts at the top of the page.
        if (!window.scrollY) lastFraming[name] = framing;
        const settle = guess && !reducedMotion ? smoothstep(0, SETTLE_SECONDS, clock - guessedAt) : 1;
        if (settle >= 1) {
            guess = null;
            return framing;
        }
        return {
            ...framing,
            distance: Math.exp(lerp(Math.log(guess.distance), Math.log(framing.distance), settle)),
            shift: [lerp(guess.shift[0], framing.shift[0], settle), lerp(guess.shift[1], framing.shift[1], settle)],
        };
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
    // A screen narrower than it is tall shows less of the world from side to side, so there the limit shrinks
    // with the screen's width, and objects cross a phone screen about as fast as a wide one.
    function humpFor(a, b) {
        const gap = Math.hypot(b.target[0] - a.target[0], b.target[1] - a.target[1], b.target[2] - a.target[2]);
        const limit = MAX_SWEEP * Math.min(1, viewW / viewH);
        const sweep = (hump) => gap / pathLength(a, b, hump).total;
        if (sweep(0) <= limit) return 0;
        let low = 0;
        let high = 12;
        for (let i = 0; i < 20; i++) {
            const mid = (low + high) / 2;
            if (sweep(mid) > limit) low = mid;
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
        const a = (travel.a ??= { ...rest, distance: rest.distance * travel.introDistance });
        const k = progress();
        const e = easeInOut(k);
        if (travel.cut) {
            const t = k * travel.duration;
            const away = t < CUT.away;
            const { target, distance } = away ? a : rest;
            const steps = away
                ? Math.log(CUT.back) * easeInOut(t / CUT.away)
                : Math.log(CUT.ahead) * (1 - easeOut((t - CUT.away) / CUT.toward));
            travel.across = away ? 0 : 1;
            // The camera turns and shifts over the whole trip, so the stars do not jump at the cut.
            current = {
                target,
                view: normalize(lerp3(a.view, rest.view, e)),
                distance: distance * Math.exp(steps),
                shift: [lerp(a.shift[0], rest.shift[0], e), lerp(a.shift[1], rest.shift[1], e)],
            };
        } else {
            const hump = humpFor(a, rest);
            const { sum, total } = pathLength(a, rest, hump, e);
            travel.across = sum / total;
            current = {
                target: lerp3(a.target, rest.target, travel.across),
                view: normalize(lerp3(a.view, rest.view, travel.across)),
                distance: distanceAt(a, rest, hump, e),
                shift: [lerp(a.shift[0], rest.shift[0], e), lerp(a.shift[1], rest.shift[1], e)],
            };
        }
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
    // the end, and others show only in the middle of the trip. On a cut, the leaving object fades out as the
    // camera backs away from it, and the arriving one fades in as the camera closes in. Objects too small on
    // screen do not show.
    function gainOf(name) {
        if (!travel) return name === page ? show[name] : 0;
        const k = progress();
        const { near } = travel;
        const r = screenRadius(name);
        const seen = smoothstep(SEEN_RADIUS[0], SEEN_RADIUS[1], r);
        if (travel.cut) {
            const t = k * travel.duration;
            if (name === travel.from) return seen * travel.fromShow * (1 - smoothstep(0.1, CUT.away, t));
            if (name !== travel.to) return 0;
            return seen * show[name] * smoothstep(CUT.away, CUT.away + CUT.toward / 3, t);
        }
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
        // The art projects onto the rows, which start gridTop px from the top of the screen.
        cam.cy -= gridTop;
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
        const used = [];

        ctx.clearRect(0, 0, viewW, viewH);
        for (let y = 0; y < rows; y++) {
            // One string per material and opacity layer keeps this to a few fillText calls per row.
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                if (!visible[i]) continue;
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
                const layer = char === ' ' ? -1 : layerFor((alpha * visible[i]) / 255);
                if (layer < 0) continue;
                const row = rowLayers[material][layer];
                if (!used.includes(row)) used.push(row);
                row.chars[x] = char;
            }
            for (const row of used) {
                ctx.fillStyle = colors[row.material];
                ctx.globalAlpha = Math.min(1, row.alpha * alphaScale);
                ctx.fillText(row.chars.join(''), 0, gridTop + y * LINE_HEIGHT);
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

        // The mask follows layout on an interval, and on every frame while the page scrolls, content fades, or the
        // camera travels between pages.
        const scrolled = measureScroll(dt);
        const maskDue = scrolled || fading || travel || now - lastMask > MASK_INTERVAL;
        if (maskDue) {
            lastMask = now;
            rebuildMask();
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
            const cut = hump > CUT_HUMP;
            travel = {
                from: page,
                to: name,
                start: clock,
                a,
                fromShow: show[page],
                cut,
                // The camera needs no hump between nearby objects, so both can show for the whole trip.
                near: hump === 0,
                duration: cut
                    ? CUT.away + CUT.toward
                    : Math.min(TRAVEL.max, Math.max(TRAVEL.min, TRAVEL.base + TRAVEL.perStep * zoom)),
            };
        } else {
            const fit = widthFit(window.innerWidth);
            travel = {
                from: null,
                to: name,
                start: clock,
                a: null,
                near: false,
                duration: lerp(INTRO.seconds[0], INTRO.seconds[1], fit),
                introDistance: lerp(INTRO.distance[0], INTRO.distance[1], fit),
            };
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
