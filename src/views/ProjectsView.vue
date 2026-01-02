<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useRouteStore } from '@/stores/routeStore.js';
import { useProjectsAnimations } from '@/composables/animations/useProjectsAnimations.js';
import projectsData from '@/assets/data/projects.json';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';
import ReactionLogo from '@/components/SVGs/ProjectLogos/ReactionLogo.vue';
import AlgoVisualizerLogo from '@/components/SVGs/ProjectLogos/AlgoVisualizerLogo.vue';
import GameLobbyLogo from '@/components/SVGs/ProjectLogos/GameLobbyLogo.vue';
import GithubIcon from '@/components/SVGs/GithubIcon.vue';
import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';
import VideoIcon from '@/components/SVGs/VideoIcon.vue';
import BoxArrowIcon from '@/components/SVGs/BoxArrowIcon.vue';
import PlayIcon from '@/components/SVGs/PlayIcon.vue';
import CloseIcon from '@/components/SVGs/CloseIcon.vue';

const routeStore = useRouteStore();
const { pageEnter, pageExit, showSelectedProject, hideSelectedProject } = useProjectsAnimations();

const getURL = (img) => {
    return new URL(`../assets/images/${img}`, import.meta.url).href;
};

const projectLogos = {
    reaction: ReactionLogo,
    'game-lobby': GameLobbyLogo,
    'algo-visualizer': AlgoVisualizerLogo,
};

const externalIcons = {
    github: GithubIcon,
    demoVideo: VideoIcon,
    liveSite: BoxArrowIcon,
};

const activeProject = ref();
const scrollPosition = ref();
const autoplayVideo = ref(false);

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            pageExit();
        }
    },
);

onMounted(() => {
    pageEnter();

    const query = routeStore.currentRoute.query;
    const projectToOpen = projectsData.find((p) => p.slug === query.slug);

    if (query && projectToOpen) {
        openProject(projectToOpen, query.autoplay === 'true');
    }
});

async function openProject(project, autoplay = false) {
    autoplayVideo.value = autoplay;
    activeProject.value = project;

    scrollPosition.value = window.scrollY;
    document.body.classList.add('no-scroll');
    document.body.style.top = `-${scrollPosition.value}px`;

    await nextTick();
    showSelectedProject();
}

function closeProject() {
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition.value);

    hideSelectedProject({
        onComplete: () => {
            activeProject.value = null;
        },
    });
}
</script>

