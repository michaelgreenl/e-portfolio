<template>
    <header>
        <nav>
            <button @click="routeStore.toRoute('home')">Home</button>
            <button @click="routeStore.toRoute('projects')">Projects</button>
        </nav>
    </header>

    <transition name="page" mode="out-in">
        <component :is="routeStore.routes[`${routeStore.activeRoute}`].component" :key="routeStore.activeRoute" />
    </transition>
</template>

<script setup>
import { useRouteStore } from './stores/routeStore.js';

const routeStore = useRouteStore();
</script>

<style>
.page-enter-active,
.page-leave-active {
    transition: all 0.3s ease;
}

.page-enter-from {
    opacity: 0;
    transform: translateX(30px);
}

.page-leave-to {
    opacity: 0;
    transform: translateX(-30px);
}
</style>

<style lang="scss"></style>
