// The ASCII art behind the pages: one large object per page, placed in the open space beside the content,
// with faint stars, a lens under the pointer, and ripples where the page is clicked. While the page changes,
// the old object rushes past the camera, the new one flies in from far away, and the x, y and z planes of
// each scene swing into view.

import {
    EDGE_CHARS,
    LAST,
    LINE_CHARS,
    RAMP,
    aim,
    clamp01,
    createCamera,
    createGrid,
    drawPlanes,
    drawStars,
    easeIn,
    easeOut,
    freeDistance,
    normalize,
    smoothstep,
    toneDensity,
    traceOutlines,
} from './render.js';

const FONT_SIZE = 14;
const LINE_HEIGHT = 16;
const FRAME_MS = 1000 / 30;
const LAYER_ALPHAS = [0.16, 0.3, 0.48, 0.7, 0.95];
const FOV = 30;

// Page changes, in seconds.
const INTRO_SECONDS = 1.8;
const ARRIVE_SECONDS = 1.1;
const LEAVE_SECONDS = 0.7;
// The new object waits this long for the new page before it finds a place anyway.
const ARRIVE_TIMEOUT = 0.8;
// After a page change or resize, the object follows the layout for this long, then holds still.
const PLACE_SECONDS = 1.5;
const PLACE_EASE = 0.2;
const SHOW_EASE = 0.08;
// Open space kept between page content and the object, and between the screen edge and the object, in px.
const KEEP_OUT = 36;
const EDGE_MARGIN = 24;

const LENS_RADIUS = 110;
const RIPPLE_SPEED = 420;
const RIPPLE_WIDTH = 18;
const RIPPLE_LIFE = 1.4;
const MAX_RIPPLES = 5;
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]';

// Page content is drawn into a low-resolution mask, weighted by its opacity. Large type clears by glyph
// shape and smaller text by line box. Elements matching the surfaces selector clear their whole rounded box
// while they show a background, border, or backdrop blur. The blurred mask fades characters near content.
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

const isVisibleColor = (color) => color !== 'transparent' && !/[,/]\s*0\)$/.test(color);
const SIDES = ['Top', 'Right', 'Bottom', 'Left'];
const hasSurface = (style) =>
    isVisibleColor(style.backgroundColor) ||
    style.backgroundImage !== 'none' ||
    style.backdropFilter !== 'none' ||
    SIDES.some((side) => parseFloat(style[`border${side}Width`]) > 0 && isVisibleColor(style[`border${side}Color`]));

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
 * @param {Record<string, object>} options.scenes Scene for each page name, see scenes/earth.js.
 */
