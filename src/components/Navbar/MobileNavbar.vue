<script setup>
import { nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from 'vue';
import { gsap } from 'gsap';
import { TIMING } from '@/animations/constants/timing.js';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';
import { useRouteStore } from '@/stores/routeStore.js';

const routeStore = useRouteStore();
const { fadeIn, fadeOut } = useUtilAnimations();

const mobileNav = useTemplateRef('mobileNav');
const activeItemBg = useTemplateRef('activeItemBg');
const activeBgTween = shallowRef(null);
const pendingLabelRects = shallowRef(null);
const mobileNavButtonRefs = new Map();

let resizeObserver;

const setMobileNavButtonRef = (key, el) => {
    if (el) {
        mobileNavButtonRefs.set(key, el);
        return;
    }

    mobileNavButtonRefs.delete(key);
};

const measureMobileNavItem = (key) => {
    const buttonEl = mobileNavButtonRefs.get(key);

    if (!buttonEl || !buttonEl.offsetWidth) return null;

    const x = buttonEl.offsetLeft;
    const width = buttonEl.offsetWidth;

    return {
        x,
        width,
        right: x + width,
    };
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const setActiveBgMetrics = (metrics) => {
    if (!activeItemBg.value || !metrics) return;

    gsap.set(activeItemBg.value, {
        x: metrics.x,
        width: metrics.width,
    });
};

const captureMobileNavLabelRects = () => {
    const rects = new Map();

    mobileNavButtonRefs.forEach((buttonEl, key) => {
        const label = buttonEl.querySelector('.nav-label');

        if (!label) return;

        const rect = label.getBoundingClientRect();
        rects.set(key, {
            left: rect.left,
            top: rect.top,
        });
    });

    return rects;
};

const animateMobileNavLabels = (previousRects) => {
    if (!previousRects || prefersReducedMotion()) return;

    mobileNavButtonRefs.forEach((buttonEl, key) => {
        const label = buttonEl.querySelector('.nav-label');
        const previousRect = previousRects.get(key);

        if (!label || !previousRect) return;

        const currentRect = label.getBoundingClientRect();
        const x = previousRect.left - currentRect.left;
        const y = previousRect.top - currentRect.top;

        if (Math.abs(x) < 0.5 && Math.abs(y) < 0.5) return;

        gsap.killTweensOf(label);
        gsap.fromTo(
            label,
            { x, y },
            {
                duration: TIMING.duration.normal,
                ease: TIMING.easing.smooth,
                x: 0,
                y: 0,
                clearProps: 'transform',
            },
        );
    });
};

const syncActiveBgToCurrentRoute = () => {
    activeBgTween.value?.kill();
    activeBgTween.value = null;

    setActiveBgMetrics(measureMobileNavItem(routeStore.currentRoute.base));
};

const getExpandedMetrics = (fromMetrics, toMetrics) => {
    if (toMetrics.x > fromMetrics.x) {
        return {
            x: fromMetrics.x,
            width: toMetrics.right - fromMetrics.x,
        };
    }

    return {
        x: toMetrics.x,
        width: fromMetrics.right - toMetrics.x,
    };
};

const animateActiveBgToRoute = (fromMetrics, toMetrics) => {
    if (!activeItemBg.value || !toMetrics) return;

    if (!fromMetrics || prefersReducedMotion()) {
        setActiveBgMetrics(toMetrics);
        return;
    }

    activeBgTween.value?.kill();
    setActiveBgMetrics(fromMetrics);

    const expandedMetrics = getExpandedMetrics(fromMetrics, toMetrics);

    activeBgTween.value = gsap
        .timeline({
            defaults: {
                ease: TIMING.easing.smooth,
            },
            onComplete: () => {
                activeBgTween.value = null;
            },
        })
        .to(activeItemBg.value, {
            duration: TIMING.duration.fast,
            x: expandedMetrics.x,
            width: expandedMetrics.width,
        })
        .to(
            activeItemBg.value,
            {
                duration: TIMING.duration.normal,
                x: toMetrics.x,
                width: toMetrics.width,
            },
            '-=0.03',
        );
};

onMounted(() => {
    syncActiveBgToCurrentRoute();

    if (mobileNav.value) {
        resizeObserver = new ResizeObserver(syncActiveBgToCurrentRoute);
        resizeObserver.observe(mobileNav.value);
    }
});

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            pendingLabelRects.value = captureMobileNavLabelRects();
        }
    },
);

watch(
    () => routeStore.currentRoute.base,
    async (newRouteBase, oldRouteBase) => {
        const fromMetrics = measureMobileNavItem(oldRouteBase);
        const previousLabelRects = pendingLabelRects.value;

        await nextTick();

        animateMobileNavLabels(previousLabelRects);
        animateActiveBgToRoute(fromMetrics, measureMobileNavItem(newRouteBase));
        pendingLabelRects.value = null;
    },
);

