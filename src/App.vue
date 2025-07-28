<template>
    <Navbar />

    <transition name="page" mode="out-in">
        <component :is="routeStore.routes[`${routeStore.activeRoute}`].component" :key="routeStore.activeRoute" />
    </transition>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouteStore } from './stores/routeStore.js';
import { useThemeStore } from './stores/themeStore.js';
import Navbar from './components/Navbar.vue';

const routeStore = useRouteStore();
const themeStore = useRouteStore();

onMounted(() => {
    let theme = localStorage.getItem('THEME');

    if (theme === null) {
        localStorage.setItem('THEME', 'dark');
        theme = 'dark';
    }

    themeStore.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
});
</script>

<style>
.page-enter-active,
.page-leave-active {
    transition: all 0.3s ease;
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

<style lang="scss">
@use './assets/styles/_base.scss';

* {
    box-sizing: border-box;
}

html,
body,
#app {
    font-family: $primary-font-stack;
    height: 100%;
    padding: 0;
    margin: 0;
    background-color: var(--color-bg-primary);
}
</style>
