<script setup>
import { ref, onMounted, watch, nextTick } from 'vue';
import { useGsap } from '@/composables/useGsap.js';
import { useRouteStore } from '@/stores/routeStore.js';
import { projectAnimations } from '@/animations/page/projects.js';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';
import projectsData from '@/assets/data/projects.json';
import SelectedProject from '@/components/Project/SelectedProject.vue';
import ProjectCard from '@/components/Project/ProjectCard.vue';

import ReactionLogo from '@/components/SVGs/ProjectLogos/ReactionLogo.vue';
import AlgoVisualizerLogo from '@/components/SVGs/ProjectLogos/AlgoVisualizerLogo.vue';
import GameLobbyLogo from '@/components/SVGs/ProjectLogos/GameLobbyLogo.vue';
import TallyLogo from '@/components/SVGs/ProjectLogos/TallyLogo.vue';
import GmailFilterLogo from '@/components/SVGs/ProjectLogos/GmailFilterLogo.vue';

import GithubIcon from '@/components/SVGs/GithubIcon.vue';
import VideoIcon from '@/components/SVGs/VideoIcon.vue';
import BoxArrowIcon from '@/components/SVGs/BoxArrowIcon.vue';
import NPMIcon from '@/components/SVGs/NPMIcon.vue';

const routeStore = useRouteStore();
const { headerReveal, headerDismiss } = useUtilAnimations();

const { registerAnim } = useGsap();

const anims = {
    showSelectedProject: registerAnim(projectAnimations.showSelectedProject),
    hideSelectedProject: registerAnim(projectAnimations.hideSelectedProject),
};

const pageHeader = ref(null);
const selectedProject = ref(null);

const projectLogos = {
    reaction: ReactionLogo,
    'game-lobby': GameLobbyLogo,
    'algo-visualizer': AlgoVisualizerLogo,
    tally: TallyLogo,
};

const externalIcons = {
    github: GithubIcon,
    demoVideo: VideoIcon,
    liveSite: BoxArrowIcon,
    npm: NPMIcon,
};

const activeProject = ref();
const scrollPosition = ref();
const autoplayVideo = ref(false);

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            if (activeProject.value) {
                closeProject();
            }

            headerDismiss({ headerEl: pageHeader.value, extraTargets: ['.project-card'] });
        }
    },
);

onMounted(() => {
    headerReveal({ headerEl: pageHeader.value, extraTargets: ['.project-card'] });

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
    selectedProject.value.el.focus();
    anims.showSelectedProject({ targets: [selectedProject.value.el, selectedProject.value.overlay] });
}

function closeProject() {
    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition.value);

    anims.hideSelectedProject({
        targets: [selectedProject.value.el, selectedProject.value.overlay],
        onComplete: () => {
            selectedProject.value.el.blur();
            activeProject.value = null;
        },
    });
}
</script>

<template>
    <div class="projects-container">
        <SelectedProject
            v-if="activeProject"
            ref="selectedProject"
            :active-project="activeProject"
            :autoplay-video="autoplayVideo"
            :project-logos="projectLogos"
            :external-icons="externalIcons"
            @close-project="closeProject()"
        />

        <div ref="pageHeader" class="page-header">
            <h1>Projects</h1>
            <hr />
            <p>
                Recent projects spanning cross-platform mobile development, real-time full-stack systems, advanced
                frontend visualizations, and intelligent agentic applications.
            </p>
        </div>

        <div class="cards">
            <ProjectCard
                v-for="project in projectsData"
                :key="project.title"
                :project="project"
                :project-logos="projectLogos"
                :external-icons="externalIcons"
                @open-project="openProject"
                @close-selected="closeProject"
            />
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
        display: flex;
        align-items: center;
        gap: 6px;

        @include theme-dark {
            color: $color-gray3;
        }

        @include theme-light {
            color: $color-primary-darker;
        }

        span {
            font-family: $secondary-font-stack;
            font-size: 0.3em;
            color: $color-text-secondary;
            transform: translateY(2px);
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
    margin: $size-12 0 $size-20;

    h1 {
        @include bp-lg-laptop {
            font-size: 6.2em;
        }
    }

    p {
        max-width: 51ch;
        color: $color-text-secondary;
        text-align: center;
        font-size: 1.6em;
    }
}

.cards {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    padding: $size-5;

    @include bp-xsm-phone {
        max-width: 58em;
    }

    @include bp-sm-phone {
        max-width: 110em;
    }

    @include bp-md-tablet {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: $size-6;
        align-items: stretch;
        width: 100%;
        max-width: 92em;
        margin-inline: auto;

        :deep(.project-card) {
            @include theme-dark {
                border: solid 1px $color-bg-secondary;
            }

            @include theme-light {
                border: solid 1px $color-text-muted;
            }

            border-radius: 12px;
        }

        :deep(.project-card:nth-child(3)) {
            grid-column: 1 / span 2;
            grid-row: 2;
        }
    }

    @include bp-xl-desktop {
        max-width: 116em;
    }
}
</style>
