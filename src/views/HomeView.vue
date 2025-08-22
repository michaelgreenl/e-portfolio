<script setup>
import { useMotions } from '@vueuse/motion';
import { useRouteStore } from '../stores/routeStore.js';
import Button from '../components/Button.vue';
import DownloadIcon from '../components/SVGs/DownloadIcon.vue';

const routeStore = useRouteStore();
</script>

<template>
    <div class="home-container">
        <div
            class="hero-content"
            v-motion
            :initial="{ x: -150, opacity: 0 }"
            :enter="{ x: 0, opacity: 1, transition: { duration: 100, ease: 'easeOut' } }"
        >
            <h3>Hi 👋, my name is</h3>
            <h1>
                Michael
                <span> Green </span>
            </h1>
            <hr
                class="hero-line"
                v-motion
                :initial="{ opacity: 0, scaleX: 0 }"
                :enter="{ opacity: 1, scaleX: 1, transition: { duration: 200, easing: 'easeIn', delay: 50 } }"
            />
            <h2>Full-Stack Developer</h2>
            <p>
                Hello, I am a software engineer with a passion for solving problems. I am writing this in normal a a
                english now.
            </p>
            <div class="cta">
                <Button
                    :onClick="
                        () => {
                            routeStore.toRoute('contact');
                        }
                    "
                    text="Contact"
                    preset="primary primary-accent"
                />
                <a href="files/blank-resume.pdf" download="files/blank-resume.pdf">
                    <Button text="Resume/CV" :iconRight="DownloadIcon" preset="primary" />
                </a>
            </div>
        </div>
        <div class="site-nav">
            <hr
                class="nav-line"
                v-motion
                :initial="{ opacity: 0, scaleX: 0 }"
                :enter="{ opacity: 1, scaleX: 1, transition: { duration: 200, easing: 'easeIn', delay: 50 } }"
            />
            <div
                v-for="(route, key, i) in routeStore.routes"
                :key="key"
                v-motion
                :initial="{ opacity: 0, x: 50 }"
                :enter="{
                    opacity: 1,
                    x: 0,
                    transition: { duration: 100, easing: 'easeIn', delay: 100 * i },
                }"
            >
                <Button
                    v-if="key !== 'home'"
                    :onClick="
                        () => {
                            routeStore.toRoute(key);
                        }
                    "
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

    .hero-content {
        display: flex;
        flex-direction: column;
        gap: $size-2;

        h1,
        h2,
        h3,
        p {
            margin: 0;
        }

        h1 {
            font-size: 5.1em;
            line-height: 0.8ch;
            padding-bottom: $size-1;

            span {
                margin-left: 1.4em;

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
            border-right: solid 2px $color-text-primary;
            width: fit-content;
            margin: 0 auto;
        }

        h2,
        p {
            text-align: center;
        }

        h3 {
            margin: 0 2px $size-2;
        }

        p {
            font-size: 1.1em;
            max-width: 45ch;
            margin: 0 auto;
        }

        .hero-line {
            border: 0;
            width: 90%;
            margin: 0 auto $size-2;
            height: 1px;

            @include theme-dark {
                background-color: lighten-color($color-bg-primary, 5%);
            }

            @include theme-light {
                background-color: darken-color($color-bg-primary, 5%);
            }
        }

        .cta {
            font-size: 1.1em;
            display: flex;
            justify-content: center;
            gap: $size-4;
            margin-top: $size-2;
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

        .nav-line {
            border: 0;
            height: 1px;
            flex-grow: 1;
            background-color: $color-text-muted !important;
        }

        button {
            font-size: 1.2em;
            padding: 0 $size-1;
        }
    }

    @include bp-custom-min(612) {
        max-width: 100vw;

        h1 {
            font-size: clamp(5.1em, 12vw, 5.5em) !important;
            line-height: 1ch !important;
            max-width: 100vw !important;
            margin: 0 auto !important;
            padding-bottom: $size-1 !important;

            span {
                margin-left: 0 !important;
            }
        }

        h3 {
            font-size: 1.25em !important;
            margin: 0 2px 0 !important;
        }
    }

    @include bp-custom-min(750) {
        padding: 0 $size-11;
    }

    @include bp-md-tablet {
        align-items: flex-start;
        padding: 0 $size-12;

        h1 {
            padding: 0 !important;
        }

        h2,
        p {
            margin: 0 !important;
        }

        p {
            text-align: left !important;
        }

        .hero-line {
            display: none;
        }

        .cta {
            justify-content: flex-start !important;
        }

        .site-nav {
            display: flex;
        }
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
</style>
