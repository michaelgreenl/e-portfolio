<script setup>
import { ref } from 'vue';
import SelectedWindow from '@/components/SelectedWindow.vue';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';
import ProjectDemoVideo from '@/components/Project/ProjectDemoVideo.vue';

import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';
import CloseIcon from '@/components/SVGs/CloseIcon.vue';

defineProps({
    activeProject: { required: true, type: Object },
    autoplayVideo: { default: false, type: Boolean },
    projectLogos: { default: () => ({}), type: Object },
    externalIcons: { default: () => ({}), type: Object },
    fullscreenOnMobile: { default: false, type: Boolean },
});

const previews = import.meta.glob('../../assets/images/*-preview.jpg', {
    eager: true,
    import: 'default',
    query: '?url',
});

const emit = defineEmits(['close-project']);

const selectedWindow = ref(null);
const close = () => selectedWindow.value.close();

defineExpose({ close });
</script>

<template>
    <SelectedWindow
        ref="selectedWindow"
        :label="activeProject.title"
        :fullscreen-on-mobile="fullscreenOnMobile"
        :trap-focus="fullscreenOnMobile"
        @close="emit('close-project')"
    >
        <div
            class="selected-project"
            :class="{ portrait: activeProject.portrait, oakley: activeProject.slug === 'oakley' }"
        >
            <div class="project-overview">
                <div v-if="activeProject.longDate" class="date">
                    <CalendarIcon aria-hidden="true" />
                    <p>{{ activeProject.longDate }}</p>
                </div>

                <div class="project-header-info">
                    <div class="project-title">
                        <component :is="projectLogos[activeProject.slug]" />

                        <h2 :style="{ fontFamily: activeProject.fontFamily }">
                            {{
                                activeProject.slug === 'oakley'
                                    ? activeProject.title.replace(' / ', ' /\n')
                                    : activeProject.title
                            }}
                        </h2>
                    </div>

                    <p class="description description-short">{{ activeProject.description.short }}</p>
                </div>

                <div class="project-media">
                    <ProjectDemoVideo v-if="activeProject.video" :project="activeProject" :autoplay="autoplayVideo" />
                    <img
                        v-else-if="activeProject.preview"
                        class="demo-video project-preview"
                        :src="previews[`../../assets/images/${activeProject.preview}`]"
                        :alt="activeProject.previewAlt"
                        width="540"
                        height="960"
                    />

                    <div v-if="activeProject.externalLinks" class="external-links">
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
                <button class="close-btn" type="button" aria-label="Close project" @click="close">
                    <CloseIcon />
                </button>

                <div class="tool-container">
                    <div class="tool-chips" :class="{ 'large-stack': activeProject.stack.length > 5 }">
                        <ToolChip v-for="tool in activeProject.stack" :key="tool" :tool="tool" class="chip" />
                    </div>
                </div>

                <ul
                    class="description description-long"
                    :class="{ 'contains-video': activeProject.video || activeProject.preview }"
                >
                    <li v-for="detail in activeProject.description?.long" :key="detail.label">
                        <strong>{{ detail.label }}:</strong> {{ detail.text }}
                    </li>
                </ul>
            </div>
        </div>
    </SelectedWindow>
</template>

<style lang="scss" scoped>
p {
    margin: 0;
}

.project-title,
.tool-chips {
    display: flex;
    align-items: center;
}

.selected-project {
    display: grid;
    grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
    gap: $space-3 $space-6;

    @include bp-lg-laptop {
        column-gap: $space-10;
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

.project-preview {
    height: auto;
    object-fit: contain;
}

.portrait .demo-video {
    align-self: center;
    width: min(100%, calc(60dvh * 9 / 16));
    aspect-ratio: 9 / 16;
}

.selected-project.oakley {
    .project-title h2 {
        white-space: pre-line;
    }

    .project-media {
        padding-top: $space-2;
    }

    .demo-video {
        width: min(100%, 37.75dvh);
    }

    .description-long {
        padding-left: $space-3;
    }

    @include bp-custom-min(848) {
        position: relative;
        grid-template:
            'date .' auto
            'heading media' auto
            'stack media' auto
            'description media' 1fr / minmax(0, 1.2fr) minmax(0, 0.8fr);
        align-items: start;

        .project-overview,
        .project-details {
            display: contents;
        }

        .date {
            grid-area: date;
            margin-bottom: 0;
        }

        .project-header-info {
            grid-area: heading;
        }

        .project-media {
            grid-area: media;
            margin-top: 0;
        }

        .tool-container {
            grid-area: stack;
            margin-top: $space-1;
        }

        .description-long {
            grid-area: description;
            margin-top: $space-2;
        }

        .close-btn {
            position: absolute;
            top: 0;
            right: 0;
        }
    }
}

.fullscreen-mobile {
    .project-details {
        gap: $space-6;
        justify-content: flex-start;
    }

    .description {
        line-height: 1.5;
    }

    .description-long {
        margin-top: 0;
    }

    @include bp-custom-max(847) {
        .selected-project {
            grid-template-columns: minmax(0, 1fr);
            gap: $space-6;
        }

        .project-overview {
            grid-row: 2;
        }

        .project-title h2 {
            font-size: clamp(1.75rem, 5vw, 2.75rem) !important;
        }

        .description,
        .description-long.contains-video {
            font-size: 1rem;
        }

        .tool-chips {
            font-size: 1rem;

            .chip {
                font-size: 1em;
            }
        }

        .project-details {
            display: contents;
        }

        .close-btn {
            position: sticky;
            top: env(safe-area-inset-top, 0);
            z-index: 3;
            grid-row: 1;
            justify-self: end;
            width: 2.75rem;
            height: 2.75rem;
            padding: $space-3;
            background-color: $color-bg-primary;
            transform: none;
        }

        .tool-container {
            grid-row: 3;
        }

        .description-long {
            grid-row: 4;
        }

        .selected-project.oakley {
            .date {
                font-size: 0.875rem;
            }

            .project-title h2 {
                font-size: clamp(2rem, 6vw, 3rem) !important;
                white-space: normal;
            }
        }
    }
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
