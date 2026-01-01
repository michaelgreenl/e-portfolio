<script setup>
import { onMounted } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue';
import BgSVG from '@/components/SVGs/BgSVG.vue';

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

<template>
    <BgSVG class="bg-svg" />
    <Navbar />

    <component :is="routeStore.currentRoute.component" :key="routeStore.activePath" class="page" />
    <Footer />
</template>

<style lang="scss">
@use './assets/styles/_variables.scss';

* {
    box-sizing: border-box;
    transition:
        background-color 0.3s ease,
        color 0.3s ease,
        border-color 0.3s ease,
        box-shadow 0.3s ease,
        fill 0.3s ease;
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
    position: relative;
    display: flex;
    flex-direction: column;
    font-size: 0.85em;

    @include bp-xsm-phone {
        font-size: 0.9em;
    }

    @include bp-sm-phone {
        font-size: 1em;
    }

    @include bp-xxl-desktop {
        font-size: 1.2em;
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

.page {
    position: relative;
    z-index: 3;
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

h3,
h4 {
    color: $color-primary-darker;
    font-family: $primary-font-stack;
    font-weight: 400;
}

p {
    color: $color-text-secondary;
    font-family: $secondary-font-stack;
}

a,
button {
    cursor: pointer;
}

button:focus-visible {
    outline: none;
}

a {
    text-decoration: none;
}
</style>
