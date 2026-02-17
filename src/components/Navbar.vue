<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { gsap } from 'gsap';
import { useGsap } from '@/composables/useGsap.js';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { navbarAnimations } from '@/animations/component/navbar.js';
import MoonIcon from '@/components/SVGs/MoonIcon.vue';
import SunIcon from '@/components/SVGs/SunIcon.vue';
import Logo from '@/components/Logo.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const { registerAnim } = useGsap();

// Register all animations with component-scoped context
const anims = {
    enterMobileNavbar: registerAnim(navbarAnimations.enterMobileNavbar),
    enterLogoTheme: registerAnim(navbarAnimations.enterLogoTheme),
    enterNavItem: registerAnim(navbarAnimations.enterNavItem),
    exitNavItem: registerAnim(navbarAnimations.exitNavItem),
    enterPage: registerAnim(navbarAnimations.enterPage),
};

const fromHome = ref(false);

onMounted(() => {
    if (routeStore.activePath !== 'home') {
        const tl = gsap.timeline();
        anims.enterPage({
            tl,
            isHomePage: false,
            enterNavItem: anims.enterNavItem,
            enterLogoTheme: anims.enterLogoTheme,
            enterMobileNavbar: anims.enterMobileNavbar,
        });
    } else {
        anims.enterPage({
            isHomePage: true,
            enterLogoTheme: anims.enterLogoTheme,
            enterMobileNavbar: anims.enterMobileNavbar,
        });
        fromHome.value = true;
    }
});

watch(
    () => routeStore.isLeaving,
    async (newVal) => {
        if (routeStore.activePath !== 'home' && fromHome.value) {
            await nextTick();
            anims.enterNavItem();
            fromHome.value = false;
        } else if (routeStore.toPath === 'home' && newVal) {
            anims.exitNavItem();
        } else if (routeStore.activePath === 'home') {
            fromHome.value = true;
        }
    },
);
</script>

<template>
    <header>
        <Logo class="logo" />

        <nav v-if="routeStore.currentRoute.base !== 'home'" class="nav-desktop">
            <button
                v-for="(route, key) in routeStore.routes"
                :key="key"
                class="nav-item"
                :class="{ active: routeStore.currentRoute.base === key }"
                :disabled="routeStore.currentRoute.base === key"
                @click="routeStore.toRoute(key)"
            >
                <component :is="route.meta.iconFill" v-if="routeStore.currentRoute.base === key" class="icon" />
                <component :is="route.meta.icon" v-else class="icon" />
                {{ route.name }}
            </button>
        </nav>

        <label class="theme-toggle">
            <input
                class="toggle-input"
                type="checkbox"
                id="theme"
                true-value="dark"
                false-value="light"
                aria-label="Toggle theme"
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
    <hr class="nav-line" />

    <nav class="nav-mobile">
        <button
            v-for="(route, key) in routeStore.routes"
            :key="key"
            @click="routeStore.toRoute(key)"
            :class="{ active: routeStore.currentRoute.base === key }"
            :disabled="routeStore.currentRoute.base === key"
        >
            <component :is="route.meta.iconFill" v-if="routeStore.currentRoute.base === key" class="icon" />

            <span>{{ route.name }}</span>
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

// Not setting these initial properties creates awkward flashing on page load when running enter animations.
.logo,
.theme-toggle {
    opacity: 0;
}

.nav-line {
    transform: scaleX(0);
}

.nav-desktop button {
    opacity: 0;
    transform: translateX(-50px) scaleX(0.5);
}

.nav-mobile {
    transform: translateY(150px) scaleX(0);
}

.nav-mobile {
    position: fixed;
    z-index: 9;
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

    @include bp-xsm-phone {
        font-size: 1.2em;
    }

    @include bp-md-tablet {
        display: none;
    }

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

        @include bp-xsm-phone {
            font-size: 0.7em;
            gap: $size-2;
        }

        .icon {
            display: none;

            @include bp-xsm-phone {
                display: inline-block;
                height: $size-6;
                width: $size-6;
                fill: $color-accent;
                stroke: $color-accent;
            }
        }

        span {
            font-size: clamp(0.4em, 4vw, 1em);

            @include bp-xsm-phone {
                font-size: clamp(0.9em, 3.7vw, 1em);
            }
        }

        &.active {
            @include theme-dark {
                color: $color-primary-light;
            }

            @include theme-light {
                color: $color-gray2;
            }

            .icon {
                @include bp-xsm-phone {
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

    @include bp-md-tablet {
        display: flex;
    }

    button {
        position: relative;
        font-size: 0.85em;
        font-family: $primary-font-stack;
        display: flex;
        gap: $size-3;
        align-items: center;
        padding: $size-3 $size-5;
        background-color: transparent;
        border: 0;
        border-radius: $size-3;

        @include theme-dark {
            color: $color-text-primary;
            font-weight: 400;
        }

        @include theme-light {
            color: $color-primary-darker;
            font-weight: 500;
        }

        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: $size-2;
            width: 0;
            height: 1px;
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
                background-color: lighten-color($color-gray4, 10%);
            }
        }

        &:active {
            background-color: transparent !important;
        }

        &.active {
            &::after {
                width: 88%;
            }

            &:hover {
                background-color: transparent;
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
    }
}

header {
    position: relative;
    z-index: 3;
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
            background-color: $color-primary;
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
            transition: all 0.3s ease;

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
        }
    }
}

.nav-line {
    position: relative;
    z-index: 3;
    border: 0;
    width: 100%;
    margin: 0;
    min-height: 1px;

    @include theme-dark {
        background-color: #575e6455;
    }

    @include theme-light {
        background-color: #3d505c33;
    }
}
</style>
