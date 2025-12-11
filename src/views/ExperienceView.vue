<script setup>
import { ref, onMounted, watch } from 'vue';
import resumeData from '@/assets/data/resume.json';
import { useRouteStore } from '@/stores/routeStore.js';
import { useThemeStore } from '@/stores/themeStore.js';
import { useUtilAnimations } from '@/composables/animations/useUtilAnimations.js';
import Button from '@/components/Button.vue';
import DownloadThickIcon from '@/components/SVGs/DownloadThickIcon.vue';
import DownloadIcon from '@/components/SVGs/DownloadIcon.vue';
import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';

const routeStore = useRouteStore();
const themeStore = useThemeStore();
const { fadeIn, fadeOut } = useUtilAnimations();

onMounted(() => {
    fadeIn({ selector: '.resume-container' });
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
            <a href="files/blank-resume.pdf" download="files/blank-resume.pdf">
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
                <h2 class="section-header">Relavant Experience</h2>
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
                <h2 class="section-header">Skills</h2>
                <hr />
                <div class="section-segment section-segment-skills">
                    <p><span>Languages:</span>&nbsp; Javascript, HTML/CSS, Sass, SQL, Python</p>
                    <p><span>Frameworks:</span>&nbsp; Node, Vue, React, Express, Socket.IO</p>
                    <p>
                        <span>Tools & Databases:</span>&nbsp; Git, Bash, REST APIs, JWT, PostgreSQL, MySQL, Prisma,
                        Sequelize, GSAP
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.resume-container {
    position: relative;
    font-size: 0.7em;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    width: 100%;
    max-width: 32em;
    margin: 0 auto;
    padding: $size-4;
    color: $color-text-primary;

    @include bp-custom-min(730) {
        max-width: 48em;
    }

    @include bp-xl-desktop {
        max-width: 71em;
    }

    @include bp-xsm-phone {
        font-size: clamp(0.75em, 3.5vw, 1.05em);
    }
}

h1 {
    font-size: 3em;
    margin: $size-1 0;
}

h2,
h3,
h4,
p {
    margin: 0;
}

h2 {
    font-size: 1.8em;
    font-family: $primary-font-stack;
}

h3 {
    font-family: $ternary-font-stack;
}

h3 span {
    font-weight: 400;
    font-size: 0.9em;
    color: $color-text-secondary;
}

p {
    margin: $size-1 0;

    span {
        font-size: 1.15em;
        font-family: $ternary-font-stack;
        font-weight: 600;
    }
}

ul {
    margin: $size-1 0;
    padding: 0 $size-5;
}

li {
    font-family: $secondary-font-stack;
    color: $color-text-secondary;
}

hr {
    border: 0;
    width: 100%;
    margin: $size-2 auto;
    height: 1px;

    @include theme-dark {
        background-color: $color-gray6;
    }

    @include theme-light {
        background-color: $color-gray5;
    }
}

.page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
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
    padding: $size-2;
    display: flex;
    flex-direction: column;
    gap: 2px;

    &-skills {
        font-size: 0.94em;
        padding-top: 0.1em !important;
    }
}

.segment-details {
    gap: 2px;
    display: flex;
    flex-direction: column;
}

.segment-header {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap-reverse;
    gap: 3px;
}

.segment-title {
    font-weight: 600;
    font-size: 1.3em;
}

.segment-dates {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: $size-2;

    :deep(svg) {
        height: 1em;
        stroke: $color-text-primary;
        margin-bottom: 4px;
    }
}
</style>
