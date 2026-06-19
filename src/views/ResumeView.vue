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
            </div>

            <div class="section">
                <h2 class="section-header">Education</h2>

                <div class="section-content">
                    <div v-for="education in resumeData.education" :key="education.title" class="section-segment">
                        <div class="segment-header">
                            <h3 class="segment-title">
                                {{ education.title }} <span v-if="education.location"> {{ education.location }}</span>
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
        </div>
    </div>
</template>

<style lang="scss" scoped>
.resume-container {
    --resume-light-ink: #2f3940;
    --resume-light-heading: #2f4858;
    --resume-light-accent: #315f72;
    --resume-light-muted: #52646e;

    position: relative;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    align-items: center;
    width: 100%;
    max-width: 32em;
    padding: $size-4;
    margin: 0 auto;
    font-size: 0.9em;
    color: $color-text-primary;

    @include theme-light {
        color: var(--resume-light-ink);
    }

    @include bp-custom-min(730) {
        max-width: 48em;
    }

    @include bp-xl-desktop {
        max-width: 56em;
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
    margin: $size-1 0;

    @include theme-light {
        color: var(--resume-light-muted);
    }

    span {
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
    line-height: 1.45;
    color: $color-text-secondary;

    @include theme-light {
        color: #45545c;
    }
}

.page-header {
    display: flex;
    flex-wrap: wrap;
    gap: $size-4;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: $size-3 0 $size-5;
    margin-bottom: $size-1;

    @include bp-xsm-phone {
        gap: $size-3;
        padding-bottom: $size-4;
    }
}

.page-title {
    display: flex;
    flex-direction: column;
    gap: $size-1;
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
        gap: 0.4em !important;
        min-height: 2.75em;
        border-radius: 10px;

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
    gap: $size-6;
    width: 100%;
}

.section {
    display: flex;
    flex-direction: column;
    gap: $size-2;
    width: 100%;
}

.section-content {
    width: 100%;
    padding: $size-4 $size-5;
    border: solid 1px transparent;
    border-radius: 12px;
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
    padding-left: $size-1;
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
    gap: 2px;
}

.section-segment {
    padding: $size-1 0 0;

    & + & {
        padding-top: $size-3;
        margin-top: $size-2;
        border-top: solid 1px transparent;

        @include theme-dark {
            border-color: #adb5bd22;
        }

        @include theme-light {
            border-color: #3d505c22;
        }
    }

    &-skills {
        gap: $size-1;

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
    gap: $size-2;
    justify-content: space-between;
}

.segment-title {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    margin-right: $size-5;
    font-size: 1.3em;
    font-weight: 600;
    line-height: 1.25;

    @include bp-custom-min(489) {
        gap: $size-1;
    }

    &-projects {
        .project-link {
            font-size: 1.1em;
            color: inherit;

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
    gap: $size-2;
    align-items: center;
    margin-left: auto;
    font-size: 0.9em;
    color: $color-text-secondary;

    @include theme-light {
        color: var(--resume-light-muted);
    }

    :deep(svg) {
        height: 1em;
        margin-bottom: 4px;
        stroke: $color-text-primary;
        will-change: opacity;

        @include theme-light {
            stroke: var(--resume-light-accent);
        }
    }
}

.segment-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
}

.segment-info {
    padding-right: $size-2;
    padding-left: $size-5;
}
</style>
