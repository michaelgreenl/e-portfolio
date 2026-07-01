<script setup>
import { computed, ref, useTemplateRef, watch, nextTick } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { useBreakpoints } from '@/composables/useBreakpoints.js';
import { useGsap } from '@/composables/useGsap.js';
import { projectAnimations } from '@/animations/page/projects.js';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';
import ProjectDemoVideo from '@/components/Project/ProjectDemoVideo.vue';

import BoxArrowIcon from '@/components/SVGs/BoxArrowIcon.vue';
import ArrowIcon from '@/components/SVGs/ArrowIcon.vue';
import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';

const props = defineProps({
    project: { required: true, type: Object },
    projectLogos: { required: true, type: Object },
    externalIcons: { required: true, type: Object },
});

const emit = defineEmits(['open-project', 'close-selected']);

const bp = useBreakpoints();

const externalLinkRespText = (projectSlug, externalLinks) => {
    const className = 'responsive-link-text';

    const TWO_COLUMN_CARD = 'game-lobby';

    if (bp.isXlLaptop.value) {
        return 'undefined';
    }

    if (bp.isLgLaptop.value) {
        if (projectSlug === TWO_COLUMN_CARD) return 'undefined';
        return `${Object.keys(externalLinks).length <= 3 ? undefined : className}`;
    }

    if (bp.isLaptop.value) {
        if (projectSlug === TWO_COLUMN_CARD) return 'undefined';
        return `${Object.keys(externalLinks).length < 3 ? undefined : className}`;
    }

    let customMin;
    customMin = bp.customMin(540);
    if (customMin.value) {
        return 'undefined';
    }

    customMin = bp.customMin(416);
    if (customMin.value) {
        return `${Object.keys(externalLinks).length <= 3 ? undefined : className}`;
    }

    return `${Object.keys(externalLinks).length < 3 ? undefined : className}`;
};

const cardEl = ref(null);
const { registerAnim } = useGsap(cardEl);
const toolChipsContainer = useTemplateRef('toolChipsContainer');
const projectSelected = ref(false);
const autoplayVideo = ref(false);

const anims = {
    showSelectedProjectDetails: registerAnim(projectAnimations.showSelectedProjectDetails),
    hideSelectedProjectDetails: registerAnim(projectAnimations.hideSelectedProjectDetails),
};

const { top: toolChipTop } = useElementBounding(toolChipsContainer);
const { height: viewportHeight } = useWindowSize();

const toolChipsYValue = computed(() => {
    if (!toolChipsContainer.value) return undefined;

    if (toolChipTop.value <= viewportHeight.value * 0.45) {
        return 'top-third';
    } else if (toolChipTop.value <= viewportHeight.value * 0.65) {
        return 'middle-third';
    }

    return undefined;
});

const shouldSkipSelectedDetailsAnimation = () =>
    bp.isLaptop.value || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function onSelectedDetailsEnter(el, done) {
    if (shouldSkipSelectedDetailsAnimation()) {
        done();
        return;
    }

    anims.showSelectedProjectDetails({ target: el, onComplete: done });
}

function onSelectedDetailsLeave(el, done) {
    const finishLeave = () => {
        autoplayVideo.value = false;
        done();
    };

    if (shouldSkipSelectedDetailsAnimation()) {
        finishLeave();
        return;
    }

    anims.hideSelectedProjectDetails({ target: el, onComplete: finishLeave });
}

async function openProject(autoplay = false) {
    if (bp.isLaptop.value) {
        emit('open-project', props.project, autoplay);
        projectSelected.value = true;
    } else {
        projectSelected.value = true;
        autoplayVideo.value = autoplay;
        await nextTick();

        // Handling race condition with scrollTo getting viewportHeight and project-card grow animation completing
        if (props.project.slug === 'algo-visualizer' || props.project.slug === 'mawm') {
            setTimeout(() => {
                if (props.project.slug === 'algo-visualizer') {
                    window.scrollTo({ top: cardEl.value.offsetTop, behavior: 'smooth' });
                } else {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }
            }, 100);
        }

        window.scrollTo({ top: cardEl.value.offsetTop, behavior: 'smooth' });
    }
}

function closeProject() {
    projectSelected.value = false;
    autoplayVideo.value = false;
}

// ensures window resizing doesn't result in unwanted UI layouts
watch(bp.isLaptop, (newVal) => {
    if (projectSelected.value && !newVal) {
        projectSelected.value = false;
        emit('close-selected');
    } else if (projectSelected.value && newVal) {
        closeProject();
        projectSelected.value = false;
    }
});

defineExpose({ openProject, projectSelected });
</script>

