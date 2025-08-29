<template>
    <Navbar />
    <component :is="routeStore.currentRoute.component" :key="routeStore.activePath" class="page-wrapper" />
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
@use './assets/styles/_variables.scss';
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

#app {
    display: flex;
    flex-direction: column;
}

.page-wrapper {
    padding-bottom: 5em !important;
}

@include bp-md-tablet {
    .page-wrapper {
        padding-bottom: 1em !important;
    }
}

.no-scroll {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

h1 {
    font-family: $primary-font-stack;
    font-weight: 600;
    color: $color-primary-darker;

    @include theme-light {
        text-shadow: 0px 3px 5px #00000025;
    }
}

h2 {
    font-weight: 400;

    @include theme-dark {
        color: $color-primary-light;
    }

    @include theme-light {
        color: $color-primary-darker;
    }
}

h3 {
    color: $color-primary-darker;
    font-family: $primary-font-stack;
    font-weight: 400;
}

p {
    color: $color-text-secondary;
    font-family: $secondary-font-stack;
}
</style>
