// The ASCII art behind the pages. Each page shows one object from a small shared world (see world.js), framed
// in the box its slot element marks. When the page changes, the camera flies from the old object to the new
// one: straight in or out when the two are close, and out, across and back in when they are farther apart. When
// they are too far apart for that, the camera leaves the old one as it fades out: it flies on past it when the
// new one lies beyond it, and backs away from it when not. Then it closes in on the new one as it fades in.
// Faint stars shift as the pointer moves, a finger taps, or the page scrolls.

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

const FONT_SIZE = 12;
const LINE_HEIGHT = 12;
const FRAME_MS = 1000 / 30;
const LAYER_ALPHAS = [0.16, 0.3, 0.48, 0.7, 0.95];
// Faint characters wash out on the light theme's pale background, so they draw this much stronger there.
const LIGHT_THEME_ALPHA = 2.8;
const FOV = 30;
const TAN_HALF_FOV = Math.tan((FOV * Math.PI) / 360);

// Settings given as [phone, desktop] pairs change from the first value at the first of these screen widths, in
// px, to the second value at the second.
const SCREEN_WIDTHS = [390, 1280];
// The first object flies in from `distance` times its resting distance over `seconds`, and settles about as the
// page content does. A phone shows less of the art and of the page at first, so the fly-in starts closer there.
const INTRO = { seconds: [1.5, 1.8], distance: [2.2, 6] };
// A page change takes base seconds plus perStep for each step of zoom (a factor of e), within min and max.
const TRAVEL = { base: 0.9, perStep: 0.1, min: 0.9, max: 1.7 };
// On a trip the camera's target may sweep this many radians across the view. When the objects are farther
// apart, the camera backs off in the middle of the trip until the sweep fits.
const MAX_SWEEP = 1.25;
// Objects more than CUT_GAP world units apart, as Jupiter is from the others, are too far apart to fly between,
// so a trip between them is a cut: two moves, with no flight across the space between. First the camera leaves
// the old object as it fades out with its page, over the time the page takes to leave. When the new object lies
// beyond the old one, the camera flies on past the old one, `reach` times its distance toward the new one. When
// not, it backs off to `back` times its distance. Once the new page is on screen, the camera closes in on the
// new object from `ahead` times its resting distance over `toward` seconds, as the object fades in over the
// first third of that. It is still closing in as the new page's content lands, so the object grows around that
// content instead of the content cutting into an object at rest.
const CUT_GAP = 100;
const CUT = { toward: 1.3, back: 2, reach: 0.25, ahead: 2.5 };
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
// one box: from the top of its tallest letter to the bottom of its lowest, padded by TEXT_PADDING on every
// side. Emoji reach above the letters, so the art comes closer to them. Above and below, the padding is
// TEXT_INSET less: the art's characters leave the top and bottom pixels of their row empty. The box's corners
// curve by the padding, so the art keeps the padding at the corners too. Where a line reaches into the slot
// from outside it, its end that faces the art, with no other content within a cell beyond it, reaches
// TEXT_END_PADDING past the last letter from the top of the letters' ink down: the art that flows around the
// tip of the line stays a little farther from it, in a straight column, and keeps its character at the corner
// above the line. Text matching
// the hug selector, the home page's greeting and title, is what the art hugs: its rows and columns line up with
// the edges of that text's boxes, see ANCHOR_STEP, and when a row of art fits in the notch above the text's
// lowercase letters, each of its characters clears a box of its own around its ink, so the art fills the notches
// above the lowercase letters and between the lines of the title instead of stopping at the height of its
// capitals.
// Elements matching the surfaces selector clear their whole rounded box while they show a background or a
// border all around. One bordered on only some sides, such as a divider, clears just those lines. One with
// neither, such as a nav link, clears one box around its icon and text together, so the cut above them stays
// level, and the band where its ::after underline draws, so the art holds still while an underline grows in on
// hover. The home page's nav row is such an element too: it clears one straight box around all its links.
// Elements with a backdrop blur clear nothing: the art shows through them, blurred. The mask has
// MASK_CELL pixels across and down for each character cell, and content covers a cell where any of its mask
// pixels reaches CLEAR_AT. So the art keeps CLEAR_PADDING clear of content, even a thin line, and the edge
// around content is a clean cut along the rows and columns, with no soft edge. Content that reaches into a cell
// by less than CLEAR_AT of a mask pixel leaves the cell showing. So where the title's padding only grazes a row
// in one of its notches, that row of art still fills the notch. It keeps TEXT_PADDING clear of
// text, more than of other content: on phones and tablets whole paragraphs sit on the art and need room around
// them to read well. Strips of art narrower than MIN_STRIP between content, frosted panels and the screen edge
// are cleared too, so no slivers squeeze between them, and so are runs of at most MAX_POCKET cells in a row
// with content at both ends and right below, such as art that hangs into the gap between two nav links. The
// clear padding and the narrowest strip kept change from the first value at phone width to the second at
// desktop width.
const TEXT_PADDING = 10;
const TEXT_INSET = 2;
const TEXT_END_PADDING = 16;
// A two-row corner keeps a character beside lowercase shoulders across different font metrics.
const TEXT_HUG_RADIUS = LINE_HEIGHT * 2;
// Outline characters that reach the top or bottom of their row, see EDGE_CHARS. Next to hidden content above
// or below, they draw as dots instead, so the art keeps its padding from the content there.
const TALL_EDGES = new Set('_/\\|()');
// With hugged text on the page, the rows of art shift down by less than one row, and the columns right by less
// than one column, to line up with the text that clears a box per character. An edge of one of its boxes faces
// the art where no other content lies within a cell of it on that side; where the edge faces the art under the
// page's slot, the art sits closest to the text when a grid line falls on the edge, and up to a cell farther
// away when not. Each axis shifts to the offset, tried every ANCHOR_STEP px, with the least sum of squared slack
// over those edges, each weighted by the cells it spans, so the art stays close to the text's lowercase letters,
// its capitals, its bottom and its ends all at once, at every screen size. Where the text spans a little more
// than a whole number of rows, the spare room splits evenly above and below it: a row the text reaches into at
// all counts as cleared, even where the mask leaves it showing. Smaller hugged text moves down to the rows
// instead, by less than half a row, through its NUDGE_PROPERTY, where it reaches into the slot and meets the
// art: where the layout puts the greeting within half a row of lining up, a full row of art lines up above it,
// and it never moves away from the title below it.
const ANCHOR_STEP = 0.25;
const NUDGE_PROPERTY = '--art-nudge';
const MASK_CELL = [4, 4];
const MASK_INTERVAL = 150;
const CLEAR_PADDING = [4, 6];
const CLEAR_AT = 0.5;
const MIN_STRIP = { cols: [2, 3], rows: 2 };
const MAX_POCKET = 4;

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