<template>
    <div
        ref="cardEl"
        class="project-card"
        :class="`${projectSelected && !bp.isLaptop.value ? 'selected-mobile' : undefined}`"
        role="button"
        tabindex="0"
        @click="projectSelected && !bp.isLaptop.value ? undefined : openProject()"
        @keydown.enter="emit('open-project', project)"
        @keydown.space.prevent="emit('open-project', project)"
    >
        <div class="card-body">
            <div class="card-header">
                <div class="card-title">
                    <component :is="projectLogos[project.slug]" class="project-logo" />

                    <h2 :style="{ fontFamily: project.fontFamily }">
                        {{ project.title }}
                    </h2>
                </div>

                <div class="card-date">
                    <CalendarIcon />
                    <p class="short-date">{{ project.shortDate }}</p>
                    <p class="long-date">{{ project.longDate }}</p>
                </div>
            </div>

            <p class="card-description">{{ project.description.short }}</p>

            <div ref="toolChipsContainer" class="tool-chips-container" :class="`${toolChipsYValue}`">
                <div class="card-tool-chips">
                    <ToolChip v-for="tool in project.stack" :key="tool" :tool="tool" class="chip" />
                </div>
            </div>

            <Transition :css="false" @enter="onSelectedDetailsEnter" @leave="onSelectedDetailsLeave">
                <div v-if="projectSelected && !bp.isLaptop.value" class="selected-details">
                    <ProjectDemoVideo v-if="project.video" :project="project" :autoplay="autoplayVideo" />

                    <ul class="selected-description">
                        <li v-for="description in project.description?.long" :key="description">
                            {{ description }}
                        </li>
                    </ul>
                </div>
            </Transition>

            <div class="card-footer">
                <div class="external-links external-links-card">
                    <a
                        v-for="[key, link] in Object.entries(project.externalLinks).filter(
                            ([key]) => key !== 'porfolioLink',
                        )"
                        :class="externalLinkRespText(project.slug, project.externalLinks)"
                        :key="link"
                        :href="key === 'demoVideo' ? null : link.href"
                        target="_blank"
                    >
                        <Button
                            v-if="key === 'demoVideo'"
                            @click.stop="openProject(true)"
                            :text="link.text"
                            :iconLeft="externalIcons[key]"
                            preset="secondary"
                        />

                        <Button v-else :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                    </a>
                </div>

                <Button
                    v-if="!bp.isLaptop.value"
                    class="see-more mobile"
                    :class="`${projectSelected ? 'project-selected' : undefined}`"
                    @click.stop="projectSelected ? closeProject() : openProject()"
                    :text="`See ${projectSelected ? 'Less' : 'More'}`"
                    :iconRight="ArrowIcon"
                    preset="primary"
                />
                <Button
                    v-else
                    class="see-more"
                    @click.stop="openProject()"
                    text="See More"
                    :iconRight="BoxArrowIcon"
                    preset="primary"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
p {
    margin: 0;
}

.project-card,
.card-body,
.selected-description {
    display: flex;
    flex-direction: column;
}

.card-header,
.card-title,
.card-date,
.card-footer,
.card-tool-chips {
    display: flex;
    align-items: center;
}

.card-footer {
    justify-content: space-between;
    margin-top: $size-1;
    font-size: 1.3em;

    @include bp-md-tablet {
        flex-wrap: nowrap;
        padding-top: $size-4;
        margin-top: $size-2;
        border-top: solid 1px $color-text-muted;
    }

    @include bp-sm-phone {
        font-size: 1.4em;
    }
}

