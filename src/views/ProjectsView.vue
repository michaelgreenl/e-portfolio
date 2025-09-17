<script setup>
import { computed, ref, watch } from 'vue';
import { useRouteStore } from '../stores/routeStore.js';
import { useMotions, useMotion } from '@vueuse/motion';
import { Motions } from '../utils/motions.js';
import projectsData from '../assets/data/projects.json';
import Button from '../components/Button.vue';
import ToolChip from '../components/ToolChip.vue';
import ReactionLogo from '../components/SVGs/ProjectLogos/ReactionLogo.vue';
import AlgoVisualizerLogo from '../components/SVGs/ProjectLogos/AlgoVisualizerLogo.vue';
import GameLobbyLogo from '../components/SVGs/ProjectLogos/GameLobbyLogo.vue';
import GithubIcon from '../components/SVGs/GithubIcon.vue';
import CalendarIcon from '../components/SVGs/CalendarIcon.vue';
import VideoIcon from '../components/SVGs/VideoIcon.vue';
import BoxArrowIcon from '../components/SVGs/BoxArrowIcon.vue';
import PlayIcon from '../components/SVGs/PlayIcon.vue';
import CloseIcon from '../components/SVGs/CloseIcon.vue';

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

const header = ref(null);
const headerLine = ref(null);
const headerText = ref(null);
const projectItems = ref([]);
const selectedProject = ref(null);

const headerMotion = useMotion(header, Motions.directives['fade-in']);
const headerLineMotion = useMotion(headerLine, Motions.directives['fade-in-scalex']);
const headerTextMotion = useMotion(headerText, Motions.directives['fade-in']);
const projectItemMotions = ref([]);
const selectedProjectMotion = useMotion(selectedProject, Motions.directives['fade-in-leave']);

const routeStore = useRouteStore();
watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            // The fix was janky but adding a different motion from the directive ("...-leave") works
            projectItemMotions.value = projectItems.value.map((el) => {
                if (!el) return null;
                return useMotion(el, Motions.directives['fade-in-leave']);
            });

            headerMotion.set('leave');
            headerLineMotion.set('leave');
            headerTextMotion.set('leave');

            projectItemMotions.value.forEach((motion, i) => {
                setTimeout(() => {
                    motion.set('leave');
                }, 100 * i);
            });
        }
    },
);

const autoplayVideo = ref(false);

function openProject(project, autoplay = false) {
    autoplayVideo.value = autoplay;
    activeProject.value = project;

    scrollPosition.value = window.scrollY;
    document.body.classList.add('no-scroll');
    document.body.style.top = `-${scrollPosition.value}px`;
}

function closeProject() {
    selectedProjectMotion.set('leave');
    setTimeout(() => {
        activeProject.value = null;

        document.body.classList.remove('no-scroll');
        document.body.style.top = '';
        window.scrollTo(0, scrollPosition.value);
    }, 100);
}
</script>

