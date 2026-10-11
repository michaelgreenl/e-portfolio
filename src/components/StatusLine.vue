<script setup>
import { computed, shallowRef } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';
import { useRouteStore } from '@/stores/routeStore.js';

const TEXT_ENTRY = 'input, textarea, select, [contenteditable="true"]';

const routeStore = useRouteStore();

const mode = shallowRef('NORMAL');
const scrollPosition = shallowRef('Top');

const fileName = computed(() => routeStore.currentRoute.meta?.file ?? '');

function updateScrollPosition() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY;

    if (max <= 0) scrollPosition.value = 'All';
    else if (y <= 0) scrollPosition.value = 'Top';
    else if (y >= max - 1) scrollPosition.value = 'Bot';
    else scrollPosition.value = `${Math.round((y / max) * 100)}%`;
}

useEventListener(window, 'scroll', updateScrollPosition, { passive: true });
useResizeObserver(document.documentElement, updateScrollPosition);
useEventListener(document, 'focusin', (e) => {
    mode.value = e.target.closest?.(TEXT_ENTRY) ? 'INSERT' : 'NORMAL';
});
useEventListener(document, 'focusout', () => {
    mode.value = 'NORMAL';
});
</script>

<template>
    <div class="status-line" aria-hidden="true">
        <div class="status-group">
            <span class="mode" :class="{ insert: mode === 'INSERT' }">{{ mode }}</span>
            <span class="file">{{ fileName }}</span>
        </div>
        <span class="position">{{ scrollPosition }}</span>
    </div>
</template>

<style lang="scss" scoped>
$status-height: 1.75rem;

.status-line {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 10;
    display: none;
    align-items: stretch;
    justify-content: space-between;
    height: $status-height;
    font-family: $mono-font-stack;
    font-size: 0.75rem;
    line-height: $status-height;

    @include theme-dark {
        color: $color-gray5;
        background-color: $color-gray8;
    }

    @include theme-light {
        color: $color-gray7;
        background-color: $color-gray4;
    }

    @include bp-md-tablet {
        display: flex;
    }
}

.status-group {
    display: flex;
    align-items: stretch;
}

.mode {
    padding: 0 $space-3;
    font-weight: 700;

    @include theme-dark {
        color: $color-gray9;
        background-color: $color-primary;
    }

    @include theme-light {
        color: $color-gray2;
        background-color: $color-primary-darker;
    }

    &.insert {
        @include theme-dark {
            background-color: $color-primary-light;
        }

        @include theme-light {
            background-color: $color-primary;
        }
    }
}

.file,
.position {
    padding: 0 $space-3;
}
</style>