.project-card {
    align-items: center;
    justify-content: space-between;
    padding: $size-6 $size-8;
    cursor: pointer;
    border-bottom: solid 1px $color-text-muted;

    &:first-child {
        border-top: solid 1px $color-text-muted;
    }

    @media (hover: hover) and (pointer: fine) {
        &:hover,
        &:active {
            border-radius: 12px;
            box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);
            transform: scale(1.01) !important;
            backdrop-filter: blur(2px);

            .card-footer {
                :deep(.see-more) {
                    color: $color-bg-primary !important;

                    .icon {
                        fill: $color-bg-primary !important;
                    }
                }
            }

            @include theme-dark {
                background: linear-gradient(90deg, #21252922, #21252900);

                .card-footer {
                    :deep(.see-more) {
                        background: $color-text-primary;
                    }
                }
            }

            @include theme-light {
                background: linear-gradient(90deg, #dee2e622, #dee2e600);

                .card-footer {
                    :deep(.see-more) {
                        background: $color-primary-darker;
                    }
                }
            }
        }
    }

    @include bp-sm-phone {
        flex-direction: row;
        gap: $size-6;
    }

    @include bp-md-tablet {
        @include theme-dark {
            border: solid 1px $color-bg-secondary !important;
        }

        @include theme-light {
            border: solid 1px #cdd0d3 !important;
        }

        border-radius: 12px;
    }
}

.card-body {
    gap: $size-2;
    width: 100%;
}

.card-header {
    flex-wrap: wrap-reverse;
    gap: $size-3;
    justify-content: space-between;

    .card-title {
        gap: 0.6em;
        margin-right: 3em;
        font-size: 1.2em;

        @include bp-xsm-phone {
            font-size: 1.4em;
        }

        @include bp-md-tablet {
            margin-right: 8em;
        }

        @include bp-xl-desktop {
            margin-right: 4em;
        }

        .project-logo {
            display: flex;
            align-items: center;
            height: 2.6em;

            @include theme-dark {
                fill: $color-gray3;
            }

            @include theme-light {
                fill: $color-primary-darker;
            }
        }

        h2 {
            margin: 0 !important;
            font-size: 2.2em;

            @include theme-dark {
                color: $color-gray3;
            }

            @include theme-light {
                color: $color-primary-darker;
            }
        }
    }

    .card-date {
        gap: $size-2;
        margin-left: auto;
        font-size: 1.4em;

        @include bp-sm-phone {
            margin-bottom: 1em;

            @include bp-md-tablet {
                margin-bottom: 0;
            }
        }

        svg {
            height: 1.1em;
            stroke: $color-text-secondary;
        }

        $date-bp: 400;

        .short-date {
            display: flex;

            @include bp-custom-min($date-bp) {
                display: none;
            }
        }

        .long-date {
            display: none;

            @include bp-custom-min($date-bp) {
                display: flex;
            }
        }
    }
}

.card-description {
    flex: 1;
    max-width: 78ch;
    font-size: 1.5em;

    @include bp-sm-phone {
        font-size: 1.7em !important;
    }
}

.selected-details {
    display: flex;
    flex-direction: column;
    width: 100%;
}

$inset-width: 12px;

.tool-chips-container {
    position: relative;
    margin-top: $size-2;
    border-radius: 8px;

    &::before,
    &::after {
        background-color: #272c3099;

        @include bp-md-tablet {
            display: none;
        }

        @include theme-light {
            background-color: #dee2e699;
        }
    }

    &::before {
        position: absolute;
        top: 0;
        bottom: 3px;
        left: -1px; // account for coverage when card's scale increases on hover
        z-index: 100;
        width: $inset-width;
        content: '';
        mask-image: linear-gradient(-90deg, transparent, #000);
    }

    &::after {
        position: absolute;
        top: 0;
        right: -1px; // account for coverage when card's scale increases on hover
        bottom: 3px;
        z-index: 100;
        width: $inset-width;
        content: '';
        mask-image: linear-gradient(90deg, transparent, #000);
    }

    @include theme-dark {
        &.top-third {
            &::before,
            &::after {
                background-color: #2e363b99;
            }
        }

        &.middle-third {
            &::before,
            &::after {
                background-color: #2d323699;
            }
        }
    }

    @include theme-light {
        &.top-third {
            &::before,
            &::after {
                background-color: #d7dde385;
            }
        }
    }
}

.card-tool-chips {
    position: relative;
    gap: $size-6;
    padding-bottom: $size-2;
    overflow-x: scroll;
    overflow-y: hidden;
    font-size: 1.1em;

    :deep(.chip-container) {
        max-width: none !important;

        &:first-child {
            margin-left: calc($inset-width - 4px);
        }

        &:last-child {
            margin-right: calc($inset-width - 4px);
        }

        @include bp-md-tablet {
            margin: 0 !important;
        }
    }

    @include bp-sm-phone {
        font-size: 1.3em;
    }

    @include bp-md-tablet {
        flex-wrap: wrap;
        height: $size-8;
        overflow: hidden;
    }

    .chip {
        flex: 1;
        font-size: 1.2em;
    }
}

.demo-video {
    width: 100%;
    max-width: 50em;
    aspect-ratio: 16 / 9;
    margin: $size-4 auto;
    border-radius: 12px;

    @include bp-xsm-phone {
        width: 95%;
    }

    @include bp-sm-phone {
        width: 90%;
    }
}

.selected-description {
    gap: $size-2;
    padding: $size-2 0 $size-2 $size-4;
    margin: 0;
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;

    @include bp-sm-phone {
        padding: $size-3 0 0 $size-5;
        font-size: 1.6em;
    }
}

:deep(.see-more) {
    gap: 0.6em;
    border-width: 1px;
    border-radius: 7px;

    @include bp-md-tablet {
        flex-shrink: 0;
        white-space: nowrap;
    }

    @include bp-lg-laptop {
        font-size: 1.1em;
    }

    .icon {
        transition: transform 0.3s ease;
    }

    &.mobile .icon {
        transform: rotate(180deg);
    }

    &.project-selected .icon {
        transform: rotate(0deg);
    }
}

.external-links {
    a {
        &.responsive-link-text {
            &:deep(button) span {
                display: none;
            }
        }

        &:deep(button) {
            white-space: nowrap;

            @include bp-md-tablet {
                gap: $size-2;
            }

            svg {
                height: $size-6;
                fill: rgb(0 0 0 / 0%) !important;
                stroke-width: 2;
                transition: fill 0.1s ease-in-out;

                @include theme-dark {
                    stroke: lighten-color($color-text-muted, 15%);
                }

                @include theme-light {
                    stroke: $color-primary-darker;
                }
            }
        }
    }

    &-card {
        display: flex;
        gap: $size-4;
        font-size: 1.1em;
    }

    &-card a:nth-child(3) {
        &:deep(button) svg {
            stroke-width: 0 !important;

            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%) !important;
            }

            @include theme-light {
                fill: $color-primary-darker !important;
            }
        }
    }

    a:hover :deep(button) svg {
        @include theme-dark {
            fill: lighten-color($color-text-muted, 15%) !important;
        }

        @include theme-light {
            fill: $color-primary-darker !important;
        }
    }
}
</style>
