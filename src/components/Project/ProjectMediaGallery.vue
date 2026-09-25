<script setup>
import { computed, ref, useId, watch } from 'vue';
import ProjectDemoVideo from '@/components/Project/ProjectDemoVideo.vue';
import SelectedWindow from '@/components/SelectedWindow.vue';
import ChevronIcon from '@/components/SVGs/ChevronIcon.vue';

const props = defineProps({
    project: { required: true, type: Object },
    autoplay: { default: false, type: Boolean },
    expanded: { default: false, type: Boolean },
});

const images = import.meta.glob('../../assets/images/**/*.{png,jpg,jpeg,webp,avif,svg}', {
    eager: true,
    import: 'default',
    query: '?url',
});

const slides = computed(() => {
    // Gallery entries use { src, alt }; src can be an asset filename or a public URL.
    const screenshots =
        props.project.gallery ??
        (props.project.preview ? [{ src: props.project.preview, alt: props.project.previewAlt }] : []);

    return [
        ...screenshots.map((image) => ({
            ...image,
            src: images[`../../assets/images/${image.src}`] ?? image.src,
            type: 'image',
        })),
        ...(props.project.video ? [{ type: 'video' }] : []),
    ];
});

const activeIndex = defineModel('activeIndex', { default: 0, type: Number });
const isExpanded = ref(false);
const expandButton = ref(null);
const imageRatio = ref(props.project.portrait ? 9 / 16 : 16 / 9);
const activeSlide = computed(() => slides.value[activeIndex.value]);
const mediaRatio = computed(() =>
    activeSlide.value?.type === 'image' ? imageRatio.value : props.project.portrait ? 9 / 16 : 16 / 9,
);
const hasNavigation = computed(() => slides.value.length > 1);
const slideId = useId();
let swipeStart;
let ignoreClickUntil = 0;

function startSwipe(event) {
    cancelSwipe();
    ignoreClickUntil = 0;
    if (!hasNavigation.value || event.pointerType !== 'touch' || !event.isPrimary) return;

    swipeStart = { id: event.pointerId, x: event.clientX, y: event.clientY, horizontal: false };
}

function moveSwipe(event) {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;

    const x = Math.abs(event.clientX - swipeStart.x);
    const y = Math.abs(event.clientY - swipeStart.y);
    if (!swipeStart.horizontal) {
        if (Math.max(x, y) < 8) return;
        if (y >= x) return cancelSwipe();
        swipeStart.horizontal = true;
    }
}

function endSwipe(event) {
    if (!swipeStart || event.pointerId !== swipeStart.id) return;

    const { x, y, horizontal } = swipeStart;
    cancelSwipe();
    if (!horizontal) return;

    // A swipe must not also activate the image or a gallery button on release.
    ignoreClickUntil = performance.now() + 500;
    const distance = event.clientX - x;
    if (Math.abs(distance) >= 48 && Math.abs(distance) > Math.abs(event.clientY - y)) {
        changeSlide(distance < 0 ? 1 : -1);
    }
}

function cancelSwipe() {
    swipeStart = undefined;
}

function ignoreSwipeClick(event) {
    if (event.detail > 0 && performance.now() < ignoreClickUntil) {
        event.preventDefault();
        event.stopPropagation();
    }
}

watch(
    [() => props.project, () => props.autoplay],
    () => {
        if (props.expanded) return;
        activeIndex.value = props.autoplay && props.project.video ? slides.value.length - 1 : 0;
    },
    { immediate: true },
);

function changeSlide(direction) {
    activeIndex.value = (activeIndex.value + direction + slides.value.length) % slides.value.length;
}

function showVideo() {
    if (props.project.video) activeIndex.value = slides.value.length - 1;
}

function enlarge() {
    expandButton.value.focus({ preventScroll: true });
    isExpanded.value = true;
}

function onImageLoad(event) {
    const { naturalWidth, naturalHeight } = event.target;
    if (naturalHeight) imageRatio.value = naturalWidth / naturalHeight;
}

defineExpose({ showVideo });

