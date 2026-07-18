<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';
import { useResizeObserver } from '@vueuse/core';
import { useBreakpoints } from '@/composables/useBreakpoints.js';
import { useGsap } from '@/composables/useGsap.js';
import {
    cancelProjectToolChipAnimations,
    captureProjectToolChipState,
    projectAnimations,
} from '@/animations/page/projects.js';
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
const toolChipList = useTemplateRef('toolChipList');
const toolOverflow = useTemplateRef('toolOverflow');
const projectSelected = ref(false);
const autoplayVideo = ref(false);
const visibleToolCount = shallowRef(props.project.stack.length);
const toolsRevealed = shallowRef(false);
const toolsRevealing = shallowRef(false);

const hiddenToolCount = computed(() => props.project.stack.length - visibleToolCount.value);
const hiddenToolsLabel = computed(() => props.project.stack.slice(visibleToolCount.value).join(', '));
const isMobileToolRowRevealed = computed(() => toolsRevealed.value && hiddenToolCount.value > 0 && !bp.isLaptop.value);
const toolListId = `${props.project.slug}-tool-list`;

let toolMeasurementFrame;
let toolRevealRun = 0;
let activeToolReveal;
let toolRevealMaxWidths;

function getToolChipElements() {
    return Array.from(toolChipList.value?.querySelectorAll(':scope > .chip') ?? []);
}

function measureVisibleTools() {
    if (toolsRevealing.value) return;

    const listEl = toolChipList.value;
    const overflowEl = toolOverflow.value;
    const chipElements = getToolChipElements();

    if (!listEl || !overflowEl || chipElements.length === 0) return;

    const availableWidth = listEl.clientWidth;
    const gap = Number.parseFloat(getComputedStyle(listEl).columnGap) || 0;
    listEl.classList.add('is-measuring');
    const chipWidths = chipElements.map((chip) => chip.getBoundingClientRect().width);
    listEl.classList.remove('is-measuring');
    const allChipsWidth = chipWidths.reduce((total, width) => total + width, 0) + gap * (chipWidths.length - 1);

    let nextVisibleCount = chipWidths.length;

    if (allChipsWidth > availableWidth) {
        const overflowWidth = overflowEl.getBoundingClientRect().width;
        let usedWidth = overflowWidth;

        nextVisibleCount = 0;
        chipWidths.some((width) => {
            const nextWidth = usedWidth + gap + width;

            if (nextWidth > availableWidth) return true;

            usedWidth = nextWidth;
            nextVisibleCount += 1;
            return false;
        });

        nextVisibleCount = Math.max(nextVisibleCount, 1);
    }

    if (visibleToolCount.value !== nextVisibleCount) {
        visibleToolCount.value = nextVisibleCount;
        nextTick(scheduleVisibleToolMeasurement);
    }
}

function scheduleVisibleToolMeasurement() {
    cancelAnimationFrame(toolMeasurementFrame);
    toolMeasurementFrame = requestAnimationFrame(measureVisibleTools);
}

function focusRevealedToolList() {
    const listEl = toolChipList.value;
    if (!listEl) return;

    listEl.scrollLeft = 0;
    listEl.focus({ preventScroll: true });
}

function finishToolReveal(runId) {
    if (runId !== toolRevealRun) return;

    activeToolReveal = null;
    toolRevealMaxWidths = null;
    toolsRevealing.value = false;
    scheduleVisibleToolMeasurement();
}

async function showRevealedTools(runId, initialToolCount) {
    if (runId !== toolRevealRun) return;

    const initialTargets = getToolChipElements().slice(0, initialToolCount);
    const flipState = captureProjectToolChipState(initialTargets);

    toolsRevealed.value = true;
    await nextTick();

    if (runId !== toolRevealRun) return;

    const enteringTargets = getToolChipElements().slice(initialToolCount);

    focusRevealedToolList();
    activeToolReveal = anims.revealToolRow({
        enteringTargets,
        flipState,
        initialTargets,
        onComplete: () => finishToolReveal(runId),
        overflowTarget: toolOverflow.value,
    });
}