<template>
    <div class="projects-container">
        <div class="page-header">
            <h1 ref="header" v-motion-fade-in>Projects</h1>
            <hr ref="headerLine" v-motion-fade-in-scalex />
            <p ref="headerText" v-motion-fade-in :delay="100">
                This is temporary text I am typing right now. I recently started to ponder about thinking through
                something about a thing
            </p>
        </div>
        <div class="cards">
            <div
                v-for="(project, i) in projectsData"
                :key="project.title"
                @click="openProject(project)"
                class="project-card"
                :ref="
                    (el) => {
                        if (el) projectItems[i] = el;
                    }
                "
                v-motion-fade-in-once
                :delay="50"
            >
                <div class="img-container">
                    <!-- TODO: Make the play button start the video -->
                    <Button @click.stop="() => openProject(project, true)" :iconRight="PlayIcon" />
                    <img :src="getURL(project.img)" alt="project image" class="project-img" />
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
                    <p class="description">{{ project.description.short }}</p>
                    <div class="tool-chips">
                        <ToolChip v-for="tool in project.stack" :key="tool" :tool="tool" class="chip" />
                    </div>
                    <div class="card-footer">
                        <div class="external-links">
                            <a v-for="(link, key) in project.externalLinks" :key="link" :href="link.href">
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
                            @click.stop="() => openProject(project)"
                            text="See More"
                            :iconRight="BoxArrowIcon"
                            preset="primary"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div v-if="activeProject" ref="selectedProject" class="selected-container" v-motion-fade-in>
            <div class="selected-project">
                <div class="selected-header">
                    <div>
                        <CalendarIcon />
                        <p>{{ activeProject.dateRange }}</p>
                    </div>
                    <Button
                        :onClick="() => closeProject()"
                        preset="secondary"
                        :iconRight="CloseIcon"
                        class="close-button"
                    />
                </div>
                <div class="selected-body">
                    <div class="img-container">
                        <!-- :poster="getURL(activeProject.img)" -->
                        <video
                            ref="activeVideo"
                            class="project-video"
                            :src="activeProject.video"
                            controls
                            preload="metadata"
                            :autoplay="autoplayVideo"
                        />
                    </div>
                    <div class="selected-info">
                        <div class="info-header" :class="`info-header-${activeProject.slug}`">
                            <component :is="projectLogos[activeProject.slug]" class="project-logo" />
                            <h2 :style="{ fontFamily: activeProject.fontFamily }">{{ activeProject.title }}</h2>
                            <div class="external-links">
                                <a v-for="(link, key) in activeProject.externalLinks" :key="link" :href="link.href">
                                    <Button :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                                </a>
                            </div>
                        </div>
                        <div class="tool-chips" :class="`tool-chips-${activeProject.slug}`">
                            <ToolChip v-for="tool in activeProject.stack" :key="tool" :tool="tool" class="chip" />
                        </div>
                        <ul class="description">
                            <li v-for="description in activeProject.description.long" :key="description">
                                {{ description }}
                            </li>
                        </ul>
                        <div class="info-footer"></div>
                    </div>
                </div>
            </div>
            <div @click="closeProject()" class="overlay" v-motion-fade-in></div>
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
    padding: $size-12 0 $size-4;
    color: $color-text-primary;

    h1,
    h2,
    p {
        margin: 0;
    }

    h1 {
        font-size: 6em;
    }

    @include theme-dark {
        h2 {
            color: $color-gray3;
        }
    }

    @include theme-light {
        h2 {
            color: $color-primary-darker;
        }
    }

    hr {
        border: 0;
        width: 100%;
        margin: $size-2 auto $size-6;
        height: 1px;

        @include theme-dark {
            background-color: $color-gray6;
        }

        @include theme-light {
            background-color: $color-primary-darker;
        }
    }

    .page-header {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 0 $size-4;
        margin: $size-16 0 $size-20;

        p {
            max-width: 37ch;
            font-size: 1.5em;
            text-align: center;
            color: $color-text-secondary;
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

            @media (hover: hover) and (pointer: fine) {
                &:hover {
                    transform: scale(1.01) !important;
                    border-radius: 12px;
                    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.37);
                    backdrop-filter: blur(2px);
                    -webkit-backdrop-filter: blur(2px);

                    @include theme-dark {
                        background: linear-gradient(90deg, #21252922, #21252900);

                        .card-footer {
                            :deep(.see-more) {
                                background: $color-text-primary;
                                color: $color-bg-primary !important;

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
                                background: $color-primary-darker;
                                color: $color-bg-primary !important;

                                .icon {
                                    fill: $color-bg-primary !important;
                                }
                            }
                        }
                    }
                }
            }

            .img-container {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;

                :deep(button) {
                    cursor: pointer;
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
                    max-width: 63ch;
                }

                .card-header {
                    display: flex;
                    align-items: center;
                    gap: $size-3;

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
                        font-size: 2.1em;
                        margin: 0 !important;
                    }

                    div {
                        display: flex;
                        align-items: center;
                        gap: $size-2;
                        font-size: 1.4em;
                        margin-left: auto;

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
                    max-width: 65em;

                    .chip {
                        font-size: 1.2em;
                        flex: 1;
                    }
                }

                .card-footer {
                    font-size: 1.3em;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: $size-4;

                    .external-links {
                        font-size: 1.1em;
                        display: flex;
                        gap: $size-4;

                        a {
                            &:deep(button) {
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
                                &:deep(button) svg {
                                    stroke-width: 0 !important;

                                    @include theme-dark {
                                        fill: lighten-color($color-text-muted, 15%);
                                    }

                                    @include theme-light {
                                        fill: darken-color($color-text-muted, 15%);
                                    }
                                }
                            }

                            &:hover :deep(button) svg {
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

    .overlay {
        position: fixed;
        z-index: 1;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        height: 100vh;
        width: 100vw;
    }

    .selected-container {
        position: fixed;
        z-index: 2;
        top: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        width: 100vw;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);

        @include theme-dark {
            background-color: rgba(0, 0, 0, 0.4);
        }

        .selected-project {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            max-width: 61em;
            padding: $size-5 $size-8;
            margin: 0 $size-4 $size-12;
            border-radius: 20px;
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

            @include theme-dark {
                background: linear-gradient(0deg, #212529ea 30%, #212529aa 60%, #212529ea 90%);
            }

            @include theme-light {
                background: linear-gradient(0deg, #dee2e6ea 40%, #dee2e6aa 60%, #dee2e6ea 90%);
            }

            .selected-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-left: 0.75em;

                div {
                    display: flex;
                    align-items: center;
                    gap: $size-2;
                    font-size: 1.45em;

                    svg {
                        height: 1.1em;
                        stroke: $color-text-secondary;
                    }
                }

                :deep(.close-button) {
                    font-size: 1.2em;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0;
                    padding: $size-3;
                    border-radius: 100%;

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

            .img-container {
                position: relative;
                display: flex;
                justify-content: center;
                align-items: center;
                margin: $size-2 0;

                video {
                    width: 90%;
                    max-width: 65em;
                    margin: $size-6 0;
                    border-radius: 12px;
                    border: 1px solid $color-bg-secondary;
                    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.37);
                }
            }

            .selected-info {
                display: flex;
                flex-direction: column;
                margin-top: -$size-3;

                .info-header {
                    font-size: 1.35em;
                    display: flex;
                    align-items: center;
                    gap: $size-2;
                    margin-top: $size-4;

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
                        font-size: 2em;
                        margin: 0 !important;
                    }

                    .external-links {
                        margin-left: auto;
                        font-size: 1.1em;
                        display: flex;
                        gap: $size-4;

                        a {
                            &:deep(button) {
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
                                &:deep(button) svg {
                                    stroke-width: 0 !important;

                                    @include theme-dark {
                                        fill: lighten-color($color-text-muted, 15%);
                                    }

                                    @include theme-light {
                                        fill: darken-color($color-text-muted, 15%);
                                    }
                                }
                            }

                            &:hover :deep(button) svg {
                                @include theme-dark {
                                    fill: lighten-color($color-text-muted, 15%);
                                }

                                @include theme-light {
                                    fill: darken-color($color-text-muted, 15%);
                                }
                            }
                        }
                    }
                }

                .tool-chips {
                    font-size: 1.1em;
                    display: flex;
                    align-items: center;
                    flex-wrap: wrap;
                    overflow: hidden;
                    gap: $size-4;
                    height: $size-10;
                    margin-top: $size-3;

                    .chip {
                        font-size: 1.2em;
                        flex: 1;
                        height: 1.8em;
                    }

                    &-algo-visualizer {
                        :deep(.chip-container) {
                            max-width: none !important;
                        }
                    }
                }

                .description {
                    font-family: $secondary-font-stack;
                    font-size: 1.5em;
                    display: flex;
                    flex-direction: column;
                    gap: $size-2;
                    color: $color-text-secondary;
                    padding: $size-3 $size-5 $size-2;
                    margin: $size-2 0;
                    border-top: solid 1px $color-text-muted;
                }

                .info-footer {
                    font-size: 1.3em;
                    display: flex;
                }
            }
        }
    }

    @include bp-xsm-phone {
        .page-header h1 {
            font-size: 7em;
        }

        .cards {
            max-width: 53em;

            .project-card .card-body {
                .card-header h2 {
                    font-size: 2.5em !important;
                }

                .description {
                    font-size: 1.6em;
                }
            }
        }

        .selected-container .selected-project .selected-info .info-header {
            margin-top: 0;
        }
    }

    @include bp-custom-min(450) {
        .selected-container .selected-project {
            padding: $size-8 $size-10;

            .selected-info .info-header h2 {
                font-size: 2.2em;
            }
        }
    }

    @include bp-sm-phone {
        margin: 0 auto;

        .page-header p {
            max-width: 56ch;
            font-size: 1.6em;
        }

        .cards {
            max-width: 110em;

            .project-card {
                gap: $size-6;
                padding: $size-4 $size-8;
                flex-direction: row;

                .img-container .project-img {
                    height: 16em;
                    width: auto;
                }

                .card-body {
                    .card-header div {
                        margin-bottom: 1em;
                    }

                    .description {
                        font-size: 1.45em !important;
                    }
                }
            }
        }

        .selected-container .selected-project .selected-info {
            .img-container {
                margin: 0;
            }

            .info-header h2 {
                font-size: 2.4em !important;
            }
        }
    }

    @include bp-md-tablet {
        max-width: 110em;

        .cards .project-card {
            .img-container .project-img {
                height: 19em;
            }

            .card-body {
                .card-header {
                    h2 {
                        font-size: 2.9em !important;
                    }

                    div {
                        margin-bottom: 1.5em;
                    }
                }

                .description {
                    font-size: 1.6em !important;
                }

                .tool-chips {
                    font-size: 1.2em;
                }
            }

            .card-footer .external-links a :deep(button) {
                gap: $size-2;

                span {
                    display: block !important;
                }
            }
        }

        .selected-container .selected-project {
            max-width: 72em;
            margin: $size-8 0;
        }
    }

    @include bp-lg-laptop {
        max-width: 126em;

        .page-header {
            font-size: 1.2em;
            margin: $size-12 0 $size-20;
        }

        .cards {
            max-width: 126em;

            .project-card .card-body {
                .card-header div {
                    margin-bottom: 2em;
                }

                .card-footer {
                    .external-links a :deep(button) {
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
