<script setup>
import { nextTick, onMounted, shallowRef, watch } from 'vue';
import { gsap } from 'gsap';
import { useGsap } from '@/composables/useGsap.js';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { navbarAnimations } from '@/animations/component/navbar.js';
import DesktopNavbar from '@/components/Navbar/DesktopNavbar.vue';
import Logo from '@/components/Logo.vue';
import MobileNavbar from '@/components/Navbar/MobileNavbar.vue';
import MoonIcon from '@/components/SVGs/MoonIcon.vue';
import SunIcon from '@/components/SVGs/SunIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const { registerAnim } = useGsap();

const anims = {
    enterMobileNavbar: registerAnim(navbarAnimations.enterMobileNavbar),
    enterLogoTheme: registerAnim(navbarAnimations.enterLogoTheme),
    enterNavItem: registerAnim(navbarAnimations.enterNavItem),
    exitNavItem: registerAnim(navbarAnimations.exitNavItem),
    enterPage: registerAnim(navbarAnimations.enterPage),
};

const fromHome = shallowRef(false);

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
    <header class="navbar-header">
        <Logo class="logo" />

        <DesktopNavbar />

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

    <MobileNavbar />
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
    position: relative;
    z-index: 3;
    width: 100%;
    min-height: 1px;
    margin: 0;
    border: 0;
    transform: scaleX(0);

    @include theme-dark {
        background-color: #575e6455;
    }

    @include theme-light {
        background-color: #3d505c33;
    }
}

.navbar-header {
    position: relative;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: $size-13;
    padding: 0 $space-2;

    .theme-toggle {
        display: inline-flex;
        width: $size-11;
        height: $size-8;
        padding-left: 0.4em;
        margin: $space-1;
        cursor: pointer;
        border-radius: 100px;
        box-shadow: 0 1px 6px 0 rgb(0 0 0 / 33.3%);

        @include theme-dark {
            background-color: $color-bg-secondary;
        }

        @include theme-light {
            background-color: $color-primary;
        }

        @include bp-sm-phone {
            margin: $space-4;
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
                width: $size-6;
                height: $size-6;
                content: '';
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
</style>
