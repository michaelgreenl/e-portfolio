<template>
    <div class="home-container">
        <div class="hero-content">
            <h3>Hi 👋, my name is</h3>
            <h1>
                Michael
                <span> Green </span>
            </h1>
            <h2>Full-Stack Developer</h2>
            <p>
                Hello, I am a software engineer with a passion for solving problems. I am writing this in english now
                because lorem ipsum looks weird.
            </p>
            <div class="cta">
                <button>Contact</button>
                <button>
                    Resume/CV
                    <DownloadIcon />
                </button>
            </div>
        </div>
        <div class="site-nav">
            <hr />
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
import DownloadIcon from '../components/SVGs/DownloadIcon.vue';
import BlogIcon from '../components/SVGs/BlogIcon.vue';

const routeStore = useRouteStore();
</script>

<style lang="scss" scoped>
.home-container {
    font-size: 0.8em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    height: 100vh;
    padding: 4.5em 1em 0;
    gap: 6.5em;
    color: $color-text-primary;

    .hero-content {
        display: flex;
        flex-direction: column;
        gap: 4px;

        h1,
        h2,
        h3,
        p {
            margin: 0;
        }

        h1 {
            color: $color-primary-darker;
            font-family: $primary-font-stack;
            font-size: 5em;
            font-weight: 600;
            line-height: 0.8ch;

            span {
                color: $color-primary-light;
                margin-left: 1.4em;
            }
        }

        h2 {
            font-size: 2em;
            font-weight: 400;
            color: $color-primary-light;
        }

        h3 {
            color: $color-primary-darker;
            font-family: $primary-font-stack;
            font-weight: 400;
            margin: 0 2px 4px;
        }

        p {
            max-width: 69ch;
            color: $color-text-secondary;
            font-family: $secondary-font-stack;
        }

        .cta {
            display: flex;
            gap: 1em;
            margin-top: 0.5em;

            button {
                display: flex;
                gap: 0.4em;
                align-items: center;
                justify-content: center;
                padding: 0.5em 1.1em;
                font-family: $primary-font-stack;
                font-size: 1em;
                font-weight: 500;
                background: transparent;
                border-radius: 12px;

                svg {
                    height: 1em;
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
                padding-right: 0.95em;
            }
        }
    }

    .site-nav {
        display: none;
        gap: 1em;
        justify-content: flex-end;
        align-items: center;
        flex-wrap: wrap-reverse;
        padding-left: 10%;

        hr {
            border: 0;
            height: 2px;
            background-color: $color-text-muted !important;
            flex-grow: 1;
        }

        button {
            position: relative;
            font-family: $primary-font-stack;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 0.6em;
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
                height: 1.4em;

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
                left: 2em;
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

    @include bp-custom-min(400) {
        font-size: 1em;
    }

    @include bp-custom-min(600) {
        padding: 4.5em 2em 0;
    }

    @include bp-custom-min(750) {
        padding: 4.5em 4em 0;
    }

    @include bp-md-tablet {
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