const graphemes = new Intl.Segmenter();
const pictographs = /\p{Extended_Pictographic}️?/gu;

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
 * @param {string} options.hug Selector for the text the art hugs. Large hugged text lines the art's rows and
 * columns up with its edges, and its characters each clear a box of their own. Smaller hugged text moves down
 * to the rows instead where it reaches into the slot: it takes the --art-nudge custom property set on it, from 0
 * to less than half a row down, into its position.
 * @param {Record<string, object>} options.world Objects by name, see world.js.
 * @param {number} options.leave Seconds the old page takes to leave after setScene(), before the new one shows.
 */
export function createAsciiField(canvas, { root, surfaces, slot, hug, world, leave }) {
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
    let gridLeft = 0; // and where the first column starts, at or left of its left edge
    let visible = new Uint8Array(0); // how much each cell shows its art, from 0 (none) to 255 (all of it)
    let glass = new Uint8Array(0); // 1 where a frosted panel covers a cell
    let clearPadding = CLEAR_PADDING[1];
    let minStripCols = MIN_STRIP.cols[1];
    let rowLayers = [];

    let page = null; // name of the object the current page shows
    let current = null; // where the camera is now: { target, view, distance, shift }
    let travel = null; // the page change in progress: { from, to, start, duration, a, cut, arrive }
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
        // One row and one column more than the screen needs, for when the grid shifts to line up with hugged text.
        const cellW = ctx.measureText('M').width;
        grid.resize(
            width,
            height,
            cellW,
            LINE_HEIGHT,
            Math.ceil(height / LINE_HEIGHT) + 1,
            Math.ceil(width / cellW) + 1,
        );
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

    // Where a text's letters draw in its box: the top of their ink below the box's top, how far it starts past
    // the box's left edge, and its size. Emoji do not count: they reach above the letters.
    function inkOf(text, style) {
        maskCtx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        const metrics = maskCtx.measureText(text.replace(pictographs, '') || text);
        const { actualBoundingBoxAscent: ascent, actualBoundingBoxLeft: left } = metrics;
        return {
            top: metrics.fontBoundingBoxAscent - ascent,
            left: -left,
            width: left + metrics.actualBoundingBoxRight,
            height: ascent + metrics.actualBoundingBoxDescent,
        };
    }

    // The box that text clears around its ink: padded by TEXT_PADDING to each side and by TEXT_INSET less above
    // and below.
    function inkBox(left, top, width, height) {
        return new DOMRect(
            left - TEXT_PADDING,
            top - TEXT_PADDING + TEXT_INSET,
            width + TEXT_PADDING * 2,
            height + (TEXT_PADDING - TEXT_INSET) * 2,
        );
    }

    // The box a line of text clears: as wide as the line, as tall as its ink.
    const lineBox = (rect, ink) => inkBox(rect.left, rect.top + ink.top, rect.width, ink.height);

    // Whether a row of art fits in the notch above a text's lowercase letters, between their tops and the tops
    // of its capitals.
    const notchFits = (style) => inkOf('x', style).top - inkOf('H', style).top >= LINE_HEIGHT;

    // The boxes that a text node clears character by character: one around each character's ink. Spaces clear
    // nothing.
    function glyphBoxes(node, style, layoutRect) {
        const boxes = [];
        for (const { segment, index } of graphemes.segment(node.data)) {
            if (!segment.trim()) continue;
            range.setStart(node, index);
            range.setEnd(node, index + segment.length);
            const rect = range.getBoundingClientRect();
            const ink = inkOf(segment, style);
            const box = inkBox(rect.left + ink.left, rect.top + ink.top, ink.width, ink.height);
            const layout = layoutRect(rect, node.parentElement);
            box.layout = inkBox(layout.left + ink.left, layout.top + ink.top, ink.width, ink.height);
            boxes.push(box);
        }
        return boxes;
    }

    // Grid placement uses layout boxes before animation or the greeting's nudge. Scrolling changes which edges
    // face the art, while their page positions keep the grid still.
    function boxesOf(shapes) {
        const boxes = [];
        for (const { rects, hug } of shapes) {
            for (const { layout: at } of rects) {
                const rest = {
                    left: at.left,
                    right: at.right,
                    top: at.top + window.scrollY,
                    bottom: at.bottom + window.scrollY,
                };
                boxes.push({ at, rest, hug });
            }
        }
        return boxes;
    }

    // Where the rows ('y') or the columns ('x') of art start: one cell before the offset with the least weighted
    // sum of squared slack over the edges of the hugged boxes that face the art under the slot, see ANCHOR_STEP,
    // or 0 without such edges.
    function gridStart(boxes, slotBox, axis) {
        const vertical = axis === 'y';
        const [lo, hi, from, to] = vertical ? ['top', 'bottom', 'left', 'right'] : ['left', 'right', 'top', 'bottom'];
        const period = vertical ? LINE_HEIGHT : grid.cellW; // the cell size along the axis
        const across = vertical ? grid.cellW : LINE_HEIGHT; // and across it
        const first = Math.max(0, Math.floor(slotBox[from] / across));
        const last = Math.ceil(slotBox[to] / across);
        // Each edge's place at rest, the sign that turns its distance past a grid line into its slack, and the
        // cells across the axis where it faces the art.
        const edges = [];
        boxes.forEach(({ at, rest, hug }, i) => {
            if (!hug) return;
            const k0 = Math.max(first, Math.floor(at[from] / across));
            const k1 = Math.min(last, Math.ceil(at[to] / across));
            for (const [edge, sign] of [
                [lo, 1],
                [hi, -1],
            ]) {
                if (at[edge] < slotBox[lo] || at[edge] > slotBox[hi]) continue;
                // Whether another box covers the art within one cell beyond the edge: before a lo edge, after a
                // hi edge.
                const beyond = (other) =>
                    sign > 0
                        ? other[lo] < at[lo] && other[hi] > at[lo] - period
                        : other[hi] > at[hi] && other[lo] < at[hi] + period;
                let count = 0;
                for (let k = k0; k < k1; k++) {
                    const covered = boxes.some(
                        (box, j) =>
                            j !== i && box.at[to] > k * across && box.at[from] < (k + 1) * across && beyond(box.at),
                    );
                    if (!covered) count++;
                }
                if (count) edges.push([rest[edge], sign, count]);
            }
        });
        if (!edges.length) return 0;
        let best = 0;
        let least = Infinity;
        for (let offset = 0; offset < period; offset += ANCHOR_STEP) {
            let cost = 0;
            for (const [place, sign, weight] of edges) {
                const slack = (((sign * (place - offset)) % period) + period) % period;
                cost += weight * slack * slack;
            }
            if (cost < least) {
                least = cost;
                best = offset;
            }
        }
        return best - period;
    }

    function rebuildMask() {
        const w = maskCanvas.width;
        const h = maskCanvas.height;
        if (!w || !h) return;

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
        // Page animations translate and scale. Undo them before measuring the grid's anchors, including a
        // divider whose scale starts at zero. The greeting follows the grid, so its nudge cannot move anchors.
        const layoutRect = (rect, el) => {
            for (; el && el !== root; el = el.parentElement) {
                const style = styleOf(el);
                if (style.transform !== 'none') {
                    const matrix = new DOMMatrixReadOnly(style.transform);
                    const box = el.getBoundingClientRect();
                    const [ox, oy] = style.transformOrigin.split(' ').map(parseFloat);
                    const left = box.left - matrix.m41 - ox * (1 - matrix.a);
                    const top = box.top - matrix.m42 - oy * (1 - matrix.d);
                    rect = new DOMRect(
                        left + (matrix.a ? (rect.left - box.left) / matrix.a : 0),
                        top + (matrix.d ? (rect.top - box.top) / matrix.d : 0),
                        matrix.a ? rect.width / matrix.a : parseFloat(style.width),
                        matrix.d ? rect.height / matrix.d : parseFloat(style.height),
                    );
                }
                const nudge = parseFloat(el.style.getPropertyValue(NUDGE_PROPERTY)) || 0;
                if (nudge) rect = new DOMRect(rect.left, rect.top - nudge, rect.width, rect.height);
            }
            return rect;
        };
        // Content covers its boxes as strongly as its opacity: the boxes are collected first, to line the rows up
        // with, and drawn once the rows are placed. Where boxes overlap, the strongest stays.
        let sum = 0;
        const shapes = [];
        let alpha = 0; // of the element whose boxes are being collected
        let element;
        const collect = (el) => {
            element = el;
            alpha = alphaOf(el);
            sum += alpha;
        };
        // A shape's boxes draw as one path, so where a hugged text's boxes overlap, the mask's edge is no stronger.
        const add = (rects, radius, text = false, hug = false, span = null) =>
            shapes.push({ rects, radius, alpha, text, hug, span });
        // An element's box, padded by clearPadding, with corners that curve by its border radius and the padding.
        const addBox = (rect, radius) => {
            if (!rect.width && !rect.height) return;
            const r = Math.min(radius, rect.width / 2, rect.height / 2) + clearPadding;
            const pad = (box) =>
                new DOMRect(
                    box.left - clearPadding,
                    box.top - clearPadding,
                    box.width + clearPadding * 2,
                    box.height + clearPadding * 2,
                );
            const box = pad(rect);
            box.layout = pad(layoutRect(rect, element));
            add([box], r);
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
            if (isCovered(surface)) continue;
            collect(surface);
            addBox(surface.getBoundingClientRect(), parseFloat(styleOf(surface).borderTopLeftRadius) || 0);
        }
        for (const el of dividers) {
            if (isCovered(el)) continue;
            collect(el);
            const style = styleOf(el);
            const box = el.getBoundingClientRect();
            for (const side of bordersOf(style)) addBox(borderLine(box, style, side), 0);
        }
        for (const el of controls) {
            if (isCovered(el)) continue;
            collect(el);
            range.selectNodeContents(el);
            addBox(range.getBoundingClientRect(), 0);
            const band = underlineOf(el);
            if (band) addBox(band, 0);
        }
        for (const el of root.querySelectorAll('svg, hr, img, video')) {
            if (shields.has(el) || frosted.has(el) || isCovered(el)) continue;
            collect(el);
            addBox(el.getBoundingClientRect(), 4);
        }
        // Text boxes curve at the corners by the padding. Hugged text uses wider corners around each character
        // when a row of art fits in the notches above its lowercase letters, and anchors the grid. Smaller hugged
        // text, like the greeting, clears one box per line and follows the rows instead: its first line's box on
        // screen and its top at rest, by the element the nudge goes on.
        const followers = new Map();
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const el = node.parentElement;
            if (!el || !node.data.trim() || shields.has(el) || frosted.has(el) || isCovered(el)) continue;
            collect(el);
            const style = styleOf(el);
            const hugged = hug && el.closest(hug);
            // The whole text's box, the title's two words together: whether it lies within the slot.
            const span = (hugged || el).getBoundingClientRect();
            if (hugged && notchFits(style)) {
                add(glyphBoxes(node, style, layoutRect), TEXT_HUG_RADIUS, true, true, span);
                continue;
            }
            const ink = inkOf(node.data, style);
            range.selectNodeContents(node);
            const rects = Array.from(range.getClientRects(), (rect) => {
                const box = lineBox(rect, ink);
                box.layout = lineBox(layoutRect(rect, el), ink);
                return box;
            });
            add(rects, TEXT_PADDING, true, false, span);
            if (hugged && rects.length && !followers.has(hugged)) {
                followers.set(hugged, { box: rects[0].layout, top: rects[0].layout.top + window.scrollY });
            }
        }
        // An end of a text's box faces the art where no other content lies within a cell beyond the middle of that
        // end. The boxes of a word's letters overlap, so only its first and last letters have such ends. A box
        // that only touches another above or below it, as the greeting's can touch the title's, keeps its ends.
        // Where a text reaches into the slot from outside it, as the title does on desktop, its end under the
        // slot clears one more box, from the top of the letters' ink to the bottom of their box, that reaches
        // TEXT_END_PADDING past the text. So beside and below the letters the column of art is straight, a little
        // farther from the tip of the line that the art flows around, while the row above the line keeps its
        // character at the corner of the end. Text within the slot keeps TEXT_PADDING at its ends.
        const slotBox = findSlot()?.rect ?? new DOMRect(0, 0, viewW, viewH);
        const all = shapes.flatMap((shape) => shape.rects.map((rect) => rect.layout));
        for (const shape of shapes) {
            if (!shape.text) continue;
            const within = shape.span.left >= slotBox.left && shape.span.right <= slotBox.right;
            shape.rects = shape.rects.flatMap((rect) => {
                const layout = rect.layout;
                const middle = (layout.top + layout.bottom) / 2;
                const faces = [-1, 1].map(
                    (sign) =>
                        !all.some(
                            (other) =>
                                other !== layout &&
                                other.top < middle &&
                                other.bottom > middle &&
                                (sign < 0
                                    ? other.left < layout.left && other.right > layout.left - grid.cellW
                                    : other.right > layout.right && other.left < layout.right + grid.cellW),
                        ),
                );
                if (within) return [rect];
                const inkTop = rect.top + TEXT_PADDING - TEXT_INSET;
                const ends = [];
                [rect.left, rect.right].forEach((x, i) => {
                    const edge = i ? layout.right : layout.left;
                    if (!faces[i] || edge <= slotBox.left || edge >= slotBox.right) return;
                    const left = i ? x - TEXT_PADDING * 2 : x - (TEXT_END_PADDING - TEXT_PADDING);
                    const end = new DOMRect(left, inkTop, TEXT_PADDING + TEXT_END_PADDING, rect.bottom - inkTop);
                    const layoutLeft = i ? edge - TEXT_PADDING * 2 : edge - (TEXT_END_PADDING - TEXT_PADDING);
                    const layoutTop = layout.top + TEXT_PADDING - TEXT_INSET;
                    end.layout = new DOMRect(
                        layoutLeft,
                        layoutTop,
                        TEXT_PADDING + TEXT_END_PADDING,
                        layout.bottom - layoutTop,
                    );
                    ends.push(end);
                });
                return [rect, ...ends];
            });
        }
        fading = sum !== shownSum;
        shownSum = sum;

        // Content fills its boxes with red as strong as its opacity, into the grid as placed. Content that has
        // faded out draws nothing.
        const boxes = boxesOf(shapes);
        gridTop = gridStart(boxes, slotBox, 'y');
        gridLeft = gridStart(boxes, slotBox, 'x');
        // A follower that reaches into the slot moves down so that a row line falls on its top edge, when that
        // takes less than half a row: by the nudge that takes its top, as laid out without the nudge it has now,
        // to the row line below it. One farther from that line, or outside the slot, stays where the layout puts
        // it. So the greeting never moves away from the title. The mask takes the move at the next rebuild.
        for (const [el, { box, top }] of followers) {
            const meetsArt =
                box.right > slotBox.left &&
                box.left < slotBox.right &&
                box.bottom > slotBox.top &&
                box.top < slotBox.bottom;
            const slack = meetsArt ? (((gridTop - top) % LINE_HEIGHT) + LINE_HEIGHT) % LINE_HEIGHT : 0;
            const nudge = slack < LINE_HEIGHT / 2 ? slack : 0;
            const previous = parseFloat(el.style.getPropertyValue(NUDGE_PROPERTY)) || 0;
            // Range bounds can round differently after a nudge. Ignore changes below half an anchor step.
            if (Math.abs(nudge - previous) >= ANCHOR_STEP / 2) {
                el.style.setProperty(NUDGE_PROPERTY, `${nudge.toFixed(2)}px`);
            }
        }
        const scaleX = MASK_CELL[0] / grid.cellW;
        const scaleY = MASK_CELL[1] / LINE_HEIGHT;
        maskCtx.setTransform(1, 0, 0, 1, 0, 0);
        maskCtx.clearRect(0, 0, w, h);
        maskCtx.setTransform(scaleX, 0, 0, scaleY, -gridLeft * scaleX, -gridTop * scaleY);
        maskCtx.globalCompositeOperation = 'lighten';
        for (const { rects, radius, alpha: shown } of shapes) {
            if (shown < 0.02) continue;
            maskCtx.fillStyle = `rgb(${Math.round(shown * 255)}, 0, 0)`;
            maskCtx.beginPath();
            rects.forEach((rect) => {
                if (rect.bottom < -LINE_HEIGHT || rect.top > viewH + LINE_HEIGHT) return;
                maskCtx.roundRect(rect.x, rect.y, rect.width, rect.height, radius);
            });
            maskCtx.fill();
        }

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
            const x1 = Math.min(cols, Math.round((rect.right - gridLeft) / cellW));
            for (let y = Math.max(0, Math.round((rect.top - gridTop) / LINE_HEIGHT)); y < y1; y++) {
                for (let x = Math.max(0, Math.round((rect.left - gridLeft) / cellW)); x < x1; x++) {
                    glass[y * cols + x] = 1;
                }
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
        if (travel.cut) {
            // The camera leaves the old object until the new page is on screen, and then closes in on the new one.
            const t = clock - travel.start;
            const arriving = travel.arrive !== null && t >= travel.arrive;
            const u = arriving ? Math.min(1, (t - travel.arrive) / CUT.toward) : Math.min(1, t / leave);
            let { target, distance } = arriving ? rest : a;
            let turn = 0;
            if (arriving) {
                turn = 1 - (1 - u) ** 2;
                distance *= CUT.ahead ** (1 - turn);
            } else if (travel.heading) {
                // On past the old object, toward the new one, without turning, and faster and faster. A screen
                // narrower than it is tall would carry the object farther across it, so there it goes less far.
                const along = CUT.reach * Math.min(1, viewW / viewH) * distance * u * u;
                target = target.map((v, i) => v + travel.heading[i] * along);
            } else {
                distance *= CUT.back ** easeInOut(u);
            }
            travel.across = arriving ? 1 : 0;
            // The camera turns and shifts only as it closes in, from the old object's framing to the new one's, so
            // the stars do not jump at the cut.
            current = {
                target,
                view: normalize(lerp3(a.view, rest.view, turn)),
                distance,
                shift: [lerp(a.shift[0], rest.shift[0], turn), lerp(a.shift[1], rest.shift[1], turn)],
            };
            if (turn >= 1) travel = null;
            return;
        }
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
            const t = clock - travel.start;
            const { arrive } = travel;
            if (name === travel.from) return seen * travel.fromShow * (1 - smoothstep(leave / 4, leave, t));
            if (name !== travel.to || arrive === null) return 0;
            return seen * show[name] * smoothstep(arrive, arrive + CUT.toward / 3, t);
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
        // The art projects onto the grid, whose columns start gridLeft px from the left edge of the screen and
        // whose rows start gridTop px from its top.
        cam.cx -= gridLeft;
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
        const shown = Math.ceil((viewH - gridTop) / LINE_HEIGHT); // rows on screen
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
                    const hiddenAbove = y > 0 && !visible[i - cols];
                    const hiddenBelow = y + 1 < shown && !visible[i + cols];
                    if (TALL_EDGES.has(char) && (hiddenAbove || hiddenBelow)) char = '·';
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
                    } else if (star[i] && !glass[i]) {
                        // Stars blur into spots behind frosted panels, so they stop at the panel's edge.
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
                ctx.fillText(row.chars.join(''), gridLeft, gridTop + y * LINE_HEIGHT);
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
            const offset = [0, 1, 2].map((i) => rest.target[i] - a.target[i]);
            const cut = Math.hypot(...offset) > CUT_GAP;
            // The new object lies beyond the old one when it is farther along the camera's line of sight.
            const heading = normalize(offset);
            const beyond = cut && heading[0] * a.view[0] + heading[1] * a.view[1] + heading[2] * a.view[2] < 0;
            travel = {
                from: page,
                to: name,
                start: clock,
                a,
                fromShow: show[page],
                cut,
                // On a cut, seconds into the trip when the camera starts to close in on the new object: unknown
                // until the new page is on screen.
                arrive: null,
                heading: beyond ? heading : null,
                // The camera needs no hump between nearby objects, so both can show for the whole trip.
                near: hump === 0,
                duration: cut
                    ? leave + CUT.toward
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

    // The new page is on screen, so its slot can be used. A cut starts to close in on the new object now, or when
    // the old one has left, and heads straight for the slot, so the object never shows at a guess.
    function relayout() {
        slotReady = true;
        lastMask = 0;
        if (travel?.cut && travel.arrive === null) {
            travel.arrive = Math.max(clock - travel.start, leave);
            travel.duration = travel.arrive + CUT.toward;
            if (drawn[travel.to] < 0.01) epoch[travel.to] = travel.start + travel.duration;
            guess = null;
        }
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
