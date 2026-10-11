<script setup>
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';

const RAMP = ' .·:-=+*%';
const FONT_SIZE = 14;
const LINE_HEIGHT = 16;
const FRAME_MS = 1000 / 30;
const LENS_RADIUS = 110;
const HOT_THRESHOLD = 0.12;
const RIPPLE_SPEED = 420;
const RIPPLE_WIDTH = 18;
const RIPPLE_LIFE = 1.4;
const MAX_RIPPLES = 5;
const FIELD_THRESHOLD = 0.46;
const FIELD_PEAK = 0.9;
const INTERACTIVE = 'a, button, input, textarea, select, label';

// Page content is drawn into a low-resolution mask: glyphs and icons by their shape,
// controls with a visible surface by their rounded box. The blurred mask fades the field.
const SURFACES = 'button, .theme-toggle, .nav-mobile, .status-line';
const MASK_SCALE = 4;
const MASK_INTERVAL = 150;
const CLEAR_PADDING = 12;
const BLUR_RADIUS = 4;
const BLUR_PASSES = 3;
const FADE_START = 0.08;
const FADE_END = 0.5;
const WARP_STRENGTH = 4;
const LAYER_ALPHAS = [0.3, 0.6, 1];

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const canvas = useTemplateRef('canvas');
const isReady = shallowRef(false);

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pointer = { x: 0, y: 0, strength: 0, target: 0 };
const ripples = [];
const colors = { base: '', hot: '' };
const range = document.createRange();
const maskCanvas = document.createElement('canvas');
const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

let ctx;
let cols = 0;
let rows = 0;
let cellWidth = 0;
let viewWidth = 0;
let viewHeight = 0;
let visibility = new Float32Array(0);
let warpX = new Float32Array(0);
let warpY = new Float32Array(0);
let frameId = 0;
let lastFrame = 0;
let lastMask = 0;
const startTime = performance.now();

function readColors() {
    // Computed `color` values resolve the theme's CSS variables to plain rgb() strings the canvas accepts.
    const style = getComputedStyle(canvas.value);
    colors.base = style.color;
    colors.hot = style.textDecorationColor;
}

function resize() {
    const el = canvas.value;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const { width, height } = el.getBoundingClientRect();

    el.width = Math.round(width * dpr);
    el.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = `${FONT_SIZE}px ${getComputedStyle(el).fontFamily}`;
    ctx.textBaseline = 'top';

    viewWidth = width;
    viewHeight = height;
    cellWidth = ctx.measureText('M').width;
    cols = Math.ceil(width / cellWidth);
    rows = Math.ceil(height / LINE_HEIGHT);
    maskCanvas.width = Math.ceil(width / MASK_SCALE);
    maskCanvas.height = Math.ceil(height / MASK_SCALE);

    rebuildMask();
    if (reducedMotion) draw(0);
}

// Overlapping sine waves read as slow-moving weather on a terminal map.
function field(x, y, t) {
    const v =
        Math.sin(x * 0.07 + t * 0.6) +
        Math.sin(y * 0.11 - t * 0.4) +
        Math.sin((x * 0.6 + y) * 0.045 + t * 0.3) +
        Math.sin(Math.hypot(x - cols * 0.7, y - rows * 0.45) * 0.12 - t * 0.8);
    const n = (v + 4) / 8;

    // About 60% of cells show a character, and the calm field never reaches the heaviest glyph.
    return Math.min(1, Math.max(0, (n - FIELD_THRESHOLD) / (1 - FIELD_THRESHOLD))) * FIELD_PEAK;
}

function hasSurface(el) {
    const style = getComputedStyle(el);
    const isVisible = (color) => !/^rgba\(.*,\s*0\)$|^transparent$/.test(color);

    return (
        isVisible(style.backgroundColor) ||
        (parseFloat(style.borderTopWidth) > 0 && isVisible(style.borderTopColor)) ||
        style.backdropFilter !== 'none'
    );
}

