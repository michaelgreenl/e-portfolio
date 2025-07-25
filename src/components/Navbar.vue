<template>
    <header>
        <nav>
            <button @click="routeStore.toRoute('home')">Home</button>
            <button @click="routeStore.toRoute('projects')">Projects</button>
        </nav>
    </header>
</template>

<script setup>
import { useRouteStore } from '../stores/routeStore.js';

const routeStore = useRouteStore();
</script>

<style lang="scss" scoped></style>