onUnmounted(() => {
    activeBgTween.value?.kill();
    gsap.killTweensOf('.nav-label');
    resizeObserver?.disconnect();
});

const navMobileRouteTo = (key) => {
    fadeOut({ selector: '.mobile-nav-icon', opts: { delay: 0.2 } });
    routeStore.toRoute(key);
    setTimeout(() => {
        fadeIn({ selector: '.mobile-nav-icon' });
    }, 400);
};
</script>

<template>
    <nav ref="mobileNav" class="nav-mobile">
        <div ref="activeItemBg" class="active-item-bg" aria-hidden="true"></div>

        <button
            v-for="(route, key) in routeStore.routes"
            :key="key"
            :ref="(el) => setMobileNavButtonRef(key, el)"
            class="mobile-nav-button"
            :class="{ active: routeStore.currentRoute.base === key }"
            :disabled="routeStore.currentRoute.base === key"
            @click="navMobileRouteTo(key)"
        >
            <span class="mobile-nav-icon-slot" aria-hidden="true">
                <component
                    :is="route.meta.iconFill"
                    class="icon mobile-nav-icon"
                    :class="{
                        active: routeStore.currentRoute.base === key,
                    }"
                />
            </span>

            <span class="nav-label">{{ route.name }}</span>
        </button>
    </nav>
</template>

<style lang="scss" scoped>
.nav-mobile {
    position: fixed;
    right: $space-2;
    bottom: $space-2;
    left: $space-2;
    z-index: 9;
    display: flex;
    justify-content: space-between;
    max-width: 347px;
    height: $size-10;
    padding: $space-2;
    margin: 0 auto;
    color: $color-accent;
    background-color: color-mix(in srgb, $color-bg-secondary 60%, transparent);
    border-radius: $radius-lg;
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, lighten-color($color-bg-secondary, 46%) 30%, transparent),
        inset 0 0 0 1px color-mix(in srgb, darken-color($color-bg-secondary, 12%) 22%, transparent),
        0 18px 36px 4px rgb(0 0 0 / 30%);
    backdrop-filter: blur(15px) saturate(130%);

    @include bp-xsm-phone {
        font-size: 1.2em;
    }

    @include bp-sm-phone {
        max-width: 374px;
    }

    @include bp-md-tablet {
        display: none;
    }
}

.active-item-bg {
    position: absolute;
    top: 0.35em;
    bottom: 0.35em;
    left: 0;
    z-index: 1;
    width: 0;
    pointer-events: none;
    will-change: transform, width;

    &::before {
        position: absolute;
        inset: 0 -0.2em;
        content: '';
        border-radius: $radius-md;
        box-shadow:
            inset 0 1px 0 color-mix(in srgb, lighten-color($color-bg-secondary, 42%) 30%, transparent),
            inset 0 -1px 0 color-mix(in srgb, darken-color($color-bg-secondary, 22%) 36%, transparent),
            0 2px 5px 0 rgb(0 0 0 / 28%);

        @include theme-dark {
            background-color: color-mix(in srgb, $color-bg-secondary 60%, transparent);
        }

        @include theme-light {
            background-color: color-mix(in srgb, #002136 45%, transparent);
        }
    }
}

.mobile-nav-button {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $space-2 $space-3;
    font-family: $primary-font-stack;
    font-weight: 600;
    color: $color-accent;
    background-color: transparent;
    border: 0;
    border-radius: $radius-lg;

    @include bp-xsm-phone {
        gap: 0;
        font-size: 0.7em;
    }

    .mobile-nav-icon-slot {
        display: none;
    }

    .icon {
        display: none;

        @include bp-xsm-phone {
            display: block;
            flex: 0 0 $size-6;
            width: $size-6;
            height: $size-6;

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

    @include bp-xsm-phone {
        .mobile-nav-icon-slot {
            display: inline-flex;
            flex: 0 0 auto;
            align-items: center;
            justify-content: center;
            width: $size-6;
            max-width: 0;
            margin-right: 0;
            overflow: hidden;
        }

        &.active {
            .mobile-nav-icon-slot {
                max-width: $size-6;
            margin-right: $space-2;
            }
        }
    }

    .nav-label {
        display: inline-block;
        font-size: clamp(0.4em, 4vw, 1em);
        will-change: transform;

        @include bp-xsm-phone {
            font-size: clamp(0.9em, 3.7vw, 1em);
        }

        @include theme-light {
            color: $color-gray2;
        }
    }

    &.active {
        .nav-label {
            @include theme-dark {
                color: $color-primary-light;
            }

            @include theme-light {
                color: $color-gray2;
            }
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
}
</style>
