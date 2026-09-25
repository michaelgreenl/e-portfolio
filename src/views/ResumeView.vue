<script setup>
import { ref, onMounted, watch } from 'vue';
import projectsData from '@/assets/data/projects.json';
import resumeData from '@/assets/data/resume.json';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { useGsap } from '@/composables/useGsap.js';
import { resumeAnimations } from '@/animations/page/resume.js';
import { useMediaQuery } from '@vueuse/core';
import Button from '@/components/Button.vue';
import SelectedProject from '@/components/Project/SelectedProject.vue';
import DownloadIcon from '@/components/SVGs/DownloadIcon.vue';
import DownloadThickIcon from '@/components/SVGs/DownloadThickIcon.vue';
import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';
import ChevronIcon from '@/components/SVGs/ChevronIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();
const activeInternshipProject = ref(null);
const showInternship = ref(false);
const internshipWindow = ref(null);

const { registerAnim } = useGsap();

const uniLocationWrapping = useMediaQuery('(min-width: 477px)');

const anims = {
    enterPage: registerAnim(resumeAnimations.enterPage),
    exitPage: registerAnim(resumeAnimations.exitPage),
};

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            internshipWindow.value?.close();
            anims.exitPage();
        }
    },
);

onMounted(() => {
    anims.enterPage();
});
</script>

