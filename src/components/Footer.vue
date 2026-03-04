<script setup>
import { watch } from 'vue';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';
import { useRouteStore } from '@/stores/routeStore.js';

const { fadeIn, fadeOut } = useUtilAnimations();
const routeStore = useRouteStore();

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            fadeOut({ selector: '.footer-text' });
        }
    },
);

watch(
    () => routeStore.routeReady,
    (newVal) => {
        if (newVal) {
            fadeIn({ selector: '.footer-text', opts: { delay: 0.3 } });
        }
    },
);
</script>

<template>
    <footer>
        <p class="footer-text">© 2026 M.G.</p>
    </footer>
</template>

<style lang="scss" scoped>
footer {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    padding: 0 $size-8 5em;
    margin-top: auto;

    @include bp-md-tablet {
        padding-bottom: 0 !important;
    }
}

p {
    font-family: $primary-font-stack !important;
    color: $color-text-muted;
    opacity: 0;
}
</style>
