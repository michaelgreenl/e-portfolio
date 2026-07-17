<script setup>
import { onMounted, watch } from 'vue';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';
import { useRouteStore } from '@/stores/routeStore.js';

const { fadeIn, fadeOut } = useUtilAnimations();
const routeStore = useRouteStore();

onMounted(() => {
    fadeIn({ selector: '.footer-text', opts: { delay: 0.3 } });
});

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            fadeOut({ selector: '.footer-text' });
        } else {
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
    padding: 0 $space-3 $space-16;
    margin-top: auto;

    @include bp-sm-phone {
        padding-right: $space-6 !important;
    }

    @include bp-md-tablet {
        padding-bottom: 0 !important;
    }
}

p {
    font-family: $primary-font-stack !important;
    color: $color-text-muted;
}
</style>
