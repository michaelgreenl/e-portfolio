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
                <button @click="routeStore.toRoute('contact')">Contact</button>
                <DownloadResumeBtn />
            </div>
        </div>
        <div class="site-nav">
            <hr class="nav-line" />
            <div v-for="(route, key) in routeStore.routes" :key="key">
                <button v-if="key !== 'home'" @click="routeStore.toRoute(key)">
                    <component :is="route.meta.iconFill" class="icon" />
                    <span>{{ route.meta.title }}</span>
                </button>
            </div>
            <button>
                <BlogIcon class="icon" />
                My Blog
            </button>
        </div>
    </div>
</template>

<script setup>
import { useRouteStore } from '../stores/routeStore.js';
import DownloadResumeBtn from '../components/DownloadResumeBtn.vue';
import BlogIcon from '../components/SVGs/BlogIcon.vue';

const routeStore = useRouteStore();
</script>

<style lang="scss" scoped>
.home-container {
    font-size: clamp(10px, 4vw, 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
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
            font-family: $primary-font-stack;
            font-weight: 600;
            line-height: 0.8ch;
            color: $color-primary-darker;
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

            @include theme-light {
                text-shadow: 0px 3px 5px #00000025;
            }
        }

        h2 {
            font-size: 1.9em;
            font-weight: 400;
            border-right: solid 2px $color-text-primary;
            width: fit-content;
            margin: 0 auto;

            @include theme-dark {
                color: $color-primary-light;
            }

            @include theme-light {
                color: $color-primary-darker;
            }
        }

        h2,
        p {
            text-align: center;
        }

        h3 {
            color: $color-primary-darker;
            font-family: $primary-font-stack;
            font-weight: 400;
            margin: 0 2px $size-2;
        }

        p {
            font-size: 1.1em;
            max-width: 45ch;
            color: $color-text-secondary;
            font-family: $secondary-font-stack;
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

            button {
                display: flex;
                gap: $size-2;
                align-items: center;
                justify-content: center;
                padding: $size-2 $size-4;
                font-family: $primary-font-stack;
                font-size: 1em;
                font-weight: 400;
                letter-spacing: 0.1ch;
                background: transparent;
                border-radius: 12px;

                svg {
                    height: $size-4;
                }

                @include theme-dark {
                    color: $color-text-primary;
                    border: solid 2px $color-text-primary;

                    svg {
                        fill: $color-text-primary;
                    }
                }

                @include theme-light {
                    color: $color-primary-darker;
                    border: solid 2px $color-primary-darker;

                    svg {
                        fill: $color-primary-darker;
                    }
                }

                @include interactive {
                    color: $color-bg-primary;

                    @include theme-dark {
                        background: $color-text-primary;

                        svg {
                            fill: $color-bg-primary;
                        }
                    }

                    @include theme-light {
                        background: $color-primary-darker;

                        svg {
                            fill: $color-bg-primary;
                        }
                    }
                }

                &:active {
                    transform: scale(0.9);
                }
            }

            button:first-child {
                color: $color-bg-primary;

                @include theme-dark {
                    background: $color-text-primary;
                }

                @include theme-light {
                    background: $color-primary-darker;
                }
            }

            button:last-child {
                // Fix for odd spacing effect happening with icon
                padding-right: 0.95em;
            }
        }
    }

    .site-nav {
        display: none;
        gap: $size-4;
        align-self: flex-end;
        justify-content: flex-end;
        align-items: center;
        flex-wrap: wrap-reverse;
        width: 90%;

        .nav-line {
            border: 0;
            height: 1px;
            flex-grow: 1;
            background-color: $color-text-muted !important;
        }

        button {
            position: relative;
            font-size: 1.2em;
            font-family: $primary-font-stack;
            display: flex;
            align-items: center;
            gap: $size-2;
            background: transparent;
            border: 0;
            border-radius: 12px;

            @include theme-dark {
                color: $color-text-primary;
            }

            @include theme-light {
                color: $color-primary-darker;
            }

            .icon {
                height: $size-5;

                @include theme-dark {
                    fill: lighten-color($color-text-muted, 10%);
                }

                @include theme-light {
                    fill: $color-primary-darker;
                }
            }

            &::after {
                content: '';
                position: absolute;
                bottom: -6px;
                left: 1.9em;
                right: 100%;
                height: 1px;
                transition: all 0.3s ease;

                @include theme-dark {
                    background-color: $color-text-secondary;
                }

                @include theme-light {
                    background-color: $color-primary-darker;
                }
            }

            @include interactive {
                &::after {
                    right: 0;
                }
            }
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
        padding: $size-13 $size-10 0 $size-12;

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