async function showRevealedToolsWithoutMotion(runId) {
    toolsRevealed.value = true;
    await nextTick();

    if (runId !== toolRevealRun) return;

    focusRevealedToolList();
    finishToolReveal(runId);
}

function revealTools() {
    if (bp.isLaptop.value || hiddenToolCount.value === 0 || toolsRevealing.value) return;

    const runId = ++toolRevealRun;
    const initialToolCount = visibleToolCount.value;

    toolRevealMaxWidths = getToolChipElements().map((chip) => chip.style.maxWidth);
    toolsRevealing.value = true;

    if (prefersReducedMotion()) {
        showRevealedToolsWithoutMotion(runId);
        return;
    }

    activeToolReveal = anims.hideToolOverflow({
        onComplete: () => showRevealedTools(runId, initialToolCount),
        target: toolOverflow.value,
    });
}

function resetTools() {
    toolRevealRun += 1;

    if (activeToolReveal || toolsRevealing.value) {
        cancelProjectToolChipAnimations({
            maxWidths: toolRevealMaxWidths,
            overflowTarget: toolOverflow.value,
            targets: getToolChipElements(),
            timeline: activeToolReveal,
        });
    }

    activeToolReveal = null;
    toolRevealMaxWidths = null;
    toolsRevealed.value = false;
    toolsRevealing.value = false;

    if (toolChipList.value) toolChipList.value.scrollLeft = 0;
}

function stopRevealedToolInteraction(event) {
    if (isMobileToolRowRevealed.value) event.stopPropagation();
}

function onToolRowKeydown(event) {
    if (!isMobileToolRowRevealed.value || !['ArrowLeft', 'ArrowRight'].includes(event.key)) return;

    const listEl = toolChipList.value;
    if (!listEl) return;

    event.stopPropagation();
    event.preventDefault();

    const direction = event.key === 'ArrowRight' ? 1 : -1;
    listEl.scrollLeft += direction * Math.max(listEl.clientWidth / 2, 48);
}

useResizeObserver(toolChipsContainer, scheduleVisibleToolMeasurement);

onMounted(async () => {
    await nextTick();
    await document.fonts?.ready;
    scheduleVisibleToolMeasurement();
});

onUnmounted(() => {
    toolRevealRun += 1;
    cancelAnimationFrame(toolMeasurementFrame);
});

const anims = {
    hideToolOverflow: registerAnim(projectAnimations.hideToolOverflow),
    revealToolRow: registerAnim(projectAnimations.revealToolRow),
    showSelectedProjectDetails: registerAnim(projectAnimations.showSelectedProjectDetails),
    hideSelectedProjectDetails: registerAnim(projectAnimations.hideSelectedProjectDetails),
};

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const shouldSkipSelectedDetailsAnimation = () => bp.isLaptop.value || prefersReducedMotion();

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

function scrollToSelectedCard() {
    const cardTop = cardEl.value.offsetTop;

    if (!bp.isTablet.value) {
        window.scrollTo({ top: Math.max(cardTop + 48, 0), behavior: 'smooth' });
        return;
    }

    window.scrollTo({ top: cardTop, behavior: 'smooth' });
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
                    scrollToSelectedCard();
                } else {
                    if (bp.isTablet.value) {
                        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    } else {
                        scrollToSelectedCard();
                    }
                }
            }, 100);
        }

        scrollToSelectedCard();
    }
}

function closeProject() {
    projectSelected.value = false;
    autoplayVideo.value = false;
}

// ensures window resizing doesn't result in unwanted UI layouts
watch(bp.isLaptop, (newVal) => {
    resetTools();
    nextTick(scheduleVisibleToolMeasurement);

    if (projectSelected.value && !newVal) {
        projectSelected.value = false;
        emit('close-selected');
    } else if (projectSelected.value && newVal) {
        closeProject();
        projectSelected.value = false;
    }
});

watch(hiddenToolCount, (count) => {
    if (count === 0) resetTools();
});

defineExpose({ openProject, projectSelected, scrollToSelectedCard });
</script>

