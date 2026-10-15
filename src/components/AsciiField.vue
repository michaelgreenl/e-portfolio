<script setup>
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { createAsciiField } from '@/ascii/field.js';
import { createWorld } from '@/ascii/world.js';

// Panels, controls and dividers that clear their whole rounded box while they show a background or border.
const SURFACES =
    'button, input, textarea, select, .theme-toggle, .nav-mobile, .project-card, .section-content, .status-message, .contact-links-desktop';

// Which object each page shows, in the box its .art-slot element marks.
const PAGE_OBJECTS = { home: 'earth', projects: 'jupiter', resume: 'rocket', contact: 'satellite' };

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const canvas = useTemplateRef('canvas');
const isReady = shallowRef(false);
let field;

// The camera starts toward the next page's object as soon as the page starts to leave.
watch(
    () => routeStore.isLeaving && routeStore.toPath,
    (page) => {
        if (page) field?.setScene(PAGE_OBJECTS[page]);
    },
);

// Once the new page is on screen, its object settles into the page's slot.
watch(
    () => routeStore.activePath,
    () => {
        field?.setScene(PAGE_OBJECTS[routeStore.currentRoute.base]);
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
        slot: '.art-slot',
        world: createWorld(),
    });
    field.setScene(PAGE_OBJECTS[routeStore.currentRoute.base]);
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
