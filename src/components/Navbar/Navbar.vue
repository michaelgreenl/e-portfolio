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
                role="switch"
                aria-label="Dark theme"
                :checked="themeStore.theme === 'dark'"
                @change="themeStore.toggleTheme()"
            />

            <span class="toggle-thumb" :class="{ active: themeStore.theme === 'dark' }">
                <svg class="icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                    <g class="icon-body" fill="currentColor">
                        <path
                            d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                        />
                        <circle class="sun-disc" cx="12" cy="12" r="10.1" />
                    </g>
                    <path
                        class="sun-rays"
                        d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>
            </span>
        </label>
    </header>

    <hr class="nav-line" />

    <MobileNavbar />
</template>

<style lang="scss" scoped>
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
        position: relative;
        display: inline-flex;
        flex-shrink: 0;
        align-items: center;
        width: $size-11;
        height: $size-8;
        padding: $size-1;
        margin: $space-1;
        cursor: pointer;
        border-radius: $radius-pill;
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

        &:has(.toggle-input:focus-visible) {
            outline: 2px solid $color-primary-darker;
            outline-offset: 4px;
        }

        .toggle-input {
            position: absolute;
            inset: -6px 0;
            width: 100%;
            height: calc(100% + 12px);
            margin: 0;
            cursor: pointer;
            opacity: 0;
        }

        .toggle-thumb {
            display: flex;
            align-items: center;
            justify-content: center;
            width: $size-6;
            height: $size-6;
            pointer-events: none;
            background-color: $color-gray3;
            border-radius: $radius-round;
            box-shadow: 0 1px 6px 0 rgb(0 0 0 / 33.3%);
            transition:
                transform 0.36s cubic-bezier(0.4, 0, 0.2, 1),
                background-color 0.3s ease;

            .icon {
                width: $size-5;
                height: $size-5;
                color: #b6ad23;

                @include theme-dark {
                    color: $color-bg-secondary;
                }
            }

            .icon-body,
            .sun-disc,
            .sun-rays {
                transform-origin: 12px 12px;
                transition:
                    transform 0.36s cubic-bezier(0.4, 0, 0.2, 1),
                    opacity 0.36s cubic-bezier(0.4, 0, 0.2, 1);
            }

            .icon-body {
                transform: scale(0.5);
            }

            &.active {
                background-color: $color-gray4;
                transform: translateX(100%);

                .icon-body {
                    transform: scale(1);
                }

                .sun-disc {
                    transform: scale(0);
                }

                .sun-rays {
                    opacity: 0;
                    transform: scale(0.65);
                }
            }
        }
    }
}
</style>
