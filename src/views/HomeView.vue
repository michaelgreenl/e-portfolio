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
import MailSquareIcon from '@/components/SVGs/MailSquareIcon.vue';

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
    <div class="home-container page-shell">
        <div class="contact-links">
            <a href="https://github.com/michaelgreenl" target="_blank">
                <Button class="contact-link" :iconLeft="GithubFillIcon" preset="secondary" />
            </a>
            <a href="https://www.linkedin.com/in/michaelgreen5/" target="_blank">
                <Button class="contact-link" :iconLeft="LinkedInIcon" preset="secondary" />
            </a>
            <a href="mailto:greenmichael5000@gmail.com" aria-label="Email Michael Green">
                <Button class="contact-link" :iconLeft="MailSquareIcon" preset="secondary" />
            </a>
        </div>
        <div class="hero-content">
            <h3>Hi 👋, my name is</h3>
            <h1>
                <span class="hero-title hero-title-1">Michael</span>
                <span class="hero-title hero-title-2">Green</span>
            </h1>
            <hr class="hero-line" />
            <h2>Full-Stack Developer</h2>
            <p>
                Simplicity is not the absence of complexity; it is its resolution, the clarity distilled from its chaos.
            </p>

            <div class="cta">
                <Button @click="() => routeStore.toRoute('contact')" text="Contact" preset="primary primary-accent" />
                <a href="/files/Michael-L-Green-Resume.pdf" download="Michael-L-Green-Resume.pdf">
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
                    @click="() => routeStore.toRoute(key)"
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
    gap: 12vh;
    padding: $size-8 $size-4 0;

    @include bp-xsm-phone {
        font-size: 1em;
    }

    @include bp-md-tablet {
        align-items: flex-start;
        padding: 0 $size-12;
    }

    @include bp-lg-laptop {
        max-width: 1200px;
    }

    @include bp-xl-desktop {
        max-width: 1400px;
    }
}

$hero-tablet-bp: 525;

h1 {
    padding-bottom: $size-1;
    margin: 0;
    font-size: clamp(4.5em, 21vw, 5.2em);
    line-height: 0.8ch;

    @include bp-custom-min($hero-tablet-bp) {
        display: flex;
        gap: 12px;
        max-width: 100vw;
        padding-bottom: $size-1;
        margin: 0 auto;
        line-height: 1ch;
        font-size: clamp(4.2em, 13.2vw, 5.2em);
    }

    @include bp-md-tablet {
        padding: 0 !important;
    }

    .hero-title-1 {
        color: $color-primary-darker;
    }

    .hero-title-2 {
        margin-left: 1.4em;
        display: inherit;

        @include bp-custom-min($hero-tablet-bp) {
            margin-left: 0 !important;
            display: inline-block;
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

    @include bp-custom-min($hero-tablet-bp) {
        margin: 0 2px !important;
        font-size: 1.25em !important;
    }
}

p {
    max-width: 32ch;
    margin: 0 auto;
    text-align: center;
    text-wrap: auto !important;

    @include bp-xsm-phone {
        font-size: 1.1em;
    }

    @include bp-custom-min($hero-tablet-bp) {
        max-width: 47ch;
    }

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

    @include bp-custom-min($hero-tablet-bp) {
        max-width: 100vw;
    }
}

.contact-links {
    position: absolute;
    top: $size-3;
    right: $size-2;
    display: flex;
    gap: $size-2;
    justify-content: flex-end;
    width: 100vw;
    font-size: 1.7em;

    a :deep(button) {
        gap: 0;

        &::after {
            display: none;
        }

        .icon:hover {
            @include theme-dark {
                fill: $color-primary;
            }

            @include theme-light {
                fill: #5f8494;
            }
        }
    }

    @include bp-custom-min($hero-tablet-bp) {
        gap: 0.6em;
        font-size: 1.8em;
    }

    @include bp-sm-phone {
        right: 0.85em;
    }

    @include bp-lg-laptop {
        font-size: 1.7em;
    }
}

.hero-line {
    width: 95%;
    margin: 0 auto $size-2;

    @include bp-md-tablet {
        display: none;
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
    width: 90%;

    @include bp-md-tablet {
        display: flex;
    }

    :deep(button) {
        padding: 0 $size-1;
        font-size: 1.3em;

        &::after {
            height: 2px;
        }
    }
}

.nav-links-line {
    flex-grow: 1;
}
</style>
