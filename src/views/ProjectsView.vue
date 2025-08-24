<script setup>
import { computed } from 'vue';
import { useRouteStore } from '../stores/routeStore.js';
import { useMotion } from '@vueuse/motion';
import projects from '../assets/data/projects.json';
import Button from '../components/Button.vue';
import ToolChip from '../components/ToolChip.vue';
import GithubIcon from '../components/SVGs/GithubIcon.vue';
import CalendarIcon from '../components/SVGs/CalendarIcon.vue';
import VideoIcon from '../components/SVGs/VideoIcon.vue';
import WebsiteIcon from '../components/SVGs/WebsiteIcon.vue';
import BoxArrowIcon from '../components/SVGs/BoxArrowIcon.vue';
import PlayIcon from '../components/SVGs/PlayIcon.vue';

const routeStore = useRouteStore();

const getURL = (img) => {
    return new URL(`../assets/images/${img}`, import.meta.url).href;
};

const activeProject = computed(() => {
    if (routeStore.currentRoute.base !== 'projects') return null;
    const id = routeStore.currentRoute.params.id;
    if (!id) return null;
    return projects.find((p) => p.slug === id) || null;
});

// tool chip options
// ['vue', 'sass', 'pinia', 'gsap', 'node', 'express', 'git', 'sequelize', 'mysql', 'postgres', 'prisma', 'socket'],
</script>

