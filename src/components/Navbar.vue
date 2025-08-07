<template>
    <header>
        <Logo />
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
import Logo from '../components/Logo.vue';

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
    opacity: 1;
    transform: rotate(0deg);
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    opacity: 0;
    transform: translateY(100px);
}

.nav-mobile {
    position: fixed;
    z-index: 1;
    right: 0.5em;
    bottom: 0.5em;
    left: 0.5em;
    display: flex;
    justify-content: space-between;
    max-width: 335px;
    height: 3em;
    padding: 0.4em;
    margin: 0 auto;
    background-color: $color-bg-secondary;
    border-radius: 16px;
    box-shadow: 0 20px 40px 5px rgb(0 0 0 / 33.3%);

    button {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0.5em 0.8em;
        font-family: $primary-font-stack;
        font-weight: 600;
        color: $color-accent;
        background-color: transparent;
        border: 0;
        border-radius: 12px;

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
            box-shadow: 0 1px 6px 0 rgb(0 0 0 / 33.3%);
        }
    }
}

.nav-desktop {
    display: none;
    gap: 0.8em;

    button {
        position: relative;
        display: flex;
        gap: 0.6em;
        align-items: center;
        padding: 0.75em 1.1em;
        font-family: $primary-font-stack;
        font-size: 0.85em;
        font-weight: 500;
        background-color: transparent;
        border: 0;
        border-radius: 12px;

        @include theme-dark {
            color: $color-text-primary;
        }

        @include theme-light {
            color: $color-primary-darker;
        }

        .icon {
            height: 1.4em;

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
            left: 0.5em;
            width: 0;
            height: 1px;
            content: '';
            border-radius: 16px;
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
                background-color: #ced8de;
            }
        }

        &:active {
            background-color: transparent !important;
        }

        &.active {
            .icon {
                height: 1.4em;

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
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 4.5em;
    padding: 0 0.5em;

    @include theme-dark {
        border-bottom: 1px solid lighten-color($color-bg-primary, 5%);
    }

    @include theme-light {
        border-bottom: 1px solid darken-color($color-bg-primary, 5%);
    }

    .theme-toggle {
        display: inline-flex;
        width: 3.5em;
        height: 2em;
        padding-left: 0.4em;
        margin: 1em;
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
                    height: 1.25em;
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
                width: 1.5em;
                height: 1.5em;
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

@include bp-xsm-phone {
    .nav-mobile {
        button {
            gap: 0.4em;

            .icon {
                display: block;
                height: 100%;
                fill: $color-accent;
                stroke: $color-accent;
            }

            span {
                font-size: clamp(0.9em, 3.6vw, 1em);
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
        .nav-desktop {
            display: flex;
        }
    }
}
</style>
