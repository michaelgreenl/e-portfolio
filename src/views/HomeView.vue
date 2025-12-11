<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { useHomeAnimations } from '@/composables/animations/useHomeAnimations.js';
import Button from '@/components/Button.vue';
import DownloadThickIcon from '@/components/SVGs/DownloadThickIcon.vue';
import DownloadIcon from '@/components/SVGs/DownloadIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const { enterPageAnim, exitPageAnim } = useHomeAnimations();

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            exitPageAnim();
        }
    },
);

onMounted(() => {
    enterPageAnim();
});
</script>

<template>
    <div class="home-container">
        <div class="hero-content">
            <h3>Hi 👋, my name is</h3>
            <h1>
                Michael
                <span> Green </span>
            </h1>
            <hr class="hero-line" />
            <h2>Full-Stack Developer</h2>
            <p>
                Hello, I am a software engineer with a passion for solving problems. I am writing this in normal a a
                english now.
            </p>
            <div class="cta">
                <Button :onClick="() => routeStore.toRoute('contact')" text="Contact" preset="primary primary-accent" />
                <a href="files/blank-resume.pdf" download="files/blank-resume.pdf">
                    <Button
                        text="Resume/CV"
                        :iconRight="themeStore.theme === 'light' ? DownloadThickIcon : DownloadIcon"
                        preset="primary"
                    />
                </a>
            </div>
        </div>
        <div class="site-nav">
            <hr class="nav-links-line" />
            <div v-for="(route, key, i) in routeStore.routes" :key="key" class="nav-link">
                <Button
                    v-if="key !== 'home'"
                    :onClick="() => routeStore.toRoute(key)"
                    :text="route.meta.title"
                    :iconLeft="route.meta.icon"
                    :iconLeftFill="route.meta.iconFill"
                    preset="secondary"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.home-container {
    font-size: clamp(10px, 4vw, 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    flex-grow: 1;
    padding: 0 $size-4;
    max-width: 400px;
    margin: 0 auto;
    gap: $size-17;
    color: $color-text-primary;

    @include bp-custom-min(612) {
        max-width: 100vw;
    }

    @include bp-custom-min(750) {
        padding: 0 $size-11;
    }

    @include bp-md-tablet {
        align-items: flex-start;
        padding: 0 $size-12;
    }

    @include bp-lg-laptop {
        max-width: 1200px;
        margin: 0 auto;
    }

    @include bp-xl-desktop {
        font-size: 1.2em;
        max-width: 1600px;
    }
}

h1 {
    font-size: 5.1em;
    line-height: 0.8ch;
    padding-bottom: $size-1;
    margin: 0;

    @include bp-custom-min(612) {
        font-size: clamp(5.1em, 12vw, 5.5em) !important;
        line-height: 1ch !important;
        max-width: 100vw !important;
        margin: 0 auto !important;
        padding-bottom: $size-1 !important;
    }

    @include bp-md-tablet {
        padding: 0 !important;
    }

    span {
        margin-left: 1.4em;

        @include bp-custom-min(612) {
            margin-left: 0 !important;
        }

        @include theme-dark {
            color: $color-primary-light;
        }

        @include theme-light {
            color: $color-primary;
        }
    }
}

h2 {
    font-size: 1.9em;
    width: fit-content;
    margin: 0 auto;
    text-align: center;

    @include bp-md-tablet {
        margin: 0 !important;
    }
}

h3 {
    margin: 0 2px $size-2;

    @include bp-custom-min(612) {
        font-size: 1.25em !important;
        margin: 0 2px 0 !important;
    }
}

p {
    font-size: 1.1em;
    max-width: 45ch;
    margin: 0 auto;
    text-align: center;

    @include bp-md-tablet {
        margin: 0 !important;
        text-align: left !important;
    }
}

.hero-content {
    display: flex;
    flex-direction: column;
    gap: $size-2;
}

.hero-line {
    border: 0;
    width: 95%;
    margin: 0 auto $size-2;
    height: 1px;

    @include bp-md-tablet {
        display: none;
    }

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-gray5;
    }
}

.cta {
    font-size: 1.1em;
    display: flex;
    justify-content: center;
    gap: $size-4;
    margin-top: $size-2;

    @include bp-md-tablet {
        justify-content: flex-start !important;
    }

    :deep(button) {
        font-weight: 400;
    }
}

.site-nav {
    display: none;
    gap: $size-4;
    align-self: flex-end;
    justify-content: flex-end;
    align-items: center;
    flex-wrap: wrap-reverse;
    width: 80%;

    @include bp-md-tablet {
        display: flex;
    }

    :deep(button) {
        font-size: 1.2em;
        padding: 0 $size-1;

        &::after {
            height: 2px;
        }
    }
}

.nav-links-line {
    border: 0;
    height: 1px;
    flex-grow: 1;

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-primary-darker;
    }
}
</style>
