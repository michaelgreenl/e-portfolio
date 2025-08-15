<template>
    <Navbar />

    <transition name="page" mode="out-in">
        <component :is="routeStore.currentRoute.component" :key="routeStore.activePath" />
    </transition>
</template>

<script setup>
import { onMounted } from 'vue';
import { useRouteStore } from './stores/routeStore.js';
import { useThemeStore } from './stores/themeStore.js';
import Navbar from './components/Navbar.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

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
