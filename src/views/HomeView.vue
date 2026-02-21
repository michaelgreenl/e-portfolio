<script setup>
import { onMounted, watch } from 'vue';
import { useGsap } from '@/composables/useGsap.js';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { homeAnimations } from '@/animations/page/home.js';
import Button from '@/components/Button.vue';
import DownloadThickIcon from '@/components/SVGs/DownloadThickIcon.vue';
import DownloadIcon from '@/components/SVGs/DownloadIcon.vue';
import GithubFillIcon from '@/components/SVGs/GithubFillIcon.vue';
import LinkedInIcon from '@/components/SVGs/LinkedInIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();

const { registerAnim } = useGsap();

const anims = {
    enterPage: registerAnim(homeAnimations.enterPage),
    exitPage: registerAnim(homeAnimations.exitPage),
};

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            anims.exitPage();
        }
    },
);

onMounted(() => {
    anims.enterPage();
});
</script>

<template>
    <div class="home-container">
        <div class="contact-links">
            <a href="https://github.com/michaelgreenl" target="_blank">
                <Button class="contact-link" :iconLeft="GithubFillIcon" preset="secondary" />
            </a>
            <a href="https://www.linkedin.com/in/michaelgreen5/" target="_blank">
                <Button class="contact-link" :iconLeft="LinkedInIcon" preset="secondary" />
            </a>
        </div>
        <div class="hero-content">
            <h3>Hi 👋, my name is</h3>
            <h1>Michael <span> Green </span></h1>
            <hr class="hero-line" />
            <h2>Full-Stack Developer</h2>
            <p>
                I build secure, scalable applications that combine elegant, intuitive UIs with robust, maintainable
                backend architecture.
            </p>

            <div class="cta">
                <Button :onClick="() => routeStore.toRoute('contact')" text="Contact" preset="primary primary-accent" />
                <a href="/files/resume.pdf" download="Michael-Green-Resume.pdf">
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

            <div v-for="(route, key) in routeStore.routes" :key="key" class="nav-link">
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
    flex-direction: column;
    flex-grow: 1;
    gap: $size-17;
    width: 100%;
    padding: 0 $size-4;
    margin: 0 auto;
    font-size: clamp(10px, 4vw, 16px);
    color: $color-text-primary;
    @include flexCenterAll;

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
        max-width: 1600px;
        font-size: 1.2em;
    }
}

h1 {
    padding-bottom: $size-1;
    margin: 0;
    font-size: 5.1em;
    line-height: 0.8ch;

    @include bp-custom-min(612) {
        max-width: 100vw;
        padding-bottom: $size-1;
        margin: 0 auto;
        font-size: clamp(5.1em, 12vw, 5.5em);
        line-height: 1ch;
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
    width: fit-content;
    margin: 0 auto;
    font-size: 1.9em;
    text-align: center;

    @include bp-md-tablet {
        margin: 0 !important;
    }
}

h3 {
    margin: 0 2px $size-2;

    @include bp-custom-min(612) {
        margin: 0 2px !important;
        font-size: 1.25em !important;
    }
}

p {
    max-width: 50ch;
    margin: 0 auto;
    font-size: 1.1em;
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
    max-width: 370px;

    @include bp-custom-min(612) {
        max-width: 100vw;
    }
}

.contact-links {
    position: absolute;
    top: $size-3;
    right: $size-2;
    width: 100vw;
    display: flex;
    justify-content: flex-end;
    font-size: 1.5em;

    a :deep(button) .icon:hover {
        fill: $color-primary;
    }
}

.hero-line {
    width: 95%;
    height: 1px;
    margin: 0 auto $size-2;
    border: 0;

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
    display: flex;
    gap: $size-4;
    justify-content: center;
    margin-top: $size-2;
    font-size: 1.1em;

    @include bp-md-tablet {
        justify-content: flex-start !important;
    }

    :deep(button) {
        font-weight: 400;
    }
}

.site-nav {
    display: none;
    flex-wrap: wrap-reverse;
    gap: $size-4;
    align-items: center;
    align-self: flex-end;
    justify-content: flex-end;
    width: 80%;

    @include bp-md-tablet {
        display: flex;
    }

    :deep(button) {
        padding: 0 $size-1;
        font-size: 1.2em;

        &::after {
            height: 2px;
        }
    }
}

.nav-links-line {
    flex-grow: 1;
    height: 1px;
    border: 0;

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-primary-darker;
    }
}
</style>