<template>
    <div class="resume-container page" :class="{ 'window-open': showInternship }">
        <SelectedProject
            v-if="showInternship && activeInternshipProject"
            ref="internshipWindow"
            class="experience-project-window"
            :active-project="activeInternshipProject"
            fullscreen-on-mobile
            @close-project="showInternship = false"
        />

        <div class="page-header">
            <div class="page-title">
                <span class="page-eyebrow">Michael L. Green</span>
                <h1>Resume</h1>
            </div>

            <a class="download-link" href="/files/Michael-L-Green-Resume.pdf" download="Michael-L-Green-Resume.pdf">
                <Button
                    text="Download PDF"
                    :iconRight="themeStore.theme === 'light' ? DownloadThickIcon : DownloadIcon"
                    preset="primary"
                />
            </a>
        </div>

        <div class="resume-body">
            <div class="section">
                <h2 class="section-header">Experience</h2>

                <div class="section-content">
                    <div v-for="(experience, key) in resumeData.experience" :key="key" class="section-segment">
                        <div class="segment-header">
                            <h3 class="segment-title">{{ experience.title }}</h3>

                            <div class="segment-dates">
                                <CalendarIcon />
                                <h3>{{ experience.dates }}</h3>
                            </div>
                        </div>

                        <div class="segment-details">
                            <h3>
                                {{ experience.company }}<span>, {{ experience.location }}</span>
                            </h3>
                        </div>

                        <ul v-if="experience.info" class="segment-info">
                            <li v-for="info in experience.info" :key="info">
                                {{ info }}
                            </li>
                        </ul>

                        <div v-if="key === '24g'" class="segment-footer">
                            <h4 class="experience-projects-heading">Featured Work</h4>
                        </div>

                        <div v-if="experience.projects" class="experience-projects">
                            <div v-for="project in experience.projects" :key="project.title" class="section-segment">
                                <div class="segment-header segment-header-projects">
                                    <h4 class="segment-title segment-title-projects">
                                        <button
                                            class="project-link"
                                            type="button"
                                            aria-haspopup="dialog"
                                            @click="
                                                activeInternshipProject = project;
                                                showInternship = true;
                                            "
                                        >
                                            <span>{{ project.title }}</span>
                                            <ChevronIcon aria-hidden="true" />
                                        </button>
                                    </h4>

                                    <div class="segment-dates">
                                        <CalendarIcon />
                                        <h3>{{ project.longDate }}</h3>
                                    </div>
                                </div>

                                <ul class="segment-info">
                                    <li>{{ project.description.short }}</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-header">Education</h2>

                <div class="section-content">
                    <div v-for="education in resumeData.education" :key="education.title" class="section-segment">
                        <div class="segment-header">
                            <h3 class="segment-title">
                                {{ education.title }}
                                <span v-if="education.location">
                                    <span v-if="uniLocationWrapping">,</span> {{ education.location }}</span
                                >
                            </h3>

                            <div class="segment-dates">
                                <CalendarIcon />
                                <h3>{{ education.dates }}</h3>
                            </div>
                        </div>

                        <div v-if="education.major" class="segment-details">
                            <h3>{{ education.major }}</h3>
                            <h3>{{ education.minor }}</h3>
                        </div>

                        <ul v-if="education.info" class="segment-info">
                            <li v-for="info in education.info" :key="info">
                                {{ info }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-header">Technical Skills</h2>

                <div class="section-content">
                    <div class="section-segment section-segment-skills">
                        <p v-for="skills in resumeData.skills" :key="skills.category">
                            <span class="skill-category">{{ skills.category }}:</span>&nbsp;
                            <span v-for="(skill, i) in skills.list" :key="skill" class="skill-name"
                                >{{ skill }}{{ i < skills.list.length - 1 ? ', ' : '' }}</span
                            >
                        </p>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2 class="section-header">Projects</h2>

                <div class="section-content">
                    <div v-for="project in projectsData" :key="project.title" class="section-segment">
                        <div class="segment-header segment-header-projects">
                            <h3 class="segment-title segment-title-projects">
                                <a :href="project.externalLinks.porfolioLink.href" class="project-link">
                                    {{ project.title }}
                                </a>
                            </h3>

                            <div class="segment-dates">
                                <CalendarIcon />
                                <h3>{{ project.longDate }}</h3>
                            </div>
                        </div>
                        <div class="segment-details">
                            <h3>
                                Stack
                                <span> - </span>
                                <span v-for="(tool, i) in project.stackText" :key="tool"
                                    >{{ tool }}<span v-if="i !== project.stack.length - 1">, </span>
                                </span>
                            </h3>
                        </div>

                        <ul class="segment-info">
                            <li>
                                {{ project.description.short }}
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.experience-project-window {
    font-size: 0.75em;

    @include bp-md-tablet {
        font-size: 0.66em;
    }
}

.resume-container {
    --resume-light-ink: #2f3940;
    --resume-light-heading: #2f4858;
    --resume-light-accent: #315f72;
    --resume-light-muted: #52646e;

    position: relative;
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 33em;
    padding: $space-4;
    margin: 0 auto;
    font-size: 0.9em;
    color: $color-text-primary;

    &.window-open {
        @include bp-custom-max(847) {
            z-index: 10;
        }
    }

    @include theme-light {
        color: var(--resume-light-ink);
    }

    @include bp-custom-min(730) {
        max-width: 48em;
    }

    @include bp-xl-desktop {
        max-width: 58em;
    }

    @include bp-xsm-phone {
        font-size: 0.9em;
        font-size: clamp(0.9em, 3.3vw, 1em);
    }

    @include bp-sm-phone {
        font-size: 1em;
    }
}

h1,
h2 {
    white-space: nowrap;
}

h3 {
    text-wrap: pretty;
}

h1 {
    margin: 0;
    font-size: clamp(2.4em, 13vw, 3.4em);
    line-height: 0.95;
    letter-spacing: 0;

    @include theme-light {
        color: var(--resume-light-heading);
    }
}

h2,
h3,
h4,
p {
    margin: 0;
}

h2 {
    font-family: $primary-font-stack;
    font-size: clamp(1.6em, 8vw, 2em);
    line-height: 1.15;

    @include theme-light {
        color: var(--resume-light-accent);
    }
}

h3,
h4,
p span {
    font-family: $ternary-font-stack;
}

h3 span {
    font-size: 0.9em;
    font-weight: 400;
    color: $color-text-secondary;

    @include theme-light {
        color: var(--resume-light-muted);
    }
}

p {
    margin: $space-1 0;

    @include theme-light {
        color: var(--resume-light-muted);
    }

    span {
        font-size: 1.15em;
        font-weight: 600;
    }
}

ul {
    padding: 0 $space-5;
    margin: $space-1 0;
}

li {
    font-family: $secondary-font-stack;
    line-height: 1.45;
    color: $color-text-secondary;

    @include theme-light {
        color: #45545c;
    }
}

.page-header {
    display: flex;
    flex-wrap: wrap;
    gap: $space-4;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: $space-3 0 $space-5;
    margin-bottom: $space-1;

    @include bp-xsm-phone {
        gap: $space-3;
        padding-bottom: $space-4;
    }
}

.page-title {
    display: flex;
    flex-direction: column;
    gap: $space-1;
    min-width: 0;
}

.page-eyebrow {
    padding-left: 2px;
    font-family: $primary-font-stack;
    font-size: 0.78em;
    font-weight: 600;
    line-height: 1;
    color: $color-text-secondary;
    text-transform: uppercase;
    letter-spacing: 1px;

    @include theme-light {
        color: var(--resume-light-muted);
    }
}

.download-link {
    margin-left: auto;
    font-size: 0.88em;

    @include bp-xsm-phone {
        font-size: 0.95em;
    }

    :deep(button.primary) {
        gap: $space-2 !important;
        min-height: 2.75em;
        border-radius: $radius-md;

        span {
            display: none;

            @include bp-sm-phone {
                display: inline-block;
            }
        }

        svg {
            height: 1.2em;
        }
    }
}

.resume-body {
    display: flex;
    flex-direction: column;
    gap: $space-6;
    width: 100%;
}

.section {
    display: flex;
    flex-direction: column;
    gap: $space-2;
    width: 100%;
}

.section-content {
    width: 100%;
    padding: $space-4 $space-5;
    border: solid 1px transparent;
    border-radius: $radius-md;
    backdrop-filter: blur(2px);
    transition:
        background-color 0.15s ease-in-out,
        border-color 0.15s ease-in-out,
        box-shadow 0.15s ease-in-out;

    @include theme-dark {
        background: linear-gradient(90deg, #21252930, #21252908);
        border-color: #adb5bd2a;
        box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 4%),
            0 8px 16px 0 rgb(0 0 0 / 26%);
    }

    @include theme-light {
        background: linear-gradient(90deg, #dee2e642, #dee2e610);
        border-color: #cdd0d370;
        box-shadow:
            inset 0 1px 0 rgb(255 255 255 / 45%),
            0 8px 16px 0 rgb(61 80 92 / 10%);
    }
}

.section-header {
    padding-left: $space-1;
    font-weight: 600;
    letter-spacing: 1px;

    @include theme-light {
        color: $color-primary;
    }
}

.section-segment,
.segment-details {
    display: flex;
    flex-direction: column;
    gap: $space-1;
}

.section-segment {
    padding: $space-1 0 0;

    & + & {
        padding-top: $space-3;
        margin-top: $space-2;
        border-top: solid 1px transparent;

        @include theme-dark {
            border-color: #adb5bd22;
        }

        @include theme-light {
            border-color: #3d505c22;
        }
    }

    &-skills {
        gap: $space-1;

        p {
            line-height: 2ch;

            // `text-wrap: pretty;` doesn't work on mobile browsers,
            // it seems to replace it with `text-wrap: balanced;` and looks off putting
            text-wrap: auto;

            @include bp-sm-phone {
                text-wrap: pretty;
            }
        }

        .skill-category,
        .skill-name {
            font-weight: 400;
        }

        .skill-category {
            font-weight: 600;
        }
    }
}

.segment-header {
    display: flex;
    flex-wrap: wrap-reverse;
    column-gap: $space-2;
    justify-content: space-between;

    &:not(.segment-header-projects) {
        row-gap: $space-2;
    }
}

.segment-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-right: $space-5;
    font-size: 1.3em;
    font-weight: 600;
    line-height: 1.25;

    &-projects {
        .project-link {
            padding: 0;
            font: inherit;
            font-size: 1.1em;
            color: inherit;
            text-align: left;
            background: transparent;
            border: 0;

            &:focus-visible {
                outline: 2px solid $color-primary;
                outline-offset: 3px;
            }

            @include interactive {
                text-decoration: underline;
            }
        }
    }
}

.segment-dates {
    display: flex;
    gap: $space-2;
    align-items: center;
    margin-left: auto;
    font-size: 0.9em;
    color: $color-text-secondary;

    @include theme-light {
        color: var(--resume-light-muted);
    }

    :deep(svg) {
        height: 1em;
        margin-bottom: $space-1;
        stroke: $color-text-primary;
        will-change: opacity;

        @include theme-light {
            stroke: var(--resume-light-accent);
        }
    }
}

.experience-projects {
    margin: 0.25rem 0 0;
    border-top: solid 1px transparent;

    @include theme-dark {
        border-color: #adb5bd22;
    }

    @include theme-light {
        border-color: #3d505c22;
    }

    > .section-segment {
        gap: 0;
        padding: 1rem 0.5rem 0;
    }

    .segment-header-projects {
        row-gap: $space-1;
    }

    .segment-title {
        min-width: 0;
        margin-right: 0;
        line-height: 1;
    }

    .project-link {
        display: inline-flex;
        gap: 0.2em;
        align-items: center;
        transition: color 0.15s ease;

        @include interactive {
            color: $color-primary-light;
            text-decoration: none;

            @include theme-light {
                color: var(--resume-light-accent);
            }
        }

        :deep(svg) {
            flex-shrink: 0;
            width: 0.4em;
            height: 0.4em;
            overflow: visible;
            fill: currentcolor;
            stroke: currentcolor;
            stroke-width: 24;
        }
    }
}

.segment-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: $space-2;
}

.experience-projects-heading {
    align-self: flex-end;
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.25;
    color: $color-primary-light;

    @include theme-light {
        color: var(--resume-light-heading);
    }
}

.segment-info {
    padding-right: $space-2;
    padding-left: $space-5;
}
</style>