<template>
    <div class="projects-container">
        <div class="page-header">
            <h1>Projects</h1>
            <hr />
            <p>
                Here are a few projects I’ve built recently, including real-time full-stack systems and complex frontend
                visualizations.
            </p>
        </div>
        <div class="cards">
            <div
                v-for="project in projectsData"
                :key="project.title"
                class="project-card"
                role="button"
                tabindex="0"
                @click="openProject(project)"
                @keydown.enter="openProject(project)"
                @keydown.space.prevent="openProject(project)"
            >
                <div class="card-img-container">
                    <Button @click.stop="() => openProject(project, true)" :iconRight="PlayIcon" />
                    <img
                        :src="getURL(project.img)"
                        :alt="'Screenshot of ' + project.title"
                        loading="eager"
                        class="project-img"
                    />
                </div>
                <div class="card-body">
                    <div class="card-header">
                        <component :is="projectLogos[project.slug]" class="project-logo" />
                        <h2 :style="{ fontFamily: project.fontFamily }">{{ project.title }}</h2>
                        <div>
                            <CalendarIcon />
                            <p>{{ project.date }}</p>
                        </div>
                    </div>
                    <p class="card-description">{{ project.description.short }}</p>
                    <div class="card-tool-chips">
                        <ToolChip v-for="tool in project.stack" :key="tool" :tool="tool" class="chip" />
                    </div>
                    <div class="card-footer">
                        <div class="external-links external-links-card">
                            <a
                                v-for="(link, key) in project.externalLinks"
                                :key="link"
                                :href="key === 'demoVideo' ? null : link.href"
                                target="_blank"
                            >
                                <Button
                                    v-if="key === 'demoVideo'"
                                    @click.stop="() => openProject(project, true)"
                                    :text="link.text"
                                    :iconLeft="externalIcons[key]"
                                    preset="secondary"
                                />
                                <Button v-else :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                            </a>
                        </div>
                        <Button
                            class="see-more"
                            @click.stop="() => openProject(project, true)"
                            text="See More"
                            :iconRight="BoxArrowIcon"
                            preset="primary"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div
            v-if="activeProject"
            class="selected-container"
            role="dialog"
            aria-modal="true"
            :aria-label="activeProject.title"
            @keydown.esc="closeProject()"
        >
            <div class="selected-project">
                <div class="selected-header">
                    <div>
                        <CalendarIcon />
                        <p>{{ activeProject.dateRange }}</p>
                    </div>
                    <Button :onClick="() => closeProject()" preset="secondary" :iconRight="CloseIcon" />
                </div>
                <div class="selected-body">
                    <div class="selected-img-container">
                        <iframe
                            :src="`https://player.vimeo.com/video/${activeProject.video}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=${autoplayVideo ? '1' : '0'}&amp;muted=1`"
                            frameborder="0"
                            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                            referrerpolicy="strict-origin-when-cross-origin"
                            title="game-lobby-demo-vid"
                        ></iframe>
                    </div>
                    <div class="selected-info">
                        <div class="selected-info-header" :class="`info-header-${activeProject.slug}`">
                            <component :is="projectLogos[activeProject.slug]" class="project-logo" />
                            <h2 :style="{ fontFamily: activeProject.fontFamily }">{{ activeProject.title }}</h2>
                            <div class="external-links external-links-selected">
                                <template v-for="(link, key) in activeProject.externalLinks" :key="link">
                                    <a v-if="key !== 'demoVideo'" :href="link.href" target="_blank">
                                        <Button :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                                    </a>
                                </template>
                            </div>
                        </div>
                        <div class="selected-tool-chips" :class="`tool-chips-${activeProject.slug}`">
                            <ToolChip v-for="tool in activeProject.stack" :key="tool" :tool="tool" class="chip" />
                        </div>
                        <ul class="selected-description">
                            <li v-for="description in activeProject.description?.long" :key="description">
                                {{ description }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <div class="overlay" @click="closeProject()"></div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.projects-container {
    position: relative;
    flex-direction: column;
    flex-grow: 1;
    width: 100%;
    padding: $size-12 0 $size-4;
    font-size: 0.6em;
    color: $color-text-primary;
    @include flexCenterAll;

    @include bp-sm-phone {
        margin: 0 auto;
    }

    @include bp-md-tablet {
        max-width: 110em;
    }

    @include bp-lg-laptop {
        max-width: 126em;
    }

    h1,
    h2,
    p {
        margin: 0;
    }

    h1 {
        font-size: 6em;
    }

    h2 {
        @include theme-dark {
            color: $color-gray3;
        }

        @include theme-light {
            color: $color-primary-darker;
        }
    }

    hr {
        width: 100%;
        height: 1px;
        margin: $size-2 auto $size-6;
        border: 0;

        @include theme-dark {
            background-color: $color-gray6;
        }

        @include theme-light {
            background-color: $color-primary-darker;
        }
    }
}

.page-header {
    @include flexCenterAll;

    flex-direction: column;
    padding: 0 $size-4;
    margin: $size-16 0 $size-20;

    @include bp-lg-laptop {
        margin: $size-12 0 $size-20;
        font-size: 1.2em;
    }

    h1 {
        @include bp-xsm-phone {
            font-size: 6.5em;
        }
    }

    p {
        max-width: 37ch;
        font-size: 1.5em;
        color: $color-text-secondary;
        text-align: center;

        @include bp-sm-phone {
            max-width: 56ch;
            font-size: 1.6em;
        }
    }
}

.external-links {
    &-card {
        display: flex;
        gap: $size-4;
        font-size: 1.1em;

        a:nth-child(3) {
            &:deep(button) svg {
                stroke-width: 0 !important;

                @include theme-dark {
                    fill: lighten-color($color-text-muted, 15%) !important;
                }

                @include theme-light {
                    fill: darken-color($color-text-muted, 15%) !important;
                }
            }
        }
    }

    &-selected {
        display: flex;
        gap: $size-4;
        margin-left: auto;
        font-size: 1.1em;

        a:nth-child(2) {
            &:deep(button) svg {
                stroke-width: 0 !important;

                @include theme-dark {
                    fill: lighten-color($color-text-muted, 15%) !important;
                }

                @include theme-light {
                    fill: darken-color($color-text-muted, 15%) !important;
                }
            }
        }
    }

    a {
        &:deep(button) {
            @include bp-md-tablet {
                gap: $size-2;
            }

            span {
                display: none;

                @include bp-md-tablet {
                    display: block !important;
                }
            }

            svg {
                height: $size-6;
                fill: rgb(0 0 0 / 0%) !important;
                stroke-width: 2;
                transition: fill 0.3s ease-in-out;

                @include theme-dark {
                    stroke: lighten-color($color-text-muted, 15%);
                }

                @include theme-light {
                    stroke: darken-color($color-text-muted, 15%);
                }
            }
        }

        &:hover :deep(button) svg {
            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%) !important;
            }

            @include theme-light {
                fill: darken-color($color-text-muted, 15%) !important;
            }
        }
    }
}