export function createAsciiField(canvas, { root, surfaces, scenes }) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = canvas.getContext('2d');
    const grid = createGrid();
    const leaveCam = createCamera();
    const arriveCam = createCamera();
    const range = document.createRange();
    const maskCanvas = document.createElement('canvas');
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    const listeners = new AbortController();
    const pointer = { x: 0, y: 0, sx: 0, sy: 0, strength: 0, target: 0 };
    const ripples = [];
    const startTime = performance.now();
    // Where each page's object sits: screen center (px), size (px per scene unit) and how visible it is.
    const places = Object.fromEntries(
        Object.keys(scenes).map((name) => [
            name,
            { x: 0, y: 0, scale: 1, show: 0, target: { x: 0, y: 0, scale: 1, show: 0 } },
        ]),
    );

    let ink = '';
    let viewW = 1;
    let viewH = 1;
    let maskA = new Float32Array(0);
    let maskB = new Float32Array(0);
    let targetVisibility = new Float32Array(0);
    let visibility = new Float32Array(0);
    let occupied = new Uint8Array(0);
    let free = new Float32Array(0);
    let rowLayers = [];

    let page = null;
    let leaving = null; // { name, start, gain }
    let pageStart = 0;
    let arriveStart = -1;
    let arriveSeconds = INTRO_SECONDS;
    let hasArrived = false;
    let placeUntil = 0;
    let snapPlace = true;

    let clock = 0;
    let frameId = 0;
    let lastFrame = 0;
    let lastMask = 0;
    let lastScrollY = window.scrollY;
    let speed = 0; // how fast the page scrolls, in px per second

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
        occupied = new Uint8Array(n);
        free = new Float32Array(n);
        rowLayers = LAYER_ALPHAS.map(() => new Array(grid.cols));

        relayout();
        rebuildMask(true);
        if (reducedMotion) redraw();
    }

    function refreshColors() {
        // The computed color resolves the theme's CSS variables to a plain rgb() string the canvas accepts.
        ink = getComputedStyle(canvas).color;
        if (reducedMotion) redraw();
    }

    /* ---------- Content mask and open space ---------- */

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

    // Marks the cells near a box as taken, so objects are placed away from it.
    function occupy(rect) {
        if (!rect.width && !rect.height) return;
        const { cols, rows, cellW } = grid;
        const x0 = Math.max(0, Math.floor((rect.left - KEEP_OUT) / cellW));
        const x1 = Math.min(cols - 1, Math.floor((rect.right + KEEP_OUT) / cellW));
        const y0 = Math.max(0, Math.floor((rect.top - KEEP_OUT) / LINE_HEIGHT));
        const y1 = Math.min(rows - 1, Math.floor((rect.bottom + KEEP_OUT) / LINE_HEIGHT));
        if (x0 > x1) return;
        for (let y = y0; y <= y1; y++) occupied.fill(1, y * cols + x0, y * cols + x1 + 1);
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
        occupied.fill(0);

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
        const surfaceSet = new Set([...root.querySelectorAll(surfaces)].filter((el) => hasSurface(styleOf(el))));
        const isCovered = (el) => {
            if (!el || el === root) return false;
            if (!covered.has(el)) covered.set(el, surfaceSet.has(el.parentElement) || isCovered(el.parentElement));
            return covered.get(el);
        };

        // Content still fading in counts as taken, so objects are placed for the page as it will look.
        for (const surface of surfaceSet) {
            if (isCovered(surface)) continue;
            const rect = surface.getBoundingClientRect();
            occupy(rect);
            maskCtx.globalAlpha = alphaOf(surface);
            drawBox(rect, parseFloat(styleOf(surface).borderTopLeftRadius) || 0);
        }
        for (const el of root.querySelectorAll('svg, hr, img, video')) {
            if (surfaceSet.has(el) || isCovered(el)) continue;
            const rect = el.getBoundingClientRect();
            occupy(rect);
            maskCtx.globalAlpha = alphaOf(el);
            drawBox(rect, 4);
        }
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
            const el = node.parentElement;
            if (!el || !node.data.trim() || surfaceSet.has(el) || isCovered(el)) continue;
            range.selectNodeContents(node);
            const lines = range.getClientRects();
            for (const rect of lines) occupy(rect);

            const alpha = alphaOf(el);
            if (alpha < 0.02) continue;
            maskCtx.globalAlpha = alpha;
            const style = styleOf(el);
            if (parseFloat(style.fontSize) >= GLYPH_MIN_FONT_SIZE) drawGlyphs(node, style);
            else for (const rect of lines) drawBox(rect, rect.height / 2);
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

    /* ---------- Placement ---------- */

    // Finds the largest open spot for the page's object, leaning toward where the scene prefers to sit.
    function place() {
        const scene = scenes[page];
        if (!scene) return;
        const { cols, rows, cellW } = grid;
        const [halfW, halfH] = scene.extent;

        // A band along the screen edge counts as taken too, so objects stay whole.
        const bandX = Math.ceil(EDGE_MARGIN / cellW);
        const bandY = Math.ceil(EDGE_MARGIN / LINE_HEIGHT);
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (x < bandX || y < bandY || x >= cols - bandX || y >= rows - bandY) occupied[y * cols + x] = 1;
            }
        }
        freeDistance(occupied, cols, rows, ((halfH / halfW) * cellW) / LINE_HEIGHT, free);

        const maxScale = Math.min((scene.fit.max[0] * viewW) / halfW, (scene.fit.max[1] * viewH) / halfH);
        const cap = (maxScale * halfW) / cellW;
        let best = 0;
        let bestIndex = -1;
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                // Room up to the largest size counts fully; beyond it, extra room only centers the object.
                const score =
                    (Math.min(free[i], cap) + 0.3 * free[i]) * scene.prefer((x + 0.5) / cols, (y + 0.5) / rows);
                if (score > best) {
                    best = score;
                    bestIndex = i;
                }
            }
        }

        const target = places[page].target;
        if (bestIndex < 0) {
            target.show = 0;
        } else {
            target.x = ((bestIndex % cols) + 0.5) * cellW;
            target.y = (Math.floor(bestIndex / cols) + 0.5) * LINE_HEIGHT;
            target.scale = Math.min((free[bestIndex] * cellW) / halfW, maxScale);
            // Without room for a readable size, the object stays hidden.
            target.show = target.scale * halfH >= scene.fit.min ? 1 : 0;
        }
        if (snapPlace) {
            Object.assign(places[page], target, { show: reducedMotion ? target.show : places[page].show });
            snapPlace = false;
        }
        if (arriveStart < 0) {
            arriveStart = clock;
            arriveSeconds = hasArrived ? ARRIVE_SECONDS : INTRO_SECONDS;
            hasArrived = true;
        }
    }

    function easePlace(p) {
        const ease = reducedMotion ? 1 : PLACE_EASE;
        p.x += (p.target.x - p.x) * ease;
        p.y += (p.target.y - p.y) * ease;
        p.scale += (p.target.scale - p.scale) * ease;
        p.show += (p.target.show - p.show) * (reducedMotion ? 1 : SHOW_EASE);
    }

    /* ---------- Scenes ---------- */

    // Places a scene's camera so its object sits at p, then draws the scene. leave runs from 0 to 1 while
    // the scene rushes past; arrive runs from 0 to 1 while it flies in.
    function drawScene(name, p, cam, t, { leave = 0, arrive = 1, gain, swing, boost }) {
        const scene = scenes[name];
        const focal = viewH / 2 / Math.tan((FOV * Math.PI) / 360);
        const distance = (focal / p.scale) * (1 + 3.2 * (1 - arrive) ** 2 - 0.85 * leave);
        const view = normalize(scene.view);
        const target = scene.center;
        const pos = [0, 1, 2].map((k) => target[k] + view[k] * distance);
        const fov = FOV + leave * 22;
        const shift = [p.x / viewW - 0.5, p.y / viewH - 0.5];
        aim(cam, grid, pos, target, fov, shift);
        if (!reducedMotion) {
            // The pointer turns the camera a little, for depth.
            const ox = pointer.sx * distance * 0.06;
            const oy = -pointer.sy * distance * 0.04;
            pos[0] += cam.rx * ox + cam.ux * oy;
            pos[1] += cam.uy * oy;
            pos[2] += cam.rz * ox + cam.uz * oy;
            aim(cam, grid, pos, target, fov, shift);
        }
        drawStars(grid, cam, t, gain);
        drawPlanes(grid, cam, scene.planeSize, gain, swing, boost);
        scene.render(grid, cam, { t, gain, speed, facing: p.x > viewW / 2 ? -1 : 1 });
    }

    function renderFrame(t) {
        grid.clear();
        if (leaving) {
            const k = (clock - leaving.start) / LEAVE_SECONDS;
            if (k >= 1) {
                leaving = null;
            } else {
                const leave = easeIn(k);
                drawScene(leaving.name, places[leaving.name], leaveCam, t, {
                    leave,
                    gain: leaving.gain * (1 - k) ** 1.6,
                    swing: leave * 1.4,
                    boost: Math.sin(Math.PI * Math.min(1, k * 2)),
                });
            }
        }
        if (page && arriveStart >= 0) {
            const p = places[page];
            easePlace(p);
            const k = reducedMotion ? 1 : clamp01((clock - arriveStart) / arriveSeconds);
            const arrive = easeOut(k);
            drawScene(page, p, arriveCam, t, {
                arrive,
                gain: smoothstep(0, 1, k) * p.show,
                swing: (1 - arrive) * -1.2,
                boost: k < 1 ? Math.sin(Math.PI * k) : 0,
            });
        }
        toneDensity(grid);
        traceOutlines(grid);
    }

    /* ---------- Characters ---------- */

    // Overlapping sine waves read as slow-moving weather on a terminal map; they show only under the lens.
    function weather(x, y, t) {
        const { cols, rows } = grid;
        const v =
            Math.sin(x * 0.07 + t * 0.6) +
            Math.sin(y * 0.11 - t * 0.4) +
            Math.sin((x * 0.6 + y) * 0.045 + t * 0.3) +
            Math.sin(Math.hypot(x - cols * 0.7, y - rows * 0.45) * 0.12 - t * 0.8);
        return clamp01(((v + 4) / 8 - 0.4) / 0.6);
    }

    function heat(px, py, t) {
        const dx = px - pointer.x;
        const dy = py - pointer.y;
        let h = pointer.strength * Math.exp(-(dx * dx + dy * dy) / (LENS_RADIUS * LENS_RADIUS));
        for (const ripple of ripples) {
            const age = t - ripple.start;
            const ring = (Math.hypot(px - ripple.x, py - ripple.y) - age * RIPPLE_SPEED) / RIPPLE_WIDTH;
            h += Math.exp(-ring * ring) * (1 - age / RIPPLE_LIFE);
        }
        return Math.min(1, h);
    }

    function draw(t) {
        const { cols, rows, cellW, lum, lines, lineCode, lineFamily, cover, shade, opacity, edge } = grid;
        const ease = reducedMotion ? 1 : VISIBILITY_EASE;
        while (ripples.length && t - ripples[0].start > RIPPLE_LIFE) ripples.shift();
        pointer.strength += (pointer.target - pointer.strength) * 0.12;
        const lens = !reducedMotion && (pointer.strength > 0.01 || ripples.length > 0);

        ctx.clearRect(0, 0, viewW, viewH);
        ctx.fillStyle = ink;
        for (let y = 0; y < rows; y++) {
            // One string per opacity layer keeps this to a few fillText calls per row.
            for (const layer of rowLayers) layer.fill(' ');
            let used = 0;
            for (let x = 0; x < cols; x++) {
                const i = y * cols + x;
                const v = (visibility[i] += (targetVisibility[i] - visibility[i]) * ease);
                if (v <= 0.02) continue;
                let char = ' ';
                let alpha = 0;
                if (edge[i]) {
                    char = EDGE_CHARS[edge[i]];
                    alpha = (0.62 + 0.33 * shade[i]) * opacity[i];
                } else if (cover[i] >= 0.5) {
                    // Solid faces keep one character per brightness step, without dither, so flat parts stay even.
                    const level = clamp01(shade[i]);
                    char = RAMP[Math.round(level * LAST)];
                    alpha = (0.2 + 0.8 * level ** 0.8) * opacity[i];
                } else {
                    let level = lum[i];
                    if (lens) {
                        const h = heat((x + 0.5) * cellW, (y + 0.5) * LINE_HEIGHT, t);
                        if (h > 0.01) level += h * (0.18 + 0.5 * weather(x, y, t));
                    }
                    if (level > 0.04) level = clamp01(level + DITHER[(y & 3) * 4 + (x & 3)]);
                    const step = Math.round(Math.min(1, level) * LAST);
                    if (step >= 1) {
                        char = RAMP[step];
                        alpha = 0.2 + 0.8 * level ** 0.8;
                    } else if (lines[i] > 0.04) {
                        char = (lineFamily[i] & 3) === 3 ? '+' : LINE_CHARS[lineCode[i]];
                        alpha = lines[i] * 0.55;
                    }
                }
                const layer = char === ' ' ? -1 : layerFor(alpha * v);
                if (layer < 0) continue;
                rowLayers[layer][x] = char;
                used |= 1 << layer;
            }
            for (let l = 0; l < rowLayers.length; l++) {
                if (!(used & (1 << l))) continue;
                ctx.globalAlpha = LAYER_ALPHAS[l];
                ctx.fillText(rowLayers[l].join(''), 0, y * LINE_HEIGHT);
            }
        }
        ctx.globalAlpha = 1;
    }

    /* ---------- Loop ---------- */

    function measureScroll(dt) {
        const y = window.scrollY;
        const rate = dt > 0 ? Math.abs(y - lastScrollY) / dt : 0;
        speed += (rate - speed) * (1 - Math.exp(-dt / 0.2));
        const moved = y !== lastScrollY;
        lastScrollY = y;
        return moved;
    }

    // With reduced motion the scene holds still and only redraws when content, size or colors change.
    function redraw() {
        if (!ink || !page) return;
        renderFrame(0);
        draw(0);
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
            if (page && (clock < placeUntil || (arriveStart < 0 && clock - pageStart > ARRIVE_TIMEOUT))) place();
        }
        if (reducedMotion && !maskDue) return;

        if (!reducedMotion) {
            pointer.sx += ((pointer.x / viewW - 0.5) * pointer.strength - pointer.sx) * 0.05;
            pointer.sy += ((pointer.y / viewH - 0.5) * pointer.strength - pointer.sy) * 0.05;
        }
        const t = reducedMotion ? 0 : clock;
        renderFrame(t);
        draw(t);
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

    // Starts the change to a page's scene. The old object leaves at once; the new one arrives after
    // relayout(), once the new page is on screen.
    function setScene(name) {
        if (name === page || !scenes[name]) return;
        if (page && arriveStart >= 0 && !reducedMotion) {
            const k = clamp01((clock - arriveStart) / arriveSeconds);
            leaving = { name: page, start: clock, gain: smoothstep(0, 1, k) * places[page].show };
        }
        page = name;
        pageStart = clock;
        arriveStart = -1;
        snapPlace = true;
        // The layout on screen still belongs to the old page.
        placeUntil = 0;
    }

    // The page's layout changed, so the object finds its place again.
    function relayout() {
        placeUntil = clock + PLACE_SECONDS;
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
        pointer.target = 1;
    });
    // Fade the lens when the mouse leaves the window or a touch ends.
    on(window, 'pointerout', (e) => {
        if (!e.relatedTarget) pointer.target = 0;
    });
    for (const type of ['pointerup', 'pointercancel']) {
        on(window, type, (e) => {
            if (e.pointerType !== 'mouse') pointer.target = 0;
        });
    }
    on(window, 'pointerdown', (e) => {
        if (reducedMotion || e.target.closest?.(INTERACTIVE)) return;
        ripples.push({ x: e.clientX, y: e.clientY, start: clock });
        if (ripples.length > MAX_RIPPLES) ripples.shift();
    });
    on(document, 'visibilitychange', () => (document.hidden ? stop() : start()));

    refreshColors();
    resize();
    start();

    return { setScene, relayout, refreshColors, destroy };
}