<template>
    <div
        ref="cardEl"
        class="project-card"
        :class="`${projectSelected && !bp.isLaptop.value ? 'selected-mobile' : undefined}`"
        role="button"
        tabindex="0"
        @click="projectSelected && !bp.isLaptop.value ? undefined : openProject()"
        @keydown.enter.self="emit('open-project', project)"
        @keydown.space.self.prevent="emit('open-project', project)"
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

            <div ref="toolChipsContainer" class="tool-chips-container">
                <div
                    :id="toolListId"
                    ref="toolChipList"
                    class="card-tool-chips"
                    :class="{
                        'is-mobile-tool-row': !bp.isLaptop.value,
                        'is-scrollable': isMobileToolRowRevealed,
                    }"
                    :tabindex="isMobileToolRowRevealed ? 0 : undefined"
                    :role="isMobileToolRowRevealed ? 'region' : undefined"
                    :aria-label="
                        isMobileToolRowRevealed
                            ? `All ${project.stack.length} tools used for ${project.title}. Scroll horizontally.`
                            : undefined
                    "
                    @click="stopRevealedToolInteraction"
                    @keydown="onToolRowKeydown"
                >
                    <ToolChip
                        v-for="(tool, index) in project.stack"
                        :key="tool"
                        :tool="tool"
                        class="chip"
                        :class="{ 'is-hidden': !isMobileToolRowRevealed && index >= visibleToolCount }"
                        :aria-hidden="!isMobileToolRowRevealed && index >= visibleToolCount"
                    />

                    <button
                        v-if="!bp.isLaptop.value"
                        ref="toolOverflow"
                        type="button"
                        class="tool-overflow tool-overflow-button"
                        :class="{ 'is-hidden': isMobileToolRowRevealed || hiddenToolCount === 0 }"
                        :aria-hidden="isMobileToolRowRevealed || hiddenToolCount === 0"
                        :aria-controls="toolListId"
                        :aria-disabled="toolsRevealing || undefined"
                        :aria-expanded="toolsRevealing || isMobileToolRowRevealed"
                        :aria-label="`Show ${hiddenToolCount} more tools: ${hiddenToolsLabel}`"
                        :title="hiddenToolsLabel"
                        :tabindex="hiddenToolCount > 0 && !isMobileToolRowRevealed && !toolsRevealing ? 0 : -1"
                        @click.stop="revealTools"
                        @keydown.enter.stop.prevent="revealTools"
                        @keydown.space.stop.prevent="revealTools"
                    >
                        +{{ hiddenToolCount }}
                    </button>

                    <span
                        v-else
                        ref="toolOverflow"
                        class="tool-overflow"
                        :class="{ 'is-hidden': hiddenToolCount === 0 }"
                        :aria-hidden="hiddenToolCount === 0"
                        :aria-label="`${hiddenToolCount} more tools: ${hiddenToolsLabel}`"
                        :title="hiddenToolsLabel"
                    >
                        +{{ hiddenToolCount }}
                    </span>
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
    margin-top: $space-1;
    font-size: 1.3em;

    @include bp-sm-phone {
        font-size: 1.4em;
    }

    @include bp-md-tablet {
        flex-wrap: nowrap;
        padding-top: $space-3;
        margin-top: $space-2;
        border-top: solid 1px $color-text-muted;
    }

    :deep(.see-more) {
        .icon {
            height: 1.2em !important;

            @include bp-md-tablet {
                height: 1.1em !important;
                margin-bottom: 0.1rem;
            }
        }

        @include theme-light {
            gap: 0.4rem;

            .icon {
                height: 1.4em !important;

                @include bp-md-tablet {
                    height: 1.1em !important;
                    margin: 0 0 0.1rem 0.1rem;
                }
            }
        }
    }
}