function onKeydown(event) {
    if (!hasNavigation.value || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;

    event.preventDefault();
    event.stopPropagation();

    if (event.key === 'Home') activeIndex.value = 0;
    else if (event.key === 'End') activeIndex.value = slides.value.length - 1;
    else changeSlide(event.key === 'ArrowRight' ? 1 : -1);
}
</script>

<template>
    <div
        v-if="activeSlide"
        class="project-gallery"
        :class="{ 'has-navigation': hasNavigation, 'is-portrait': project.portrait, 'is-expanded': expanded }"
        :style="expanded ? { '--media-ratio': mediaRatio } : undefined"
        role="group"
        aria-roledescription="carousel"
        :aria-label="`${project.title} media`"
        data-testid="project-gallery"
        @keydown="onKeydown"
        @pointerdown="startSwipe"
        @pointermove="moveSwipe"
        @pointerup="endSwipe"
        @pointercancel="cancelSwipe"
        @click.capture="ignoreSwipeClick"
    >
        <div class="gallery-stage">
            <div
                :id="slideId"
                class="gallery-slide"
                role="group"
                aria-roledescription="slide"
                :aria-label="`${activeIndex + 1} of ${slides.length}`"
            >
                <ProjectDemoVideo
                    v-if="activeSlide.type === 'video' && !isExpanded"
                    :project="project"
                    :autoplay="autoplay"
                />
                <component
                    v-else-if="activeSlide.type === 'image'"
                    :is="expanded ? 'div' : 'button'"
                    class="gallery-image-button"
                    :type="expanded ? undefined : 'button'"
                    :aria-label="expanded ? undefined : 'Enlarge image'"
                    :aria-haspopup="expanded ? undefined : 'dialog'"
                    data-testid="enlarge-image"
                    @click.stop="!expanded && enlarge()"
                >
                    <img
                        :key="activeSlide.src"
                        class="gallery-image"
                        :src="activeSlide.src"
                        :alt="activeSlide.alt"
                        @load="onImageLoad"
                    />
                </component>
            </div>

            <template v-if="hasNavigation">
                <button
                    v-for="direction in [-1, 1]"
                    :key="direction"
                    class="gallery-arrow"
                    :class="direction === -1 ? 'previous' : 'next'"
                    type="button"
                    :aria-label="direction === -1 ? 'Previous media' : 'Next media'"
                    :aria-controls="slideId"
                    @click.stop="changeSlide(direction)"
                >
                    <ChevronIcon aria-hidden="true" />
                </button>
            </template>
        </div>

        <div v-if="hasNavigation || !expanded" class="gallery-controls">
            <div v-if="hasNavigation" class="gallery-indicators" role="group" aria-label="Choose media">
                <button
                    v-for="(slide, index) in slides"
                    :key="index"
                    class="gallery-indicator"
                    type="button"
                    :aria-label="slide.type === 'video' ? 'Show demo video' : `Show image ${index + 1}`"
                    :aria-current="activeIndex === index ? 'true' : undefined"
                    :aria-controls="slideId"
                    @click.stop="activeIndex = index"
                >
                    <svg v-if="slide.type === 'video'" viewBox="0 0 163.861 163.861" aria-hidden="true">
                        <path
                            d="M34.857 3.613C20.084-4.861 8.107 2.081 8.107 19.106v125.637c0 17.042 11.977 23.975 26.75 15.509L144.67 97.275c14.778-8.477 14.778-22.211 0-30.686z"
                        />
                    </svg>
                    <span v-else class="gallery-dot" aria-hidden="true"></span>
                </button>
            </div>
            <button
                v-if="!expanded"
                ref="expandButton"
                class="gallery-expand"
                type="button"
                aria-label="Enlarge media"
                aria-haspopup="dialog"
                title="View larger"
                data-testid="enlarge-media"
                @click.stop="enlarge"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">
                    <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
                </svg>
            </button>
        </div>
        <span class="gallery-status" aria-live="polite" aria-atomic="true">
            {{ activeSlide.type === 'video' ? 'Demo video' : 'Image' }} {{ activeIndex + 1 }} of {{ slides.length }}
        </span>

        <Teleport to="body">
            <SelectedWindow
                v-if="isExpanded"
                :label="`${project.title} — enlarged media`"
                fullscreen
                show-close-button
                data-testid="media-viewer"
                @close="isExpanded = false"
            >
                <ProjectMediaGallery
                    v-model:active-index="activeIndex"
                    :project="project"
                    :autoplay="autoplay"
                    expanded
                />
            </SelectedWindow>
        </Teleport>
    </div>
</template>

<style lang="scss" scoped>
.project-gallery {
    --gallery-controls-height: 0px;

    width: 100%;
    min-width: 0;

    &.has-navigation {
        --gallery-controls-height: 2.5rem;

        touch-action: pan-y pinch-zoom;
    }
}

.gallery-stage {
    position: relative;
    aspect-ratio: 16 / 9;
}

.is-portrait .gallery-stage {
    aspect-ratio: 9 / 16;
}

.gallery-slide {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background-color: $color-bg-secondary;
    border-radius: $radius-md;
}

.gallery-image,
.demo-video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
}

