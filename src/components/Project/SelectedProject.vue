<script setup>
import { ref } from 'vue';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';
import ProjectDemoVideo from '@/components/Project/ProjectDemoVideo.vue';

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
                <ProjectDemoVideo v-if="activeProject.video" :project="activeProject" :autoplay="autoplayVideo" />

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
    @include flex-center-all;
}

.project-title,
.tool-chips,
.date {
    display: flex;
    align-items: center;
}

.overlay {
    position: fixed;
    inset: 0;
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
    top: $space-3;
    right: $space-4;
    z-index: 100;
    width: $size-10;
    height: $size-10;
    padding: $space-3;
    font-size: 1.2em;
    outline: 0;
    background: transparent;
    border: 0;
    border-radius: $radius-round;

    @include bp-xl-desktop {
        top: $space-4;
        right: $space-5;
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
    gap: $space-2;
    width: 95vw;
    max-width: 85em;
    max-height: 95dvh;
    padding: $space-10 $space-12;
    margin: $space-8 0;
    overflow-y: auto;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: $radius-xl;
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
    gap: $space-8;
}

.project-header-info {
    display: flex;
    flex-direction: column !important;
}

.project-title {
    gap: $space-2;
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
    gap: $space-10;
    padding: $space-8 0;
    margin: $space-4 0;
    border-top: solid 1px $color-text-muted;
    border-bottom: solid 1px $color-text-muted;

    @include bp-lg-laptop {
        gap: $space-12;
    }
}

.demo-video {
    align-self: center;
    width: 45%;
    border-radius: $radius-md;
}

.project-footer {
    display: flex;
    justify-content: space-between;
    padding: 0 $space-2;
}

.external-links {
    display: flex;
    gap: $space-6;
    font-size: 1.5em;

    a {
        &:deep(button) {
            @include bp-md-tablet {
                gap: $space-2;
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
                stroke-width: 2;
                transition: fill 0.3s ease-in-out;

                @include theme-dark {
                    stroke: lighten-color($color-text-muted, 15%);
                }

                @include theme-light {
                    stroke: $color-primary-darker;
                }
            }
        }

        &:hover :deep(button) svg {
            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%) !important;
            }

            @include theme-light {
                fill: $color-primary-darker !important;
            }
        }

        &.no-fill:hover :deep(button) svg {
            fill: transparent !important;
        }
    }
}

.tool-container {
    display: flex;
    flex-direction: column;
    gap: $space-8;
    justify-content: center;
    min-width: 46%;
}

.tool-chips {
    flex-wrap: wrap;
    gap: $space-4;
    justify-content: center;
    padding-right: $space-3;
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
    gap: $space-2;
    font-size: 1.3em;
    white-space: nowrap;
}

.description {
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;

    &-short {
        margin: $space-1 0 0;
    }

    &-long {
        display: flex;
        flex: 1.2;
        flex-direction: column;
        gap: $space-2;
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
