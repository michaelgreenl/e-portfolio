<template>
    <div class="projects-container">
        <div v-if="!activeProject" class="cards">
            <h1>Projects</h1>
            <div v-for="project in projects" :key="project.title" class="project-card">
                <h2>{{ project.title }}</h2>
                <button @click="routeStore.toRoute(`projects/${project.slug}`)">See More</button>
            </div>
        </div>
        <div v-else class="project-view">
            <button @click="routeStore.toRoute('projects')">Close</button>
            <h2>{{ activeProject.title }}</h2>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouteStore } from '../stores/routeStore.js';

const routeStore = useRouteStore();
const projects = [
    {
        title: 'Game Lobby',
        slug: 'game-lobby',
        description: '',
        img: '',
        externalLinks: {
            repo: '',
            demoVideo: '',
        },
    },
    {
        title: 'AlgoVisualizer',
        slug: 'algo-visualizer',
        description: '',
        img: '',
        externalLinks: {
            repo: '',
            demoVideo: '',
        },
    },
    {
        title: 'Springboard Capstone Project',
        slug: 'springboard-capstone',
        description: '',
        img: '',
        externalLinks: {
            documents: [],
        },
    },
];

const activeProject = computed(() => {
    if (routeStore.currentRoute.base !== 'projects') return null;
    const id = routeStore.currentRoute.params.id;
    if (!id) return null;
    return projects.find((p) => p.slug === id) || null;
});
</script>

<style lang="scss" scoped>
.projects-container {
    font-size: 0.8em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100vh;
    padding: 4.5em 1em 0;
    color: $color-text-primary;
}
</style>