function drawBox(rect, radius) {
    if (!rect.width && !rect.height) return;

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
function drawText(node, style) {
    maskCtx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const ascent = maskCtx.measureText('M').fontBoundingBoxAscent;
    let offset = 0;

    for (const char of node.data) {
        const end = offset + char.length;

        if (char.trim()) {
            range.setStart(node, offset);
            range.setEnd(node, end);
            const rect = range.getBoundingClientRect();

            if (rect.width && rect.bottom > 0 && rect.top < viewHeight) {
                maskCtx.strokeText(char, rect.left, rect.top + ascent);
                maskCtx.fillText(char, rect.left, rect.top + ascent);
            }
        }

        offset = end;
    }
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

function rebuildMask() {
    const root = document.getElementById('app');
    const w = maskCanvas.width;
    const h = maskCanvas.height;
    if (!root || !w || !h) return;

    maskCtx.setTransform(1, 0, 0, 1, 0, 0);
    maskCtx.clearRect(0, 0, w, h);
    maskCtx.setTransform(1 / MASK_SCALE, 0, 0, 1 / MASK_SCALE, 0, 0);
    maskCtx.lineWidth = CLEAR_PADDING * 2;
    maskCtx.lineJoin = 'round';
    maskCtx.textBaseline = 'alphabetic';

    const surfaces = [...root.querySelectorAll(SURFACES)].filter(hasSurface);
    const isCovered = (el) => surfaces.some((surface) => surface.contains(el));

    for (const surface of surfaces) {
        drawBox(surface.getBoundingClientRect(), parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 0);
    }

    for (const el of root.querySelectorAll('svg, hr')) {
        if (!isCovered(el)) drawBox(el.getBoundingClientRect(), 4);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const styles = new Map();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const el = node.parentElement;
        if (!node.data.trim() || !el || isCovered(el)) continue;

        if (!styles.has(el)) styles.set(el, getComputedStyle(el));
        drawText(node, styles.get(el));
    }

    // Three box-blur passes approximate a Gaussian, which gives a soft, even falloff.
    const { data } = maskCtx.getImageData(0, 0, w, h);
    let a = new Float32Array(w * h);
    let b = new Float32Array(w * h);
    for (let i = 0; i < a.length; i++) a[i] = data[i * 4 + 3] / 255;
    for (let pass = 0; pass < BLUR_PASSES; pass++) {
        boxBlur(a, b, w, h, BLUR_RADIUS);
        boxBlur(b, a, h, w, BLUR_RADIUS);
    }

    const at = (px, py) => {
        const mx = Math.min(w - 1, Math.max(0, Math.floor(px / MASK_SCALE)));
        const my = Math.min(h - 1, Math.max(0, Math.floor(py / MASK_SCALE)));
        return a[my * w + mx];
    };

    visibility = new Float32Array(cols * rows);
    warpX = new Float32Array(cols * rows);
    warpY = new Float32Array(cols * rows);

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const px = (x + 0.5) * cellWidth;
            const py = (y + 0.5) * LINE_HEIGHT;
            const fade = Math.min(1, Math.max(0, (at(px, py) - FADE_START) / (FADE_END - FADE_START)));

            visibility[i] = 1 - fade * fade * (3 - 2 * fade);
            // The mask gradient points toward content, so the pattern bends around it.
            warpX[i] = (at(px + cellWidth, py) - at(px - cellWidth, py)) * WARP_STRENGTH;
            warpY[i] = (at(px, py + LINE_HEIGHT) - at(px, py - LINE_HEIGHT)) * WARP_STRENGTH;
        }
    }
}

function heat(px, py, t) {
    const dx = px - pointer.x;
    const dy = py - pointer.y;
    const dist = Math.hypot(dx, dy);
    let h = pointer.strength * Math.exp(-(dist * dist) / (LENS_RADIUS * LENS_RADIUS));

    for (const ripple of ripples) {
        const age = t - ripple.start;
        const ring = (Math.hypot(px - ripple.x, py - ripple.y) - age * RIPPLE_SPEED) / RIPPLE_WIDTH;
        h += Math.exp(-ring * ring) * (1 - age / RIPPLE_LIFE);
    }

    return Math.min(1, h);
}

