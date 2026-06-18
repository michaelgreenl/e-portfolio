<script setup>
import { ref } from 'vue';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';

import CloseIcon from '@/components/SVGs/CloseIcon.vue';

defineProps({
    activeProject: { required: true, type: Object },
    autoplayVideo: { required: true, type: Boolean },
    projectLogos: { required: true, type: Object },
    externalIcons: { required: true, type: Object },
});

const emit = defineEmits(['close-project']);

const el = ref(null);
const overlay = ref(null);

defineExpose({ el, overlay });
</script>

<template>
    <div
        ref="el"
        class="selected-container"
        tabindex="0"
        role="dialog"
        aria-modal="true"
        :aria-label="activeProject.title"
        @keydown.esc="emit('close-project')"
    >
        <button @click="() => emit('close-project')" class="close-btn">
            <CloseIcon />
        </button>
        <div class="selected-project">
            <div class="project-header">
                <div class="project-header-info">
                    <div class="project-title">
                        <component :is="projectLogos[activeProject.slug]" />

                        <h2 :style="{ fontFamily: activeProject.fontFamily }">
                            {{ activeProject.title }}
                        </h2>
                    </div>

                    <p class="description description-short">{{ activeProject.description.short }}</p>
                </div>

                <div class="tool-container">
                    <div class="tool-chips" :class="{ 'large-stack': activeProject.stack.length > 5 }">
                        <ToolChip v-for="tool in activeProject.stack" :key="tool" :tool="tool" class="chip" />
                    </div>
                </div>
            </div>

            <div class="project-body">
                <iframe
                    v-if="activeProject.video"
                    :src="`https://player.vimeo.com/video/${activeProject.video}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=${autoplayVideo ? '1' : '0'}&amp;muted=1`"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                    referrerpolicy="strict-origin-when-cross-origin"
                    :title="activeProject.slug"
                ></iframe>

                <ul class="description description-long" :class="{ 'contains-video': activeProject.video }">
                    <li v-for="description in activeProject.description?.long" :key="description">
                        {{ description }}
                    </li>
                </ul>
            </div>

            <div class="project-footer">
                <div class="external-links">
                    <a
                        v-for="[key, link] in Object.entries(activeProject.externalLinks).filter(
                            ([key]) => key !== 'demoVideo' && key !== 'porfolioLink',
                        )"
                        :key="key"
                        :class="{ 'no-fill': key === 'liveSite' }"
                        :href="link.href"
                        target="_blank"
                    >
                        <Button :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                    </a>
                </div>

                <div class="date">
                    <p>{{ activeProject.longDate }}</p>
                </div>
            </div>
        </div>

        <div ref="overlay" class="overlay" @click="emit('close-project')"></div>
    </div>
</template>

<style lang="scss" scoped>
p {
    margin: 0;
}

.selected-container,
.close-btn {
    @include flexCenterAll;
}

.project-title,
.tool-chips,
.date {
    display: flex;
    align-items: center;
}

.overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    width: 100vw;
    height: 100vh;
}

.selected-container {
    position: fixed;
    top: 0;
    z-index: 2;
    width: 100vw;
    height: 100vh;
    font-size: 1.1em;
    backdrop-filter: blur(5px);

    @include theme-dark {
        background-color: rgb(0 0 0 / 40%);
    }
}

.close-btn {
    position: absolute !important;
    top: $size-3;
    right: $size-4;
    z-index: 100;
    width: $size-10;
    height: $size-10;
    padding: 0.9em;
    font-size: 1.2em;
    background: transparent;
    border: 0;
    border-radius: 100%;
    outline: 0;

    @include bp-xl-desktop {
        top: $size-4;
        right: $size-5;
    }

    svg {
        @include theme-dark {
            fill: $color-gray4 !important;
        }

        @include theme-light {
            fill: $color-gray8 !important;
        }
    }

    @include interactive {
        @include theme-dark {
            background-color: #49505750;
        }

        @include theme-light {
            background-color: #49505710;
        }
    }

    &::after {
        display: none !important;
    }
}

.selected-project {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: $size-2;
    width: 95vw;
    max-width: 94em;
    max-height: 95dvh;
    padding: 2.4em $size-11;
    margin: $size-8 0;
    overflow-y: auto;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 20px;
    box-shadow: 0 8px 32px 0 rgb(0 0 0 / 37%);

    @include theme-dark {
        background: linear-gradient(0deg, #212529ea 30%, #212529aa 60%, #212529ea 90%);
    }

    @include theme-light {
        background: linear-gradient(0deg, #dee2e6ea 40%, #dee2e6aa 60%, #dee2e6ea 90%);
    }
}

.project-header {
    display: flex;
    gap: $size-7;
}

.project-header-info {
    display: flex;
    flex-direction: column !important;
}

.project-title {
    gap: $size-2;
    font-size: 1.2em;

    svg {
        display: flex;
        align-items: center;
        height: clamp(3.7em, 5.5vw, 4em) !important;
        @include theme-dark {
            fill: $color-gray3;
        }

        @include theme-light {
            fill: $color-primary-darker;
        }
    }

    h2 {
        margin: 0 !important;
        font-size: 2em;

        @include theme-dark {
            color: $color-gray3;
        }

        @include theme-light {
            color: $color-primary-darker;
        }

        @include bp-custom-min(450) {
            font-size: 2.2em;
        }

        @include bp-sm-phone {
            font-size: clamp(3.7em, 5.5vw, 4em) !important;
        }
    }
}

.project-body {
    display: flex;
    gap: $size-9;
    padding: $size-8 0;
    margin: $size-4 0;
    border-top: solid 1px $color-text-muted;
    border-bottom: solid 1px $color-text-muted;

    @include bp-lg-laptop {
        gap: $size-10;
    }
}

iframe {
    width: 45%;
    aspect-ratio: 2/1.1;
}

.project-footer {
    display: flex;
    justify-content: space-between;
    padding: 0 $size-2;
}

.external-links {
    display: flex;
    gap: $size-6;
    font-size: 1.5em;

    a {
        &:deep(button) {
            @include bp-md-tablet {
                gap: $size-2;
            }

            span {
                display: none;

                @include bp-md-tablet {
                    display: block !important;
                }
            }

            svg {
                height: $size-6;
                fill: rgb(0 0 0 / 0%) !important;
                stroke: currentcolor;
                stroke-width: 2;
                transition: fill 0.3s ease-in-out;
            }
        }
    }

    .no-fill {
        &:deep(button) svg {
            fill: currentcolor !important;
            stroke-width: 0 !important;
        }
    }

    a:hover :deep(button) svg {
        fill: currentcolor !important;
    }
}

.tool-container {
    display: flex;
    flex-direction: column;
    gap: 2em;
    justify-content: center;
    min-width: 46%;
}

.tool-chips {
    flex-wrap: wrap;
    gap: $size-4;
    justify-content: center;
    padding-right: $size-3;
    font-size: 1.2em;

    .chip {
        flex: 1;
        font-size: 1.2em;
    }

    &.large-stack {
        font-size: 1.1em;
    }
}

.date {
    gap: $size-2;
    font-size: 1.3em;
    white-space: nowrap;
}

.description {
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;

    &-short {
        margin: $size-1 0 0;
    }

    &-long {
        display: flex;
        flex: 1.2;
        flex-direction: column;
        gap: $size-2;
        justify-content: center;
        margin: 0;
        line-height: 2ch;

        &.contains-video {
            padding: 0;
            font-size: clamp(1.3em, 1.7vw, 1.4em);
        }
    }
}
</style>