.project-card {
    align-items: center;
    justify-content: space-between;
    padding: $space-4 $size-4;
    cursor: pointer;
    border-bottom: solid 1px $color-text-muted;

    &:first-child {
        border-top: solid 1px $color-text-muted;
    }

    @media (hover: hover) and (pointer: fine) {
        &:hover,
        &:active {
            border-radius: $radius-md;
            box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);
            backdrop-filter: blur(2px);
            transform: scale(1.01) !important;

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

    @include bp-xsm-phone {
        padding: $space-4 $size-6;
    }

    @include bp-sm-phone {
        flex-direction: row;
        gap: $space-4;
    }

    @include bp-md-tablet {
        border-radius: $radius-md;

        @include theme-dark {
            border: solid 1px $color-bg-secondary !important;
        }

        @include theme-light {
            border: solid 1px #cdd0d3 !important;
        }
    }
    @include bp-lg-laptop {
        padding: $space-4 $space-5;
    }
}

.card-body {
    gap: $space-2;
    width: 100%;
}

.card-header {
    flex-wrap: wrap-reverse;
    gap: $space-2;
    justify-content: space-between;

    .card-title {
        gap: $space-2;
        margin-right: $space-8;
        font-size: 1.2em;

        @include bp-xsm-phone {
            font-size: 1.4em;
        }

        @include bp-md-tablet {
            margin-right: $space-24;
        }

        @include bp-xl-desktop {
            margin-right: $space-12;
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
        gap: $space-2;
        margin-left: auto;
        font-size: 1.4em;

        @include bp-sm-phone {
            margin-bottom: $space-3;

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

.tool-chips-container {
    min-width: 0;
    margin-top: $space-2;
}

.card-tool-chips {
    position: relative;
    gap: $space-2;
    overflow: hidden;
    font-size: 1.1em;

    &:not(.is-scrollable) :deep(.chip-container) {
        max-width: none !important;
    }

    @include bp-xsm-phone {
        gap: $space-3;
    }

    @include bp-sm-phone {
        font-size: 1.3em;
    }

    @include bp-md-tablet {
        gap: $space-4;
    }

    .chip {
        flex: 1 0 auto;
        font-size: 1.2em;
    }

    &.is-measuring .chip,
    &.is-scrollable .chip {
        flex-grow: 0;
    }

    &.is-scrollable {
        overflow: auto hidden;
        overscroll-behavior-x: contain;

        &:focus-visible {
            outline: 2px solid $color-primary-light;
            outline-offset: 2px;
        }
    }

    .is-hidden {
        position: absolute;
        visibility: hidden;
        pointer-events: none;
    }
}

.tool-overflow {
    @include flex-center-all;

    flex: 0 0 auto;
    height: 1.8em;
    padding: $space-3 $space-3;
    font-family: $secondary-font-stack;
    font-size: 1.2em;
    color: $color-text-primary;
    white-space: nowrap;
    background-color: color-mix(in srgb, $color-primary 18%, transparent);
    border-radius: $radius-sm;
}

.tool-overflow-button {
    min-width: 24px;
    min-height: 24px;
    appearance: none;
    cursor: pointer;
    border: 0;

    @include interactive {
        background-color: color-mix(in srgb, $color-primary 32%, transparent);
    }

    &:focus-visible {
        outline: 2px solid $color-primary-light;
        outline-offset: 2px;
    }
}

.demo-video {
    width: 100%;
    max-width: 50em;
    aspect-ratio: 16 / 9;
    margin: $space-3 auto;
    border-radius: $radius-md;

    @include bp-xsm-phone {
        width: 95%;
    }

    @include bp-sm-phone {
        width: 90%;
    }
}

.selected-description {
    gap: $space-2;
    padding: $space-2 0 $space-2 $space-4;
    margin: 0;
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;

    @include bp-sm-phone {
        padding: $space-3 0 0 $space-5;
        font-size: 1.6em;
    }
}

:deep(.see-more) {
    gap: $space-2;
    border-width: 1px;

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
                gap: $space-2;
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
        gap: $space-4;
        font-size: 1.1em;
    }

    a:hover :deep(button) svg {
        @include theme-dark {
            fill: lighten-color($color-text-muted, 15%) !important;
        }

        @include theme-light {
            fill: $color-primary-darker !important;
        }
    }

    a:nth-child(3):hover :deep(button) svg {
        fill: transparent !important;
    }
}
</style>
