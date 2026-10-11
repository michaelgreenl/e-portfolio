<script setup>
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';
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
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"]';

// Page content is drawn into a low-resolution mask, weighted by its opacity. Large type clears by glyph
// shape and smaller text by line box. Elements matching SURFACES clear their whole rounded box while they
// show a background, border, or backdrop blur. The blurred mask fades and bends the field around content.
const SURFACES =
    'button, input, textarea, select, .theme-toggle, .nav-mobile, .status-line, .project-card, .section-content, .status-message';
const GLYPH_MIN_FONT_SIZE = 24;
const MASK_SCALE = 6;
const MASK_INTERVAL = 150;
const CLEAR_PADDING = 12;
const BLUR_RADIUS = 3;
const BLUR_PASSES = 2;
const FADE_START = 0.08;
const FADE_END = 0.5;
const WARP_STRENGTH = 4;
const VISIBILITY_EASE = 0.3;
const LAYER_ALPHAS = [0.3, 0.6, 1];

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
let maskA = new Float32Array(0);
let maskB = new Float32Array(0);
let targetVisibility = new Float32Array(0);
let visibility = new Float32Array(0);
let warpX = new Float32Array(0);
let warpY = new Float32Array(0);
let frameId = 0;
let lastFrame = 0;
let lastMask = 0;
let lastScrollY = 0;
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

    maskA = new Float32Array(maskCanvas.width * maskCanvas.height);
    maskB = new Float32Array(maskA.length);
    targetVisibility = new Float32Array(cols * rows);
    visibility = new Float32Array(cols * rows);
    warpX = new Float32Array(cols * rows);
    warpY = new Float32Array(cols * rows);

    rebuildMask(true);
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

const isVisibleColor = (color) => color !== 'transparent' && !/[,/]\s*0\)$/.test(color);
const SIDES = ['Top', 'Right', 'Bottom', 'Left'];

function hasSurface(style) {
    return (
        isVisibleColor(style.backgroundColor) ||
        style.backgroundImage !== 'none' ||
        style.backdropFilter !== 'none' ||
        SIDES.some((side) => parseFloat(style[`border${side}Width`]) > 0 && isVisibleColor(style[`border${side}Color`]))
    );
}

function drawBox(rect, radius) {
    if (!rect.width && !rect.height) return;
    if (rect.bottom < -CLEAR_PADDING * 3 || rect.top > viewHeight + CLEAR_PADDING * 3) return;

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
    if (box.bottom < -CLEAR_PADDING || box.top > viewHeight + CLEAR_PADDING) return;

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

function drawLines(node) {
    range.selectNodeContents(node);
    for (const rect of range.getClientRects()) drawBox(rect, rect.height / 2);
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

function rebuildMask(snap) {
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

    const surfaces = new Set([...root.querySelectorAll(SURFACES)].filter((el) => hasSurface(styleOf(el))));
    const isCovered = (el) => {
        if (!el || el === root) return false;
        if (!covered.has(el)) covered.set(el, surfaces.has(el.parentElement) || isCovered(el.parentElement));
        return covered.get(el);
    };

    for (const surface of surfaces) {
        if (isCovered(surface)) continue;
        maskCtx.globalAlpha = alphaOf(surface);
        drawBox(surface.getBoundingClientRect(), parseFloat(styleOf(surface).borderTopLeftRadius) || 0);
    }

    for (const el of root.querySelectorAll('svg, hr, img, video')) {
        if (surfaces.has(el) || isCovered(el)) continue;
        maskCtx.globalAlpha = alphaOf(el);
        drawBox(el.getBoundingClientRect(), 4);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const el = node.parentElement;
        if (!el || !node.data.trim() || surfaces.has(el) || isCovered(el)) continue;

        const alpha = alphaOf(el);
        if (alpha < 0.02) continue;

        maskCtx.globalAlpha = alpha;
        const style = styleOf(el);
        if (parseFloat(style.fontSize) >= GLYPH_MIN_FONT_SIZE) drawGlyphs(node, style);
        else drawLines(node);
    }
    maskCtx.globalAlpha = 1;

    // Two box-blur passes give a soft, even falloff around content.
    const { data } = maskCtx.getImageData(0, 0, w, h);
    for (let i = 0; i < maskA.length; i++) maskA[i] = data[i * 4 + 3] / 255;
    for (let pass = 0; pass < BLUR_PASSES; pass++) {
        boxBlur(maskA, maskB, w, h, BLUR_RADIUS);
        boxBlur(maskB, maskA, h, w, BLUR_RADIUS);
    }

    const at = (px, py) => {
        const mx = Math.min(w - 1, Math.max(0, Math.floor(px / MASK_SCALE)));
        const my = Math.min(h - 1, Math.max(0, Math.floor(py / MASK_SCALE)));
        return maskA[my * w + mx];
    };

    for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const px = (x + 0.5) * cellWidth;
            const py = (y + 0.5) * LINE_HEIGHT;
            const fade = Math.min(1, Math.max(0, (at(px, py) - FADE_START) / (FADE_END - FADE_START)));

            targetVisibility[i] = 1 - fade * fade * (3 - 2 * fade);
            // The mask gradient points toward content, so the pattern bends around it.
            warpX[i] = (at(px + cellWidth, py) - at(px - cellWidth, py)) * WARP_STRENGTH;
            warpY[i] = (at(px, py + LINE_HEIGHT) - at(px, py - LINE_HEIGHT)) * WARP_STRENGTH;
        }
    }

    // Scrolling moves content a lot between frames, so the field jumps to the new mask instead of easing.
    if (snap) visibility.set(targetVisibility);
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
    const ease = reducedMotion ? 1 : VISIBILITY_EASE;

    while (ripples.length && t - ripples[0].start > RIPPLE_LIFE) ripples.shift();
    pointer.strength += (pointer.target - pointer.strength) * 0.12;

    ctx.clearRect(0, 0, viewWidth, viewHeight);
    ctx.fillStyle = colors.base;

    for (let y = 0; y < rows; y++) {
        // One string per opacity layer keeps this to a few fillText calls per row.
        const layers = ['', '', ''];

        for (let x = 0; x < cols; x++) {
            const i = y * cols + x;
            const v = (visibility[i] += (targetVisibility[i] - visibility[i]) * ease);
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
    lastFrame = now;

    // The mask follows layout on an interval, and on every frame while the page scrolls.
    const scrolled = window.scrollY !== lastScrollY;
    const maskDue = scrolled || now - lastMask > MASK_INTERVAL;
    if (maskDue) {
        lastMask = now;
        lastScrollY = window.scrollY;
        rebuildMask(scrolled);
    }

    // With reduced motion the field holds still, so it only redraws when content moves.
    if (reducedMotion && !maskDue) return;
    draw(reducedMotion ? 0 : (now - startTime) / 1000);
}

function start() {
    if (frameId) return;
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
    <canvas ref="canvas" class="ascii-field" :class="{ 'is-ready': isReady }" aria-hidden="true"></canvas>
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

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
}
</style>
