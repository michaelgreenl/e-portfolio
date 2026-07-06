<script setup>
import { computed, onUnmounted, shallowRef, watch } from 'vue';

const props = defineProps({
    project: { required: true, type: Object },
    autoplay: { default: false, type: Boolean },
});

const projectImages = import.meta.glob('../../assets/images/*_blurred.webp', {
    eager: true,
    import: 'default',
    query: '?url',
});

const isLoaded = shallowRef(false);
let loadTimer;

const videoSrc = computed(() => {
    if (!props.project.video) return undefined;

    return `https://player.vimeo.com/video/${props.project.video}?badge=0&autopause=0&player_id=0&app_id=58479&autoplay=${props.autoplay ? '1' : '0'}&muted=1`;
});

const posterSrc = computed(() => {
    if (!props.project.img) return undefined;

    return projectImages[`../../assets/images/${props.project.img}`];
});

const videoTitle = computed(() => `${props.project.slug}-demo-vid`);

function clearLoadTimer() {
    if (!loadTimer) return;

    window.clearTimeout(loadTimer);
    loadTimer = undefined;
}

function onFrameLoad() {
    clearLoadTimer();

    loadTimer = window.setTimeout(() => {
        isLoaded.value = true;
        loadTimer = undefined;
    }, 160);
}

watch(
    videoSrc,
    () => {
        clearLoadTimer();
        isLoaded.value = false;
    },
    { immediate: true },
);

onUnmounted(clearLoadTimer);
</script>

<template>
    <div class="demo-video" :class="{ 'is-loaded': isLoaded }" :aria-busy="!isLoaded">
        <iframe
            v-if="videoSrc"
            class="demo-video-player"
            :src="videoSrc"
            frameborder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            referrerpolicy="strict-origin-when-cross-origin"
            :title="videoTitle"
            @load="onFrameLoad"
        ></iframe>

        <div class="demo-video-placeholder" aria-hidden="true">
            <img v-if="posterSrc" class="demo-video-poster" :src="posterSrc" alt="" />
            <div class="demo-video-loader"></div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.demo-video {
    position: relative;
    aspect-ratio: 16 / 9;
    overflow: hidden;
    background-color: $color-bg-secondary;
    isolation: isolate;

    @include theme-dark {
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 9%);
    }

    @include theme-light {
        box-shadow: inset 0 0 0 1px rgb(0 0 0 / 8%);
    }
}

.demo-video-player,
.demo-video-placeholder,
.demo-video-poster {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
}

.demo-video-player {
    z-index: 2;
    opacity: 0;
    transition: opacity 0.28s ease;
}

.demo-video-placeholder {
    z-index: 3;
    display: grid;
    place-items: center;
    overflow: hidden;
    pointer-events: none;
    opacity: 1;
    transition: opacity 0.28s ease;

    &::after {
        position: absolute;
        inset: 0;
        content: '';

        @include theme-dark {
            background: linear-gradient(135deg, rgb(33 37 41 / 52%), rgb(73 80 87 / 18%)), rgb(33 37 41 / 44%);
        }

        @include theme-light {
            background: linear-gradient(135deg, rgb(248 249 250 / 42%), rgb(173 181 189 / 18%)), rgb(222 226 230 / 36%);
        }
    }
}

.demo-video-poster {
    object-fit: cover;
    opacity: 0.82;
    filter: blur(12px) saturate(0.92);
    transform: scale(1.06);
}

.demo-video-loader {
    z-index: 1;
    width: 2.25em;
    height: 2.25em;
    border: 2px solid rgb(255 255 255 / 24%);
    border-top-color: $color-primary-light;
    border-radius: 50%;
    animation: demo-video-spin 0.9s linear infinite;
}

.demo-video.is-loaded {
    .demo-video-player {
        opacity: 1;
    }

    .demo-video-placeholder {
        opacity: 0;
    }
}

@media (prefers-reduced-motion: reduce) {
    .demo-video-player,
    .demo-video-placeholder {
        transition: none;
    }

    .demo-video-loader {
        animation: none;
    }
}

@keyframes demo-video-spin {
    to {
        transform: rotate(1turn);
    }
}
</style>
