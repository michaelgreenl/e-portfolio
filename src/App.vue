<template>
    <Navbar />

    <transition name="page" mode="out-in">
        <component :is="routeStore.routes[`${routeStore.activeRoute}`].component" :key="routeStore.activeRoute" />
    </transition>
</template>

<script setup>
import { useRouteStore } from './stores/routeStore.js';
import Navbar from './components/Navbar.vue';

const routeStore = useRouteStore();
</script>

<style lang="scss">
@use './assets/styles/_base.scss';

* {
    box-sizing: border-box;
}

html,
body,
#app {
    height: 100%;
    padding: 0;
    margin: 0;
    font-family: $primary-font-stack;
    background-color: $color-bg-primary;
}

.page-enter-active,
.page-leave-active {
    transition: all 0.2s ease;
}

.page-enter-from {
    opacity: 0;
    transform: translateX(-30px);
}

.page-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}
</style>
