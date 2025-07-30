<template>
    <header>
        <nav class="nav-desktop">
            <button @click="routeStore.toRoute('home')">Home</button>
            <button @click="routeStore.toRoute('projects')">Projects</button>
            <button @click="routeStore.toRoute('experience')">Experience</button>
            <button @click="routeStore.toRoute('contact')">Contact</button>
        </nav>
        <button @click="themeStore.toggleTheme()" class="theme-button">
            <MoonIcon v-if="themeStore.theme = 'dark'" class="icon" />
            <SunIcon v-else-if="themeStore.theme = 'light'" class="icon" />
        </button>
    </header>
    <!-- TODO: Loop through routeStore.routes here. (Add stuff like icons to the routes object?) -->
    <nav class="nav-mobile">
        <button @click="routeStore.toRoute('home')" :class="{ active: routeStore.activeRoute === 'home' }">
            <HomeIconFill v-if="routeStore.activeRoute === 'home'" class="icon" />
            <HomeIcon v-else class="icon" />
            <span>Home</span>
        </button>
        <button @click="routeStore.toRoute('projects')" :class="{ active: routeStore.activeRoute === 'projects' }">
            <ProjectsIcon class="icon" />
            <span>Projects</span>
        </button>
        <button @click="routeStore.toRoute('experience')" :class="{ active: routeStore.activeRoute === 'experience' }">
            <ResumeIconFill v-if="routeStore.activeRoute === 'experience'" class="icon" />
            <ResumeIcon v-else class="icon" />
            <span>Resume</span>
        </button>
        <button @click="routeStore.toRoute('contact')" :class="{ active: routeStore.activeRoute === 'contact' }">
            <ContactIconFill v-if="routeStore.activeRoute === 'contact'" class="icon" />
            <ContactIcon v-else class="icon" />
            <span>Contact</span>
        </button>
    </nav>
</template>

<script setup>
import { useRouteStore } from '../stores/routeStore.js';
import { useThemeStore } from '../stores/themeStore.js';

import HomeIcon from '../components/SVGs/HomeIcon.vue';
import HomeIconFill from '../components/SVGs/HomeIconFill.vue';
import ProjectsIcon from '../components/SVGs/ProjectsIcon.vue';
import ResumeIcon from '../components/SVGs/ResumeIcon.vue';
import ResumeIconFill from '../components/SVGs/ResumeIconFill.vue';
import ContactIcon from '../components/SVGs/ContactIcon.vue';
import ContactIconFill from '../components/SVGs/ContactIconFill.vue';
import MoonIcon from '../components/SVGs/MoonIcon.vue';
import SunIcon from '../components/SVGs/SunIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();
</script>

<style lang="scss" scoped>
.nav-desktop {
    display: none;
}

header {
    display: flex;
    justify-content: flex-end;
}

.nav-mobile {
    position: fixed;
    bottom: 0.5em;
    right: 0.5em;
    left: 0.5em;
    max-width: 355px;
    display: flex;
    justify-content: space-between;
    height: 3em;
    padding: 0.4em;
    margin: 0 auto;
    background-color: $color-bg-secondary;
    border-radius: 16px;

    button {
        font-family: $primary-font-stack;
        font-weight: 600;
        display: flex;
        flex-direction: column;
        justify-content: center;
        border: 0;
        padding: 0.5em 0.8em;
        border-radius: 12px;
        background-color: transparent;
        color: $color-accent-dark;

        .icon {
            display: none;
        }

        span {
            font-size: clamp(0.4em, 3.5vw, 1em);
        }

        &.active {
            background-color: lighten-color($color-bg-secondary, 10%);

            @include theme-dark {
                color: $color-primary;
            }

            @include theme-light {
                color: $color-gray2;
            }
        }
    }
}

@include bp-xsm-phone {
    .nav-mobile {
        height: 5em;

        button {
            gap: 2px;

            .icon {
                display: block;
                height: 100%;
                fill: $color-accent-dark;
                stroke: $color-accent-dark;
            }

            span {
                font-size: 1em;
            }

            &.active {
                .icon {
                    @include theme-dark {
                        fill: $color-primary;
                        stroke: $color-primary;
                    }

                    @include theme-light {
                        fill: $color-gray2;
                        stroke: $color-gray2;
                    }
                }
            }
        }
    }
}

@include bp-md-tablet {
    .nav-mobile {
        display: none;
    }

    .nav-desktop {
        display: flex;
    }

    header {
        justify-content: space-between;
    }
}
</style>
