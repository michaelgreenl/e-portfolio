<template>
    <header>
        <nav class="nav-desktop">
            <button
                v-for="(route, key) in routeStore.routes"
                :key="key"
                @click="routeStore.toRoute(key)"
                :class="{ active: routeStore.activeRoute === key }"
            >
                <component :is="route.meta.iconFill" v-if="routeStore.activeRoute === key" class="icon" />
                <component :is="route.meta.icon" v-else class="icon" />
                {{ route.meta.title }}
            </button>
        </nav>
        <label class="theme-toggle">
            <input
                class="toggle-input"
                type="checkbox"
                id="theme"
                true-value="dark"
                false-value="light"
                @click="themeStore.toggleTheme()"
            />
            <div class="toggle-thumb" :class="{ active: themeStore.theme === 'dark' }">
                <Transition name="icon" mode="out-in">
                    <MoonIcon v-if="themeStore.theme === 'dark'" class="icon" />
                    <SunIcon v-else class="icon" />
                </Transition>
            </div>
        </label>
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
    let theme = localStorage.getItem('THEME');

    if (theme === null) {
        localStorage.setItem('THEME', 'dark');
        theme = 'dark';
    }

    themeStore.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);

    showMobileNav.value = true;
});
</script>

<style lang="scss" scoped>
.icon-enter-active,
.icon-leave-active {
    transition: all 0.1s ease-in-out;
}

.icon-enter-from {
    transform: rotate(-45deg);
}

.icon-leave-to {
    transform: rotate(45deg);
}

.icon-enter-to,
.icon-leave-from {
    transform: rotate(0deg);
    opacity: 1;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(100px);
    opacity: 0;
}

.nav-desktop {
    display: none;
    gap: 0.8em;

    button {
        position: relative;
        display: flex;
        align-items: center;
        gap: 0.6em;
        font-weight: 500;
        font-family: $primary-font-stack;
        background-color: transparent;
        border: 0;
        font-size: 0.85em;
        color: $color-text-primary;
        padding: 0.75em 1.1em;
        border-radius: 12px;

        @include theme-dark {
            color: $color-text-primary;
        }

        @include theme-light {
            font-weight: 600;
            color: $color-primary;
        }

        &::after {
            content: '';
            position: absolute;
            left: 0.5em;
            bottom: 0;
            width: 0;
            height: 2px;
            transition: width 0.15s ease-in-out;
            border-radius: 16px;

            @include theme-dark {
                background-color: $color-text-primary;
            }

            @include theme-light {
                background-color: $color-primary;
            }
        }

        &:hover {
            @include theme-dark {
                background-color: $color-bg-secondary;
            }

            @include theme-light {
                background-color: lighten-color($color-primary-light, 28%);
            }
        }

        &:active {
            background-color: transparent !important;
        }

        &.active {
            &:hover {
                background-color: transparent;
            }

            &::after {
                width: 88%;
            }

            .icon {
                height: 1.4em;

                @include theme-dark {
                    fill: $color-text-primary;
                    stroke: $color-text-primary;
                }

                @include theme-light {
                    fill: $color-primary;
                    stroke: $color-primary;
                }
            }
        }

        .icon {
            height: 1.4em;

            @include theme-dark {
                fill: $color-text-secondary;
                stroke: $color-text-secondary;
            }

            @include theme-light {
                fill: $color-primary;
                stroke: $color-primary;
            }
        }
    }
}

header {
    height: 4.5em;
    display: flex;
    align-items: center;

    @include theme-dark {
        border-bottom: 1px solid lighten-color($color-bg-primary, 5%);
    }

    @include theme-light {
        border-bottom: 1px solid darken-color($color-bg-primary, 5%);
    }

    .theme-toggle {
        display: inline-flex;
        padding-left: 0.4em;
        margin: 1em;
        width: 3.5em;
        height: 2em;
        border-radius: 100px;
        box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.333);
        cursor: pointer;
        background-color: $color-bg-secondary;

        .toggle-input {
            /* Hide the native checkbox visually but keep it accessible */
            position: absolute;
            width: 0;
            height: 0;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            border-width: 0;
        }

        .toggle-thumb {
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 100%;

            .icon {
                position: relative;

                @include theme-dark {
                    height: 1.25em;
                    stroke: $color-bg-secondary;
                    fill: $color-bg-secondary;
                }

                @include theme-light {
                    height: 1.15em;
                    fill: #b6ad23;
                    stroke: #b6ad23;
                }
            }

            &.active {
                transform: translateX(115%);
            }

            &::before {
                content: '';
                position: absolute;
                width: 1.5em;
                height: 1.5em;
                border-radius: 100%;
                background-color: $color-gray4;
                transition: transform 0.3s;
                box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.333);
            }
        }
    }
}

.nav-mobile {
    position: fixed;
    bottom: 0.5em;
    right: 0.5em;
    left: 0.5em;
    max-width: 335px;
    display: flex;
    justify-content: space-between;
    height: 3em;
    padding: 0.4em;
    margin: 0 auto;
    background-color: $color-bg-secondary;
    border-radius: 16px;
    box-shadow: 0 20px 40px 5px rgba(0, 0, 0, 0.333);

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
        color: $color-accent;

        .icon {
            display: none;
        }

        span {
            font-size: clamp(0.4em, 3.5vw, 1em);
        }

        &.active {
            @include theme-dark {
                color: $color-primary;
            }

            @include theme-light {
                color: $color-gray2;
            }
        }

        &.active,
        &:active {
            background-color: lighten-color($color-bg-secondary, 10%);
            box-shadow: 0 1px 6px 0 rgba(0, 0, 0, 0.333);
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
                fill: $color-accent;
                stroke: $color-accent;
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

    header {
        padding-left: 1em;
        justify-content: space-between;

        .nav-desktop {
            display: flex;
        }
    }
}
</style>
