<script setup>
import { computed, ref, useId, watch } from 'vue';
import ProjectDemoVideo from '@/components/Project/ProjectDemoVideo.vue';

const props = defineProps({
    project: { required: true, type: Object },
    autoplay: { default: false, type: Boolean },
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

const activeIndex = ref(0);
const activeSlide = computed(() => slides.value[activeIndex.value]);
const hasNavigation = computed(() => slides.value.length > 1);
const slideId = useId();

watch(
    [() => props.project, () => props.autoplay],
    () => {
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
        :class="{ 'has-navigation': hasNavigation, 'is-portrait': project.portrait }"
        role="group"
        aria-roledescription="carousel"
        :aria-label="`${project.title} media`"
        data-testid="project-gallery"
        @keydown="onKeydown"
    >
        <div class="gallery-stage">
            <div
                :id="slideId"
                class="gallery-slide"
                role="group"
                aria-roledescription="slide"
                :aria-label="`${activeIndex + 1} of ${slides.length}`"
            >
                <ProjectDemoVideo v-if="activeSlide.type === 'video'" :project="project" :autoplay="autoplay" />
                <img
                    v-else
                    :key="activeSlide.src"
                    class="gallery-image"
                    :src="activeSlide.src"
                    :alt="activeSlide.alt"
                />
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
                    <svg viewBox="0 0 512 512" aria-hidden="true">
                        <path
                            d="M367.954 213.588 160.67 5.872c-7.804-7.819-20.467-7.831-28.284-.029-7.819 7.802-7.832 20.465-.03 28.284l207.299 207.731c7.798 7.798 7.798 20.486-.015 28.299L132.356 477.873c-7.802 7.819-7.789 20.482.03 28.284A19.93 19.93 0 0 0 146.513 512c5.125 0 10.25-1.958 14.157-5.873l207.269-207.701c23.394-23.394 23.394-61.459.015-84.838"
                        />
                    </svg>
                </button>
            </template>
        </div>

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
        <span class="gallery-status" aria-live="polite" aria-atomic="true">
            {{ activeSlide.type === 'video' ? 'Demo video' : 'Image' }} {{ activeIndex + 1 }} of {{ slides.length }}
        </span>
    </div>
</template>

<style lang="scss" scoped>
.project-gallery {
    --gallery-controls-height: 0px;

    width: 100%;
    min-width: 0;

    &.has-navigation {
        --gallery-controls-height: 2.5rem;
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

.gallery-arrow,
.gallery-indicator {
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

    @include bp-custom-max(449) {
        &.previous {
            left: 0;
        }

        &.next {
            right: 0;
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
}

.gallery-indicators {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    margin-top: $space-3;
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
    .gallery-indicator {
        transition: none;
    }
}
</style>
