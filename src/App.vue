<script setup>
import { RouterView } from 'vue-router';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue';
import BgSVG from '@/components/SVGs/BgSVG.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

// Getting theme immediately to prevent flashing on inital loads
let theme = localStorage.getItem('THEME');

if (theme === null) {
    localStorage.setItem('THEME', 'dark');
    theme = 'dark';
}

themeStore.theme = theme;
document.documentElement.setAttribute('data-theme', theme);
</script>

<template>
    <BgSVG class="bg-svg" />

    <Navbar />
    <RouterView v-slot="{ Component }">
        <component :is="Component" :key="routeStore.activePath" class="page" />
    </RouterView>
    <Footer />
</template>

<style lang="scss">
@use './assets/styles/_variables.scss';

*,
*::before,
*::after {
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
    font-size: 16px;

    @include bp-sm-phone {
        font-size: 17px;
    }

    @include bp-xl-desktop {
        font-size: 18px;
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

.page-shell {
    flex-direction: column;
    flex-grow: 1;
    width: 100%;
    margin: 0 auto;
    font-size: 0.9em;
    color: $color-text-primary;
    @include flexCenterAll;
}

.hero-line,
.nav-links-line,
.projects-container hr,
.resume-container hr,
.contact-header hr {
    height: 1px;
    border: 0;

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-gray5;
    }
}

h1 {
    font-family: $primary-font-stack;
    font-weight: 600;
    color: $color-primary-darker;

    @include theme-light {
        text-shadow: 0 3px 5px #00000025;
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
    font-family: $primary-font-stack;
    font-weight: 400;
    color: $color-primary-darker;
    text-wrap: pretty;
}

p {
    font-family: $secondary-font-stack;
    color: $color-text-secondary;
    text-wrap: pretty;
}

a,
button {
    cursor: pointer;
}

a {
    text-decoration: none;
}
</style>