.cards {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: $size-5;

    @include bp-xsm-phone {
        max-width: 53em;
    }

    @include bp-sm-phone {
        max-width: 110em;
    }

    @include bp-lg-laptop {
        max-width: 126em;
    }
}

.project-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: $size-8;
    cursor: pointer;

    &:last-child {
        .card-body .card-header {
            gap: $size-1;
        }
    }

    @include theme-dark {
        &:first-child {
            border-top: solid 1px $color-bg-secondary;
        }

        border-bottom: solid 1px $color-bg-secondary;
    }

    @include theme-light {
        &:first-child {
            border-top: solid 1px $color-text-muted;
        }

        border-bottom: solid 1px $color-text-muted;
    }

    @include interactive {
        border-radius: 12px;
        box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);
        transform: scale(1.01) !important;
        backdrop-filter: blur(2px);
        backdrop-filter: blur(2px);

        @include theme-dark {
            background: linear-gradient(90deg, #21252922, #21252900);

            .card-footer {
                :deep(.see-more) {
                    color: $color-bg-primary !important;
                    background: $color-text-primary;

                    .icon {
                        fill: $color-bg-primary;
                    }
                }
            }
        }

        @include theme-light {
            background: linear-gradient(90deg, #dee2e622, #dee2e600);

            .card-footer {
                :deep(.see-more) {
                    color: $color-bg-primary !important;
                    background: $color-primary-darker;

                    .icon {
                        fill: $color-bg-primary !important;
                    }
                }
            }
        }
    }

    @include bp-sm-phone {
        flex-direction: row;
        gap: $size-6;
        padding: $size-4 $size-8;
    }
}

.card-img-container {
    position: relative;
    @include flexCenterAll;

    :deep(button) {
        position: absolute;
        z-index: 1;
        background: transparent;
        border: none;

        @include interactive {
            transform: scale(1.1);
        }

        &:active {
            transform: scale(0.9);
        }

        svg {
            height: $size-12;
            fill: $color-gray3;
        }
    }
}

.project-img {
    position: relative;
    z-index: 0;
    width: 107%;
    filter: blur(2px);

    @include bp-sm-phone {
        width: auto;
        height: 16em;
    }

    @include bp-md-tablet {
        height: 19em;
    }
}

.card-body {
    display: flex;
    flex-direction: column;
    gap: $size-2;
    width: 100%;
}

.card-header {
    display: flex;
    gap: $size-3;
    align-items: center;

    .project-logo {
        display: flex;
        align-items: center;
        height: 2.8em;

        @include theme-dark {
            fill: $color-gray3;
        }

        @include theme-light {
            fill: $color-primary-darker;
        }
    }

    h2 {
        margin: 0 !important;
        font-size: 2.1em;

        @include bp-xsm-phone {
            font-size: 2.5em !important;
        }

        @include bp-md-tablet {
            font-size: 2.9em !important;
        }
    }

    div {
        display: flex;
        gap: $size-2;
        align-items: center;
        margin-left: auto;
        font-size: 1.4em;

        @include bp-sm-phone {
            margin-bottom: 1em;
        }

        @include bp-md-tablet {
            margin-bottom: 1.5em;
        }

        @include bp-lg-laptop {
            margin-bottom: 2em;
        }

        svg {
            height: 1.1em;
            stroke: $color-text-secondary;
        }
    }
}

.card-description {
    max-width: 66ch;
    font-size: 1.35em;

    @include bp-xsm-phone {
        font-size: 1.6em;
    }

    @include bp-sm-phone {
        font-size: 1.45em !important;
    }

    @include bp-md-tablet {
        font-size: 1.6em !important;
    }
}

