<script setup>
import { ref, watch } from 'vue';
import { useRouteStore } from '../stores/routeStore.js';
import { useThemeStore } from '../stores/themeStore.js';
import { useMotions, useMotion } from '@vueuse/motion';
import { Motions } from '../utils/motions.js';

import MoonIcon from '../components/SVGs/MoonIcon.vue';
import SunIcon from '../components/SVGs/SunIcon.vue';
import Logo from '../components/Logo.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const logo = ref(null);
const navItems = ref([]);

const logoMotions = useMotion(logo, Motions.directives['fade-in']);
const navItemMotions = ref([]);

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (routeStore.toPath === 'home' && newVal) {
            // The fix was janky but adding a different motion from the directive ("...-leave") works
            navItemMotions.value = navItems.value.map((el) => {
                if (!el) return null;
                return useMotion(el, Motions.directives['fade-in-leave']);
            });

            navItemMotions.value.reverse().forEach((motion, i) => {
                setTimeout(() => {
                    motion.set('leave');
                }, 100 * i);
            });
        }
    },
);
</script>

<template>
    <header>
        <Logo ref="logo" v-motion-fade-in />
        <nav v-if="routeStore.currentRoute.base !== 'home'" class="nav-desktop">
            <button
                v-for="(route, key, i) in routeStore.routes"
                :key="key"
                :class="{ active: routeStore.currentRoute.base === key }"
                @click="routeStore.toRoute(key)"
                v-motion-fade-slide-in-scalex
                :delay="100 * i"
                :ref="
                    (el) => {
                        if (el) navItems[i] = el;
                    }
                "
            >
                <component :is="route.meta.iconFill" v-if="routeStore.currentRoute.base === key" class="icon" />
                <component :is="route.meta.icon" v-else class="icon" />
                {{ route.meta.title }}
            </button>
        </nav>
        <label class="theme-toggle" v-motion-fade-in>
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
    <hr v-motion-fade-in-scalex />
    <nav class="nav-mobile" v-motion-slide-up-scalex>
        <button
            v-for="(route, key) in routeStore.routes"
            :key="key"
            @click="routeStore.toRoute(key)"
            :class="{ active: routeStore.currentRoute.base === key }"
        >
            <component :is="route.meta.iconFill" v-if="routeStore.currentRoute.base === key" class="icon" />
            <span>{{ route.meta.title }}</span>
        </button>
    </nav>
</template>

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
    opacity: 1;
    transform: rotate(0deg);
}

.nav-mobile {
    position: fixed;
    z-index: 1;
    right: $size-2;
    bottom: $size-2;
    left: $size-2;
    display: flex;
    justify-content: space-between;
    max-width: 335px;
    height: $size-10;
    padding: $size-2;
    margin: 0 auto;
    background-color: $color-bg-secondary;
    border-radius: $size-4;
    box-shadow: 0 20px 40px 5px rgb(0 0 0 / 33.3%);

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: $size-2 $size-3;
        font-family: $primary-font-stack;
        font-weight: 600;
        color: $color-accent;
        background-color: transparent;
        border: 0;
        border-radius: $size-4;

        .icon {
            display: none;
        }

        span {
            font-size: clamp(0.4em, 4vw, 1em);
        }

        &.active {
            @include theme-dark {
                color: $color-primary-light;
            }

            @include theme-light {
                color: $color-gray2;
            }
        }

        &.active,
        &:active {
            background-color: lighten-color($color-bg-secondary, 10%);
            box-shadow: 0 1px 6px 0 rgb(0 0 0 / 33.3%);
        }
    }
}

.nav-desktop {
    display: none;
    gap: $size-3;

    button {
        position: relative;
        font-size: 0.85em;
        font-family: $primary-font-stack;
        font-weight: 400;
        display: flex;
        gap: $size-3;
        align-items: center;
        padding: $size-3 $size-5;
        background-color: transparent;
        border: 0;
        border-radius: $size-3;

        @include theme-dark {
            color: $color-text-primary;
        }

        @include theme-light {
            color: $color-primary-darker;
        }

        .icon {
            height: $size-6;

            @include theme-dark {
                fill: $color-text-secondary;
                stroke: $color-text-secondary;
            }

            @include theme-light {
                fill: $color-primary-darker;
                stroke: $color-primary-darker;
            }
        }

        &::after {
            position: absolute;
            bottom: 0;
            left: $size-2;
            width: 0;
            height: 1px;
            content: '';
            border-radius: $size-4;
            transition: width 0.15s ease-in-out;

            @include theme-dark {
                background-color: $color-text-secondary;
            }

            @include theme-light {
                background-color: $color-primary-darker;
            }
        }

        &:hover {
            @include theme-dark {
                background-color: $color-bg-secondary;
            }

            @include theme-light {
                background-color: #8ba7b340;
            }
        }

        &:active {
            background-color: transparent !important;
        }

        &.active {
            .icon {
                height: $size-6;

                @include theme-dark {
                    fill: $color-text-secondary;
                    stroke: $color-text-secondary;
                }

                @include theme-light {
                    fill: $color-primary-darker;
                    stroke: $color-primary-darker;
                }
            }

            &::after {
                width: 88%;
            }

            &:hover {
                background-color: transparent;
            }
        }
    }
}

header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: $size-13;
    padding: 0 $size-2;

    .theme-toggle {
        display: inline-flex;
        width: $size-11;
        height: $size-8;
        padding-left: 0.4em;
        margin: $size-4;
        cursor: pointer;
        border-radius: 100px;
        box-shadow: 0 1px 6px 0 rgb(0 0 0 / 33.3%);

        @include theme-dark {
            background-color: $color-bg-secondary;
        }

        @include theme-light {
            background-color: $color-primary-darker;
        }

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
                    height: $size-5;
                    fill: $color-bg-secondary;
                    stroke: $color-bg-secondary;
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
                position: absolute;
                content: '';
                width: $size-6;
                height: $size-6;
                border-radius: 100%;
                box-shadow: 0 1px 6px 0 rgb(0 0 0 / 33.3%);
                transition: transform 0.3s;

                @include theme-dark {
                    background-color: $color-gray4;
                }

                @include theme-light {
                    background-color: $color-bg-primary;
                }
            }
        }
    }
}

hr {
    border: 0;
    width: 100%;
    margin: 0;
    min-height: 1px;

    @include theme-dark {
        background-color: lighten-color($color-bg-primary, 5%);
    }

    @include theme-light {
        background-color: darken-color($color-bg-primary, 5%);
    }
}

@include bp-xsm-phone {
    .nav-mobile {
        font-size: 1.2em;

        button {
            font-size: 0.7em;
            gap: $size-2;

            .icon {
                display: inline-block;
                height: $size-6;
                width: $size-6;
                fill: $color-accent;
                stroke: $color-accent;
            }

            span {
                font-size: clamp(0.9em, 3.7vw, 1em);
            }

            &.active {
                .icon {
                    @include theme-dark {
                        fill: $color-primary-light;
                        stroke: $color-primary-light;
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
        .nav-desktop {
            display: flex;
        }
    }
}
</style>
