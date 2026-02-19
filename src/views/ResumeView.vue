<script setup>
import { onMounted, watch } from 'vue';
import projectsData from '@/assets/data/projects.json';
import resumeData from '@/assets/data/resume.json';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { useUtilAnimations } from '@/composables/useUtilAnimations.js';
import { TIMING } from '@/animations/constants/timing.js';
import Button from '@/components/Button.vue';
import DownloadIcon from '@/components/SVGs/DownloadIcon.vue';
import DownloadThickIcon from '@/components/SVGs/DownloadThickIcon.vue';
import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();
const { fadeIn, fadeOut } = useUtilAnimations();

onMounted(() => {
    fadeIn({ selector: '.resume-container', opts: { duration: TIMING.duration.slow } });
});

watch(
    () => routeStore.isLeaving,
    (newVal) => {
        if (newVal) {
            fadeOut({ selector: '.resume-container' });
        }
    },
);
</script>

<template>
    <div class="resume-container">
        <div class="page-header">
            <h1>Resume</h1>

            <a href="/files/Michael-L-Green-Resume.pdf" download="Michael-L-Green-Resume.pdf">
                <Button
                    text="Download PDF"
                    :iconRight="themeStore.theme === 'light' ? DownloadThickIcon : DownloadIcon"
                    preset="primary"
                />
            </a>
        </div>

        <div class="resume-body">
            <div class="section">
                <h2 class="section-header">Education</h2>
                <hr />

                <div v-for="education in resumeData.education" :key="education.title" class="section-segment">
                    <div class="segment-header">
                        <h3 class="segment-title">
                            {{ education.title }}<span v-if="education.location">, {{ education.location }}</span>
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
            <div class="section">
                <h2 class="section-header">Relevant Experience</h2>
                <hr />

                <div v-for="experience in resumeData.experience" :key="experience.title" class="section-segment">
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
                </div>
            </div>
            <div class="section">
                <h2 class="section-header">Projects</h2>
                <hr />

                <div v-for="project in projectsData" :key="project.title" class="section-segment">
                    <div class="segment-header">
                        <h3 class="segment-title segment-title-projects">
                            <a :href="project.externalLinks.porfolioLink.href" class="project-link">
                                {{ project.title }}
                            </a>
                            <span> - </span>

                            <span v-if="project.externalLinks.liveSite">
                                <a class="external-link" :href="project.externalLinks.liveSite.href" target="_blank">
                                    Live Site</a
                                >
                                |
                            </span>

                            <span>
                                <a class="external-link" :href="project.externalLinks.demoVideo.href"> Demo Video</a>
                                |
                            </span>

                            <span>
                                <a class="external-link" :href="project.externalLinks.github.href" target="_blank">
                                    Repository</a
                                >
                            </span>
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
            <div class="section">
                <h2 class="section-header">Technical Skills</h2>
                <hr />

                <div class="section-segment section-segment-skills">
                    <p v-for="skills in resumeData.skills" :key="skills.category">
                        <span>{{ skills.category }}:</span>&nbsp;
                        <span v-for="(skill, i) in skills.list" :key="skill"
                            >{{ skill }}{{ i < skills.list.length - 1 ? ', ' : '' }}</span
                        >
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.resume-container {
    position: relative;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: center;
    width: 100%;
    max-width: 32em;
    padding: $size-4;
    margin: 0 auto;
    font-size: 0.7em;
    color: $color-text-primary;

    @include bp-custom-min(730) {
        max-width: 48em;
    }

    @include bp-xl-desktop {
        max-width: 61em;
    }

    @include bp-xsm-phone {
        font-size: clamp(0.75em, 3.3vw, 1.05em);
    }
}

h1 {
    margin: $size-1 0;
    font-size: 3em;
}

h2,
h3,
h4,
p {
    margin: 0;
}

h2 {
    font-family: $primary-font-stack;
    font-size: 1.8em;
}

h3 {
    font-family: $ternary-font-stack;
}

h3 span {
    font-size: 0.9em;
    font-weight: 400;
    color: $color-text-secondary;
}

p {
    margin: $size-1 0;

    span {
        font-family: $ternary-font-stack;
        font-size: 1.15em;
        font-weight: 600;
    }
}

ul {
    padding: 0 $size-5;
    margin: $size-1 0;
}

li {
    font-family: $secondary-font-stack;
    color: $color-text-secondary;
}

hr {
    width: 100%;
    height: 1px;
    margin: $size-2 auto;
    border: 0;

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-gray5;
    }
}

.page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-right: $size-2;

    a {
        font-size: 0.9em;

        @include bp-xsm-phone {
            font-size: 1em;
        }
    }
}

.section-segment {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: $size-2;

    &-skills {
        padding-top: 0.1em !important;
        font-size: 0.94em;

        p span {
            font-weight: 400;

            &:first-child {
                font-weight: 600;
            }
        }
    }
}

.segment-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.segment-header {
    display: flex;
    flex-wrap: wrap-reverse;
    gap: 3px;
    justify-content: space-between;
}

.segment-title {
    font-size: 1.3em;
    font-weight: 600;

    &-projects {
        .project-link {
            color: $color-text-primary;

            @include interactive {
                text-decoration: underline;
            }
        }

        .external-link {
            color: $color-text-secondary;
            text-decoration: underline;

            @include interactive {
                color: $color-primary-darker;
            }
        }

        span {
            font-size: 0.8em;
        }
    }
}

.segment-dates {
    display: flex;
    gap: $size-2;
    align-items: center;
    margin-left: auto;
    font-size: 0.9em;

    :deep(svg) {
        height: 1em;
        margin-bottom: 4px;
        stroke: $color-text-primary;
        will-change: opacity;
    }
}

.segment-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}
</style>