.card-tool-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $size-6;
    align-items: center;
    max-width: 65em;
    height: $size-8;
    margin-top: $size-2;
    overflow: hidden;
    font-size: 1.1em;

    @include bp-md-tablet {
        font-size: 1.2em;
    }

    .chip {
        flex: 1;
        font-size: 1.2em;
    }
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: $size-4;
    font-size: 1.3em;
}

.see-more {
    gap: 0.6em;
    border-width: 1px;
    border-radius: 7px;

    @include bp-lg-laptop {
        font-size: 1.1em;
    }
}

.overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 100vw;
    height: 100vh;
}

.selected-container {
    position: fixed;
    top: 0;
    z-index: 2;
    width: 100vw;
    height: 100vh;
    backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    @include flexCenterAll;

    @include theme-dark {
        background-color: rgb(0 0 0 / 40%);
    }
}

.selected-project {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    max-width: 61em;
    padding: $size-5 $size-8;
    margin: 0 $size-4 $size-12;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 20px;
    box-shadow: 0 8px 32px 0 rgb(0 0 0 / 37%);

    @include bp-custom-min(450) {
        padding: $size-8 $size-10;
    }

    @include bp-md-tablet {
        max-width: 72em;
        margin: $size-8 0;
    }

    @include theme-dark {
        background: linear-gradient(0deg, #212529ea 30%, #212529aa 60%, #212529ea 90%);
    }

    @include theme-light {
        background: linear-gradient(0deg, #dee2e6ea 40%, #dee2e6aa 60%, #dee2e6ea 90%);
    }
}

.selected-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 0.75em;

    div {
        display: flex;
        gap: $size-2;
        align-items: center;
        font-size: 1.45em;

        svg {
            height: 1.1em;
            stroke: $color-text-secondary;
        }
    }

    :deep(button) {
        gap: 0;
        padding: $size-3;
        font-size: 1.2em;
        border-radius: 100%;
        @include flexCenterAll;

        svg {
            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%);
            }

            @include theme-light {
                fill: darken-color($color-text-muted, 40%);
            }
        }

        @include interactive {
            @include theme-dark {
                background-color: #49505730;
            }

            @include theme-light {
                background-color: #49505710;
            }
        }

        &::after {
            display: none !important;
        }
    }
}

.selected-img-container {
    position: relative;
    @include flexCenterAll;

    margin: $size-2 0;

    @include bp-sm-phone {
        margin: 0;
    }

    iframe {
        width: 90%;
        max-width: 65em;
        aspect-ratio: 2/1.1;
        margin: $size-4 0 $size-8;
        border: 1px solid $color-bg-secondary;
        border-radius: 12px;
        box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);
    }
}

.selected-info {
    display: flex;
    flex-direction: column;
    margin-top: -$size-3;
}

.selected-info-header {
    display: flex;
    gap: $size-2;
    align-items: center;
    margin-top: $size-4;
    font-size: 1.35em;

    @include bp-xsm-phone {
        margin-top: 0;
    }

    &-algo-visualizer {
        gap: $size-1 !important;
    }

    .project-logo {
        display: flex;
        align-items: center;
        height: 2.2em;

        @include theme-dark {
            fill: $color-gray3;
        }

        @include theme-light {
            fill: $color-primary-darker;
        }
    }

    h2 {
        margin: 0 !important;
        font-size: 2em;

        @include bp-custom-min(450) {
            font-size: 2.2em;
        }

        @include bp-sm-phone {
            font-size: 2.4em !important;
        }
    }
}

.selected-tool-chips {
    @include flexCenterAll;

    flex-wrap: wrap;
    gap: $size-4;
    height: $size-10;
    margin-top: $size-3;
    overflow: hidden;
    font-size: 1.1em;

    .chip {
        flex: 1;
        height: 1.8em;
        font-size: 1.2em;
    }

    &-algo-visualizer {
        :deep(.chip-container) {
            max-width: none !important;
        }
    }
}

.selected-description {
    display: flex;
    flex-direction: column;
    gap: $size-2;
    padding: $size-3 $size-5 $size-2;
    margin: $size-2 0;
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;
    border-top: solid 1px $color-text-muted;
}
</style>
