<script setup>
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import Navbar from '@/components/Navbar.vue';
import Footer from '@/components/Footer.vue';
import BgSVG from '@/components/SVGs/BgSVG.vue';
import RouteLoading from '@/components/RouteLoading.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

themeStore.init();
</script>

<template>
    <BgSVG class="bg-svg" />
    <Navbar />

    <div v-if="routeStore.loadError" class="page load-error">
        <p>{{ routeStore.loadError }}</p>
        <button @click="routeStore.retryInitialLoad">Retry</button>
    </div>
    <RouteLoading v-else-if="routeStore.isLoading || !routeStore.currentRoute?.component" class="page" />
    <component v-else :is="routeStore.currentRoute.component" :key="routeStore.activePath" class="page" />

    <Footer />
</template>

<style lang="scss">
@use './assets/styles/_variables.scss';

* {
    box-sizing: border-box;
}

.theme-animating,
.theme-animating * {
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
}

p {
    font-family: $secondary-font-stack;
    color: $color-text-secondary;
}

a,
button {
    cursor: pointer;
}

a {
    text-decoration: none;
}

.load-error {
    min-height: clamp(280px, 76vh, 560px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;

    p {
        font-family: $secondary-font-stack;
        color: $color-text-secondary;
        text-align: center;
    }

    button {
        font-family: $primary-font-stack;
        padding: 0.5em 1.5em;
        font-size: 1em;
        border: 1px solid $color-text-muted;
        border-radius: 8px;
        background: transparent;
        color: $color-text-primary;
        cursor: pointer;
        transition: opacity 0.2s ease;

        &:hover {
            opacity: 0.8;
        }
    }
}
</style>