<template>
    <div class="projects-container">
        <div class="page-header" v-if="!activeProject">
            <h1
                v-motion
                :initial="{ opacity: 0 }"
                :enter="{ opacity: 1, transition: { duration: 100, easing: 'easeInOut' } }"
            >
                Projects
            </h1>
            <hr
                v-motion
                :initial="{ opacity: 0, scaleX: 0 }"
                :enter="{ opacity: 1, scaleX: 1, transition: { duration: 200, easing: 'easeInOut', delay: 50 } }"
            />
            <p
                v-motion
                :initial="{ opacity: 0 }"
                :enter="{ opacity: 1, transition: { duration: 100, easing: 'easeInOut', delay: 100 } }"
            >
                This is temporary text I am typing right now. I recently started to ponder about thinking through
                something about a thing
            </p>
        </div>
        <div v-if="!activeProject" class="cards">
            <div
                v-for="(project, i) in projects"
                :key="project.title"
                :class="`project-card-${i + 1}`"
                class="project-card"
                v-motion
                :initial="{ opacity: 0 }"
                :visibleOnce="{ opacity: 1, transition: { duration: 200, easing: 'easeInOut' } }"
            >
                <div class="img-container">
                    <PlayIcon />
                    <img :src="getURL(project.img)" alt="project image" class="project-img" />
                </div>
                <div class="card-body">
                    <div class="card-header">
                        <h2>{{ project.title }}</h2>
                        <div>
                            <CalendarIcon />
                            <p>{{ project.date }}</p>
                        </div>
                    </div>
                    <p class="description">{{ project.description.short }}</p>
                    <div class="tool-chips">
                        <ToolChip v-for="tool in project.stack" :key="tool" :tool="tool" class="chip" />
                    </div>
                    <div class="card-footer">
                        <div class="external-links">
                            <a v-for="(link, key) in project.externalLinks" :key="link" :href="link.href">
                                <Button
                                    v-if="key === 'github'"
                                    :text="link.text"
                                    :iconLeft="GithubIcon"
                                    preset="secondary"
                                />
                                <Button
                                    v-if="key === 'demoVideo'"
                                    :text="link.text"
                                    :iconLeft="VideoIcon"
                                    preset="secondary"
                                />
                                <Button
                                    v-if="key === 'liveSite'"
                                    :text="link.text"
                                    :iconLeft="BoxArrowIcon"
                                    preset="secondary"
                                />
                            </a>
                        </div>
                        <Button
                            class="see-more"
                            :onClick="
                                () => {
                                    routeStore.toRoute(`projects/${project.slug}`);
                                }
                            "
                            text="See More"
                            :iconRight="BoxArrowIcon"
                            preset="primary"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div v-else class="project-view">
            <button @click="routeStore.toRoute('projects')">Close</button>
            <h2>{{ activeProject.title }}</h2>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.projects-container {
    position: relative;
    font-size: 0.6em;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    width: 100%;
    padding: 4em 0 1em;
    color: $color-text-primary;

    h1,
    h2,
    p {
        margin: 0;
    }

    h1 {
        font-size: 6em;
    }

    hr {
        border: 0;
        width: 100%;
        margin: $size-2 auto $size-6;
        height: 1px;

        @include theme-dark {
            background-color: lighten-color($color-bg-primary, 5%);
        }

        @include theme-light {
            background-color: darken-color($color-bg-primary, 5%);
        }
    }

    .page-header {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0 1em;
        margin: 6em 0 8em;

        // a {
        //     position: absolute;
        //     top: 2em;
        //     right: 2em;
        //     svg {
        //         height: 2.5em;
        //         fill: $color-text-muted;
        //     }
        // }

        p {
            max-width: 37ch;
            font-size: 1.5em;
            text-align: center;
        }
    }

    .cards {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        padding: $size-5;

        .project-card {
            cursor: pointer;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            padding: $size-8;

            @include theme-dark {
                border-top: solid 1px lighten-color($color-bg-primary, 2.5%);
                border-bottom: solid 1px lighten-color($color-bg-primary, 2.5%);
            }

            @include theme-light {
                border-top: solid 1px darken-color($color-bg-primary, 2.5%);
                border-bottom: solid 1px darken-color($color-bg-primary, 2.5%);
            }

            @include interactive {
                transform: scale(1.01) !important;

                @include theme-dark {
                    background: lighten-color($color-bg-primary, 2.5%);
                }

                @include theme-light {
                    background: darken-color($color-bg-primary, 2%);
                }
            }

            .img-container {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;

                svg {
                    cursor: pointer;
                    position: absolute;
                    z-index: 1;
                    height: $size-13;
                    fill: $color-gray3;

                    @include interactive {
                        transform: scale(1.1);
                    }

                    &:active {
                        transform: scale(0.9);
                    }
                }

                .project-img {
                    position: relative;
                    z-index: 0;
                    width: 107%;
                    filter: blur(2px);
                }
            }

            .card-body {
                display: flex;
                flex-direction: column;
                gap: $size-2;
                width: 100%;

                .description {
                    font-size: 1.35em;
                    max-width: 48ch;
                }

                .card-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    h2 {
                        font-size: 2em;
                        margin: 0 !important;
                    }

                    div {
                        display: flex;
                        align-items: center;
                        gap: $size-2;
                        font-size: 1.4em;

                        svg {
                            height: 1.1em;
                            stroke: $color-text-secondary;
                        }
                    }
                }

                .tool-chips {
                    font-size: 1.1em;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    overflow: hidden;
                    gap: $size-6;
                    height: $size-8;
                    margin-top: $size-2;

                    .chip {
                        font-size: 1.2em;
                    }
                }

                .card-footer {
                    font-size: 1.3em;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 1em;

                    .external-links {
                        font-size: 1.1em;
                        display: flex;
                        gap: $size-4;

                        a {
                            &::v-deep button {
                                span {
                                    display: none;
                                }

                                svg {
                                    height: $size-6;
                                    stroke-width: 2;
                                    transition: fill 0.3s ease-in-out;
                                    fill: rgba(0, 0, 0, 0);

                                    @include theme-dark {
                                        stroke: lighten-color($color-text-muted, 15%);
                                    }

                                    @include theme-light {
                                        stroke: darken-color($color-text-muted, 15%);
                                    }
                                }
                            }

                            &:nth-child(3) {
                                &::v-deep button svg {
                                    stroke-width: 0 !important;

                                    @include theme-dark {
                                        fill: lighten-color($color-text-muted, 15%);
                                    }

                                    @include theme-light {
                                        fill: darken-color($color-text-muted, 15%);
                                    }
                                }
                            }

                            &:hover ::v-deep button svg {
                                @include theme-dark {
                                    fill: lighten-color($color-text-muted, 15%);
                                }

                                @include theme-light {
                                    fill: darken-color($color-text-muted, 15%);
                                }
                            }
                        }
                    }

                    .see-more {
                        border-width: 1px;
                        border-radius: 7px;
                        gap: 0.6em;
                    }
                }
            }
        }
    }

    @include bp-xsm-phone {
        .cards {
            max-width: 42em;

            .project-card {
                .card-body {
                    .card-header {
                        h2 {
                            font-size: 2.5em !important;
                        }
                    }
                }
            }
        }
    }

    @include bp-sm-phone {
        margin: 0 auto;

        .page-header {
            margin: 8em 0 12em;
        }

        .cards {
            max-width: 110em;

            .project-card {
                gap: $size-6;
                padding: 1em 2em;
                flex-direction: row;

                .img-container {
                    .project-img {
                        height: 16em;
                        width: auto;
                    }
                }

                .card-body {
                    .description {
                        font-size: 1.45em !important;
                    }
                }
            }
        }
    }

    @include bp-md-tablet {
        max-width: 110em;

        .cards .project-card {
            .img-container {
                .project-img {
                    height: 19em;
                }
            }

            .card-body {
                .card-header {
                    h2 {
                        font-size: 2.9em !important;
                    }
                }

                .description {
                    font-size: 1.6em !important;
                }

                .tool-chips {
                    font-size: 1.2em;
                }
            }

            .card-footer .external-links a ::v-deep button {
                gap: $size-2;

                span {
                    display: block !important;
                }
            }
        }
    }

    @include bp-lg-laptop {
        max-width: 138em;

        .page-header {
            font-size: 1.2em;
            margin: 8em 0 12em;
        }

        .cards {
            max-width: 138em;

            .project-card .card-body {
                // gap: 0.8em;

                p {
                    // font-size: 1.25em;
                }

                .card-footer {
                    .external-links a ::v-deep button {
                        // font-size: 1.2em;
                        gap: $size-2;

                        span {
                            display: block !important;
                        }
                    }

                    .see-more {
                        font-size: 1.1em;
                    }
                }
            }
        }
    }
}
</style>
