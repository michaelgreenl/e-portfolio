<template>
    <header>
        <nav class="nav-desktop">
            <button v-for="(route, key) in routeStore.routes" :key="key" @click="routeStore.toRoute(key)">
                {{ route.meta.title }}
            </button>
        </nav>
        <button @click="themeStore.toggleTheme()" class="theme-button">
            <MoonIcon v-if="themeStore.theme === 'dark'" class="icon" />
            <SunIcon v-else-if="themeStore.theme === 'light'" class="icon" />
        </button>
    </header>
    <Transition name="slide-up">
        <nav v-if="showMobileNav" class="nav-mobile">
            <button
                v-for="(route, key) in routeStore.routes"
                :key="key"
                @click="routeStore.toRoute(key)"
                :class="{ active: routeStore.activeRoute === key }"
            >
                <component :is="route.meta.iconFill" v-if="routeStore.activeRoute === key" class="icon" />
                <component :is="route.meta.icon" v-else class="icon" />
                <span>{{ route.meta.title }}</span>
            </button>
        </nav>
    </Transition>
</template>

<script setup>
import { useRouteStore } from '../stores/routeStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import { ref, onMounted } from 'vue';

import MoonIcon from '../components/SVGs/MoonIcon.vue';
import SunIcon from '../components/SVGs/SunIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();
const showMobileNav = ref(false);

onMounted(() => {
    showMobileNav.value = true;
});
</script>

<style lang="scss" scoped>
.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.5s ease-out;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100px);
    opacity: 0;
}

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
    box-shadow: 0 0 40px 5px rgba(0, 0, 0, 0.333);

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
