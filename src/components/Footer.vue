<script setup>
import { onMounted } from 'vue';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';

const { fadeIn } = useUtilAnimations();

onMounted(() => {
    fadeIn({ selector: '.footer-text', opts: { delay: 0.3 } });
});
</script>

<template>
    <footer>
        <p class="footer-text">© 2025 M.G.</p>
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
}
</style>
