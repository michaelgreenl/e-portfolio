<script setup>
import { ref } from 'vue';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';
import ProjectDemoVideo from '@/components/Project/ProjectDemoVideo.vue';

import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';
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
        <div class="selected-project">
            <div class="project-overview">
                <div class="date">
                    <CalendarIcon aria-hidden="true" />
                    <p>{{ activeProject.longDate }}</p>
                </div>

                <div class="project-header-info">
                    <div class="project-title">
                        <component :is="projectLogos[activeProject.slug]" />

                        <h2 :style="{ fontFamily: activeProject.fontFamily }">
                            {{ activeProject.title }}
                        </h2>
                    </div>

                    <p class="description description-short">{{ activeProject.description.short }}</p>
                </div>

                <div class="project-media">
                    <ProjectDemoVideo v-if="activeProject.video" :project="activeProject" :autoplay="autoplayVideo" />

                    <div class="external-links">
                        <a
                            v-for="[key, link] in Object.entries(activeProject.externalLinks).filter(
                                ([key]) => key !== 'demoVideo' && key !== 'porfolioLink',
                            )"
                            :key="key"
                            :class="{ 'no-fill': key === 'liveSite' }"
                            :href="link.href"
                            :aria-label="link.text"
                            :title="link.text"
                            target="_blank"
                        >
                            <Button :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                        </a>
                    </div>
                </div>
            </div>

            <div class="project-details">
                <button class="close-btn" type="button" aria-label="Close project" @click="emit('close-project')">
                    <CloseIcon />
                </button>

                <div class="tool-container">
                    <div class="tool-chips" :class="{ 'large-stack': activeProject.stack.length > 5 }">
                        <ToolChip v-for="tool in activeProject.stack" :key="tool" :tool="tool" class="chip" />
                    </div>
                </div>

                <ul class="description description-long" :class="{ 'contains-video': activeProject.video }">
                    <li v-for="detail in activeProject.description?.long" :key="detail.label">
                        <strong>{{ detail.label }}:</strong> {{ detail.text }}
                    </li>
                </ul>
            </div>
        </div>

        <div ref="overlay" class="overlay" @click="emit('close-project')"></div>
    </div>
</template>

<style lang="scss" scoped>
p {
    margin: 0;
}

.selected-container {
    @include flex-center-all;
}

.project-title,
.tool-chips {
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

.selected-project {
    position: relative;
    z-index: 2;
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
    gap: $space-3 $space-6;
    width: 98vw;
    max-width: 90em;
    max-height: 95dvh;
    padding: $size-9 $size-10;
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

    @include bp-lg-laptop {
        column-gap: $space-10;
        padding: $size-9 $size-12;
    }
}

.project-overview,
.project-details,
.project-media {
    display: flex;
    flex-direction: column;
    min-width: 0;
}

.project-details {
    justify-content: space-evenly;
}

.close-btn {
    @include flex-center-all;

    align-self: flex-end;
    width: 2.25rem;
    height: 2.25rem;
    padding: 0.8em;
    color: $color-text-secondary;
    background: transparent;
    border: 0;
    border-radius: $radius-round;
    transform: translate(5px, -9px);

    svg {
        width: 100%;
        height: 100%;
        fill: currentcolor;
    }

    @include interactive {
        background-color: rgb(73 80 87 / 20%);
    }
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
        line-height: 0.95;
        text-wrap: balance;

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

.project-media,
.description-long {
    margin-top: $space-6;
}

.project-media {
    flex: 1;
    gap: $space-8;
}

.demo-video {
    width: 100%;
    border-radius: $radius-md;
}

.external-links {
    display: flex;
    gap: $space-4;
    margin-top: auto;
    font-size: 1.5em;

    a {
        min-width: 0;

        &:deep(button) {
            white-space: nowrap;

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
    min-width: 0;
}

.tool-chips {
    flex-wrap: wrap;
    gap: $space-4;
    justify-content: center;
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
    display: flex;
    gap: $space-2;
    align-items: center;
    margin-bottom: $size-2;
    font-size: 1.4em;
    white-space: nowrap;

    svg {
        width: $size-4;
        height: $size-4;
        stroke: $color-text-secondary;
    }
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
        flex-direction: column;
        gap: $space-2;
        padding-left: $space-6;
        margin-bottom: 0;
        line-height: 2ch;

        &.contains-video {
            font-size: clamp(1.3em, 1.7vw, 1.4em);
        }

        strong {
            font-family: $secondary-font-stack;
            font-weight: 700;
        }
    }
}
</style>