function draw(t) {
    const hotCells = [];
    const last = RAMP.length - 1;

    while (ripples.length && t - ripples[0].start > RIPPLE_LIFE) ripples.shift();
    pointer.strength += (pointer.target - pointer.strength) * 0.12;

    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.fillStyle = colors.base;

    for (let y = 0; y < rows; y++) {
        // One string per opacity layer keeps this to a few fillText calls per row.
        const layers = ['', '', ''];

        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const v = visibility[i];
            const layer = v > 0.66 ? 2 : v > 0.33 ? 1 : 0;
            let char = ' ';

            if (v > 0.02) {
                const h = reducedMotion ? 0 : heat((x + 0.5) * cellWidth, (y + 0.5) * LINE_HEIGHT, t) * v;
                const level = field(x + warpX[i], y + warpY[i], t) * v + h * 0.9;
                char = RAMP[Math.round(Math.min(1, level) * last)];

                if (h > HOT_THRESHOLD && char !== ' ') {
                    hotCells.push(x, y, h, char);
                    char = ' ';
                }
            }

            for (let l = 0; l < layers.length; l++) layers[l] += l === layer ? char : ' ';
        }

        for (let l = 0; l < layers.length; l++) {
            ctx.globalAlpha = LAYER_ALPHAS[l];
            ctx.fillText(layers[l], 0, y * LINE_HEIGHT);
        }
    }

    ctx.fillStyle = colors.hot;
    for (let i = 0; i < hotCells.length; i += 4) {
        ctx.globalAlpha = 0.35 + hotCells[i + 2] * 0.65;
        ctx.fillText(hotCells[i + 3], hotCells[i] * cellWidth, hotCells[i + 1] * LINE_HEIGHT);
    }
}

function frame(now) {
    frameId = requestAnimationFrame(frame);
    if (now - lastFrame < FRAME_MS) return;

    // Rebuilt on an interval so the mask follows enter animations, scrolling, and layout changes.
    if (now - lastMask > MASK_INTERVAL) {
        lastMask = now;
        rebuildMask();
    }

    lastFrame = now;
    draw((now - startTime) / 1000);
}

function start() {
    if (reducedMotion || frameId) return;
    frameId = requestAnimationFrame(frame);
}

function stop() {
    cancelAnimationFrame(frameId);
    frameId = 0;
}

useResizeObserver(canvas, () => ctx && resize());

useEventListener(window, 'pointermove', (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.target = 1;
});

useEventListener(document, 'pointerleave', () => {
    pointer.target = 0;
});

useEventListener(window, 'pointerdown', (e) => {
    if (reducedMotion || e.target.closest?.(INTERACTIVE)) return;

    ripples.push({ x: e.clientX, y: e.clientY, start: (performance.now() - startTime) / 1000 });
    if (ripples.length > MAX_RIPPLES) ripples.shift();
});

useEventListener(document, 'visibilitychange', () => (document.hidden ? stop() : start()));

watch(
    () => themeStore.theme,
    async () => {
        await nextTick();
        readColors();
        if (reducedMotion) draw(0);
    },
);

onMounted(() => {
    ctx = canvas.value.getContext('2d');
    readColors();
    resize();
    start();
    isReady.value = true;
});

onUnmounted(stop);
</script>

<template>
    <canvas
        ref="canvas"
        class="ascii-field"
        :class="{ 'is-ready': isReady, 'is-leaving': routeStore.isLeaving }"
        aria-hidden="true"
    ></canvas>
</template>

<style lang="scss" scoped>
.ascii-field {
    position: fixed;
    inset: 0;
    z-index: 2;
    width: 100%;
    height: 100%;
    font-family: $mono-font-stack;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.8s ease;

    @include theme-dark {
        color: $color-gray7;
        text-decoration-color: $color-gray4;
    }

    @include theme-light {
        color: $color-gray5;
        text-decoration-color: $color-gray7;
    }

    &.is-ready {
        opacity: 1;
    }

    &.is-leaving {
        opacity: 0;
        transition-duration: 0.3s;
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
}
</style>
