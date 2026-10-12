<script setup>
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { createAsciiField } from '@/ascii/field.js';
import { createSaturn } from '@/ascii/scenes/saturn.js';
import { createEarth } from '@/ascii/scenes/earth.js';
import { createRocket } from '@/ascii/scenes/rocket.js';
import { createSatellite } from '@/ascii/scenes/satellite.js';

// Panels and controls that clear their whole rounded box while they show a background, border, or blur.
const SURFACES =
    'button, input, textarea, select, .theme-toggle, .nav-mobile, .status-line, .project-card, .section-content, .status-message';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const canvas = useTemplateRef('canvas');
const isReady = shallowRef(false);
let field;

// The old page's object leaves as soon as the page starts to leave.
watch(
    () => routeStore.isLeaving && routeStore.toPath,
    (page) => {
        if (page) field?.setScene(page);
    },
);

// Once the new page is on screen, its object finds a place beside the content.
watch(
    () => routeStore.activePath,
    () => {
        field?.setScene(routeStore.currentRoute.base);
        field?.relayout();
    },
    { flush: 'post' },
);

watch(
    () => themeStore.theme,
    async () => {
        await nextTick();
        field?.refreshColors();
    },
);

onMounted(() => {
    field = createAsciiField(canvas.value, {
        root: document.getElementById('app'),
        surfaces: SURFACES,
        scenes: { home: createSaturn(), projects: createEarth(), resume: createRocket(), contact: createSatellite() },
    });
    field.setScene(routeStore.currentRoute.base);
    field.relayout();
    isReady.value = true;
});

onUnmounted(() => field?.destroy());
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
        color: $color-gray4;
    }

    @include theme-light {
        color: $color-gray8;
    }

    &.is-ready {
        opacity: 1;
    }

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
}
</style>
