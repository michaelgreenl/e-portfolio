<script setup>
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { useBreakpoints } from '@/composables/useBreakpoints.js';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';

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

    if (bp.isXlLaptop.value) {
        return 'undefined';
    }

    if (bp.isLgLaptop.value) {
        // if project is the large project-card in the grid
        if (projectSlug === 'game-lobby') return 'undefined';
        return `${Object.keys(externalLinks).length <= 3 ? undefined : className}`;
    }

    if (bp.isLaptop.value) {
        if (projectSlug === 'game-lobby') return 'undefined';
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
const toolChipsContainer = useTemplateRef('toolChipsContainer');
const projectSelected = ref(false);
const autoplayVideo = ref(false);

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

const projectHref = computed(() => `/projects/${props.project.slug}`);
const demoHref = computed(() => `${projectHref.value}?autoplay=true`);

function openProject(autoplay = false, updateRoute = true) {
    if (updateRoute) {
        emit('open-project', props.project, autoplay);
    }

    if (bp.isLaptop.value) {
        projectSelected.value = true;
    } else {
        projectSelected.value = true;
        autoplayVideo.value = autoplay;
    }
}

function closeProject(updateRoute = true) {
    projectSelected.value = false;
    autoplayVideo.value = false;

    if (updateRoute) {
        emit('close-selected');
    }
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

defineExpose({ openProject, closeProject, projectSelected });
</script>

<template>
    <div
        ref="cardEl"
        class="project-card"
        :class="`${projectSelected && !bp.isLaptop.value ? 'selected-mobile' : undefined}`"
        role="button"
        tabindex="0"
        @click="openProject()"
        @keydown.enter="openProject()"
        @keydown.space.prevent="openProject()"
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

            <template v-if="projectSelected && !bp.isLaptop.value">
                <iframe
                    v-if="project.video"
                    class="demo-video"
                    :src="`https://player.vimeo.com/video/${project.video}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=${autoplayVideo ? '1' : '0'}&amp;muted=1`"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    :title="`${project.slug}-demo-vid`"
                ></iframe>

                <ul class="selected-description">
                    <li v-for="description in project.description?.long" :key="description">
                        {{ description }}
                    </li>
                </ul>
            </template>

            <div class="card-footer">
                <div class="external-links external-links-card">
                    <template
                        v-for="[key, link] in Object.entries(project.externalLinks).filter(
                            ([key]) => key !== 'porfolioLink',
                        )"
                        :key="key"
                    >
                        <a
                            v-if="key === 'demoVideo'"
                            :class="externalLinkRespText(project.slug, project.externalLinks)"
                            :href="demoHref"
                            @click.stop.prevent="openProject(true)"
                        >
                            <Button as="span" :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                        </a>

                        <a
                            v-else
                            :class="externalLinkRespText(project.slug, project.externalLinks)"
                            :href="link.href"
                            target="_blank"
                            rel="noopener noreferrer"
                            @click.stop
                        >
                            <Button as="span" :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                        </a>
                    </template>
                </div>

                <a
                    v-if="!bp.isLaptop.value"
                    class="see-more-link"
                    :href="projectHref"
                    @click.stop.prevent="projectSelected ? closeProject() : openProject()"
                >
                    <Button
                        as="span"
                        class="see-more mobile"
                        :class="`${projectSelected ? 'project-selected' : undefined}`"
                        :text="`See ${projectSelected ? 'Less' : 'More'}`"
                        :iconRight="ArrowIcon"
                        preset="primary"
                    />
                </a>
                <a v-else class="see-more-link" :href="projectHref" @click.stop.prevent="openProject()">
                    <Button as="span" class="see-more" text="See More" :iconRight="BoxArrowIcon" preset="primary" />
                </a>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
p {
    margin: 0;
}

.project-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: $size-6 $size-8;
    cursor: pointer;

    @include theme-dark {
        &:first-child {
            border-top: solid 1px $color-text-muted;
        }

        border-bottom: solid 1px $color-text-muted;
    }

    @include theme-light {
        &:first-child {
            border-top: solid 1px $color-text-muted;
        }

        border-bottom: solid 1px $color-text-muted;
    }

    @media (hover: hover) and (pointer: fine) {
        &:hover,
        &:active {
            border-radius: 12px;
            box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);
            transform: scale(1.01) !important;
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

    &.selected-mobile .card-body .card-footer {
        margin-top: $size-2;
        padding-top: $size-4;
        border-top: solid 1px $color-text-muted;
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
    justify-content: space-between;
    flex-wrap: wrap-reverse;

    .card-title {
        display: flex;
        align-items: center;
        gap: 0.6em;
        font-size: 1.2em;
        margin-right: 3em;

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

    .card-header,
    .card-date {
        display: flex;
        gap: $size-2;
        align-items: center;
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
    max-width: 86ch;
    font-size: 1.5em;

    @include bp-sm-phone {
        font-size: 1.7em !important;
    }
}

$inset-width: 12px;

.tool-chips-container {
    position: relative;
    margin-top: $size-2;
    border-radius: 8px;

    &::before,
    &::after {
        @include bp-md-tablet {
            display: none;
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
        background: linear-gradient(-90deg, #272c3000, #272c3099);

        @include theme-light {
            background: linear-gradient(-90deg, #dee2e600, #dee2e699);
        }
    }

    &::after {
        position: absolute;
        top: 0;
        right: -1px; // account for coverage when card's scale increases on hover
        bottom: 3px;
        z-index: 100;
        width: $inset-width;
        content: '';
        background: linear-gradient(90deg, #272c3000, #272c3099);

        @include theme-light {
            background: linear-gradient(90deg, #dee2e600, #dee2e699);
        }
    }

    @include theme-dark {
        &.top-third {
            &::before {
                background: linear-gradient(-90deg, #2e363b00, #2e363b99);

                @include theme-light {
                    background: linear-gradient(90deg, #d7dde300, #d7dde385);
                }
            }

            &::after {
                background: linear-gradient(90deg, #2e363b00, #2e363b99);

                @include theme-light {
                    background: linear-gradient(90deg, #d7dde300, #d7dde385);
                }
            }
        }

        &.middle-third {
            &::before {
                background: linear-gradient(-90deg, #2d323600, #2d323699);
            }

            &::after {
                background: linear-gradient(90deg, #2d323600, #2d323699);
            }
        }
    }
}

.card-tool-chips {
    position: relative;
    display: flex;
    gap: $size-6;
    align-items: center;
    overflow-x: scroll;
    overflow-y: hidden;
    padding-bottom: $size-2;
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

    // &::-webkit-scrollbar {
    //     margin-top: $size-1;
    //     height: $size-1;
    // }
    //
    // &::-webkit-scrollbar-track {
    //     background: #adb5bd0f;
    //     border-radius: 5px;
    // }
    //
    // &::-webkit-scrollbar-thumb {
    //     background: #adb5bd1f;
    //     border-radius: 5px;
    // }
}

.demo-video {
    width: 100%;
    max-width: 50em;
    aspect-ratio: 2/1.1;
    margin: $size-4 auto 0;
    border-radius: 12px;
    box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);

    @include bp-xsm-phone {
        width: 95%;
    }

    @include bp-sm-phone {
        width: 90%;
    }
}

.selected-description {
    display: flex;
    flex-direction: column;
    gap: $size-2;
    padding: $size-2 0 $size-2 $size-4;
    margin: 0;
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;

    @include bp-sm-phone {
        font-size: 1.6em;
        padding: $size-3 0 0 $size-5;
    }
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1.3em;
    margin-top: $size-1;

    @include bp-md-tablet {
        flex-wrap: nowrap;
        margin-top: $size-2;
        padding-top: $size-4;
        border-top: solid 1px $color-text-muted;
    }

    @include bp-sm-phone {
        font-size: 1.4em;
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
    &-card {
        display: flex;
        gap: $size-4;
        font-size: 1.1em;

        a:nth-child(3) {
            &:deep(.app-button) svg {
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
        &.responsive-link-text {
            &:deep(.app-button) span {
                display: none;
            }
        }

        &:deep(.app-button) {
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
                    stroke: darken-color($color-text-muted, 15%);
                }
            }
        }

        &:hover :deep(.app-button) svg {
            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%) !important;
            }

            @include theme-light {
                fill: darken-color($color-text-muted, 15%) !important;
            }
        }
    }
}
</style>