.gallery-image-button {
    display: block;
    width: 100%;
    height: 100%;
    padding: 0;
    cursor: zoom-in;
    background: transparent;
    border: 0;

    &:focus-visible {
        outline: 2px solid $color-primary;
        outline-offset: -3px;
    }
}

.is-expanded {
    width: min(100%, calc((100dvh - 6rem - var(--gallery-controls-height)) * var(--media-ratio)));
    margin: 0;

    &.has-navigation {
        --gallery-controls-height: 3.5rem;
    }

    .gallery-stage {
        aspect-ratio: var(--media-ratio);
    }

    .gallery-image-button {
        cursor: default;
    }

    .gallery-arrow {
        top: calc(100% + $space-3);
        width: 2.75rem;
        height: 2.75rem;
        padding: $space-3;
        background-color: transparent;
        box-shadow: none;
        transform: none;

        &.previous {
            right: auto;
            left: 0;
        }

        &.next {
            right: 0;
            left: auto;

            @include bp-md-tablet {
                right: auto;
                left: 3rem;
            }
        }
    }

    .gallery-controls {
        @include flex-center-all;

        min-height: 2.75rem;
        margin-top: $space-3;
    }

    .gallery-indicators {
        padding-inline: 3.25rem;

        @include bp-md-tablet {
            padding-inline: 6rem;
        }
    }
}

.gallery-arrow,
.gallery-indicator,
.gallery-expand {
    display: grid;
    place-items: center;
    width: 1.75rem;
    height: 1.75rem;
    padding: 0;
    color: $color-accent-dark;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: $radius-round;
    transition:
        color 0.15s ease,
        background-color 0.15s ease;

    svg {
        width: 1rem;
        height: 1rem;
        fill: currentcolor;
    }

    &:focus-visible {
        outline: 2px solid $color-primary;
        outline-offset: 2px;
    }

    @include interactive {
        color: $color-text-primary;
    }
}

.gallery-arrow {
    position: absolute;
    top: 50%;
    z-index: 2;
    color: lighten-color($color-accent-dark, 10%);
    background-color: $color-bg-primary;
    box-shadow: 0 1px 6px rgb(0 0 0 / 18%);
    transform: translateY(-50%);

    &.previous {
        left: -1rem;

        svg {
            transform: rotate(180deg);
        }
    }

    &.next {
        right: -1rem;
    }

    @include bp-custom-max(332) {
        &.previous {
            left: -0.5rem;
        }

        &.next {
            right: -0.5rem;
        }
    }

    @include bp-sm-phone {
        width: 1.5rem;
        background-color: transparent;
        box-shadow: none;

        &.previous {
            right: 101%;
            left: auto;
        }

        &.next {
            right: auto;
            left: 101%;
        }

        svg {
            transition: scale 0.15s ease;
        }

        @include interactive {
            background-color: transparent;

            svg {
                scale: 1.15;
            }
        }

        &:active svg {
            scale: 0.9;
        }
    }

    @include bp-md-tablet {
        top: calc(100% + $space-2);
        width: 1.75rem;
        transform: none;

        &.previous {
            right: auto;
            left: 0;
        }

        &.next {
            right: auto;
            left: 2rem;
        }
    }
}

.gallery-controls {
    position: relative;
    min-height: 1.75rem;
    margin-top: $space-2;
}

.gallery-indicators {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    padding-inline: 2rem;

    @include bp-md-tablet {
        padding-inline: 4rem;
    }
}

.gallery-expand {
    position: absolute;
    top: 0;
    right: 0;

    &::after {
        position: absolute;
        inset: -0.5rem;
        content: '';
    }

    svg {
        fill: none;
        transition: scale 0.15s ease;
    }

    @include interactive {
        svg {
            scale: 1.15;
        }
    }

    &:active svg {
        scale: 0.9;
    }
}

.gallery-arrow,
.gallery-expand {
    @include theme-light {
        color: $color-gray6;

        @include interactive {
            color: $color-text-primary;
        }
    }
}

.gallery-indicator {
    &[aria-current='true'] {
        color: $color-text-secondary;

        @include theme-light {
            color: $color-primary-darker;
        }
    }

    svg {
        width: 0.7rem;
        height: 0.7rem;
    }
}

.gallery-dot {
    width: 0.4rem;
    height: 0.4rem;
    background: currentcolor;
    border-radius: $radius-round;
}

.gallery-status {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
}

@media (prefers-reduced-motion: reduce) {
    .gallery-arrow,
    .gallery-arrow svg,
    .gallery-indicator,
    .gallery-expand,
    .gallery-expand svg {
        transition: none;
    }
}
</style>
