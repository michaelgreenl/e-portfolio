<script setup>
import { useMotions } from '@vueuse/motion';
</script>

<template>
    <footer>
        <p v-motion-fade-in-once :delay="300">© 2025 M.G.</p>
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
