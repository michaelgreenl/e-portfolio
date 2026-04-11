<script setup>
import { ref } from 'vue';
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';

import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';
import CloseIcon from '@/components/SVGs/CloseIcon.vue';

const props = defineProps({
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
            <div class="selected-header">
                <div>
                    <CalendarIcon />
                    <p>{{ activeProject.longDate }}</p>
                </div>

                <Button :onClick="() => emit('close-project')" preset="secondary" :iconRight="CloseIcon" />
            </div>

            <div class="selected-body">
                <div class="selected-img-container" v-if="activeProject.video">
                    <iframe
                        :src="`https://player.vimeo.com/video/${activeProject.video}?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479&amp;autoplay=${autoplayVideo ? '1' : '0'}&amp;muted=1`"
                        frameborder="0"
                        allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                        referrerpolicy="strict-origin-when-cross-origin"
                        title="game-lobby-demo-vid"
                    ></iframe>
                </div>

                <div class="selected-info">
                    <div class="selected-info-header" :class="`info-header-${activeProject.slug}`">
                        <component :is="projectLogos[activeProject.slug]" class="project-logo" />
                        <h2 :style="{ fontFamily: activeProject.fontFamily }">
                            {{ activeProject.title }}
                        </h2>

                        <div class="external-links external-links-selected">
                            <template v-for="(link, key) in activeProject.externalLinks" :key="link">
                                <a v-if="key !== 'demoVideo'" :href="link.href" target="_blank">
                                    <Button :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                                </a>
                            </template>
                        </div>
                    </div>

                    <div class="selected-tool-chips" :class="`tool-chips-${activeProject.slug}`">
                        <ToolChip v-for="tool in activeProject.stack" :key="tool" :tool="tool" class="chip" />
                    </div>

                    <ul class="selected-description">
                        <li v-for="description in activeProject.description?.long" :key="description">
                            {{ description }}
                        </li>
                    </ul>
                </div>
            </div>
        </div>
        <div ref="overlay" class="overlay" @click="emit('close-project')"></div>
    </div>
</template>

<style lang="scss" scoped>
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
    backdrop-filter: blur(5px);
    backdrop-filter: blur(5px);
    @include flexCenterAll;

    @include theme-dark {
        background-color: rgb(0 0 0 / 40%);
    }
}

.selected-project {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    max-width: 61em;
    padding: $size-5 $size-8;
    margin: 0 $size-4 $size-12;
    border: 1px solid rgb(255 255 255 / 12%);
    border-radius: 20px;
    box-shadow: 0 8px 32px 0 rgb(0 0 0 / 37%);

    @include bp-custom-min(450) {
        padding: $size-8 $size-10;
    }

    @include bp-md-tablet {
        max-width: 72em;
        margin: $size-8 0;
    }

    @include theme-dark {
        background: linear-gradient(0deg, #212529ea 30%, #212529aa 60%, #212529ea 90%);
    }

    @include theme-light {
        background: linear-gradient(0deg, #dee2e6ea 40%, #dee2e6aa 60%, #dee2e6ea 90%);
    }
}

.selected-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-left: 0.75em;

    div {
        display: flex;
        gap: $size-2;
        align-items: center;
        font-size: 1.45em;

        svg {
            height: 1.1em;
            stroke: $color-text-secondary;
        }
    }

    :deep(button) {
        gap: 0;
        padding: $size-3;
        font-size: 1.2em;
        border-radius: 100%;
        @include flexCenterAll;

        svg {
            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%);
            }

            @include theme-light {
                fill: darken-color($color-text-muted, 40%);
            }
        }

        @include interactive {
            @include theme-dark {
                background-color: #49505730;
            }

            @include theme-light {
                background-color: #49505710;
            }
        }

        &::after {
            display: none !important;
        }
    }
}

.selected-img-container {
    position: relative;
    @include flexCenterAll;

    margin: $size-2 0;

    @include bp-sm-phone {
        margin: 0;
    }

    iframe {
        width: 90%;
        max-width: 65em;
        aspect-ratio: 2/1.1;
        margin: $size-4 0 $size-8;
        border: 1px solid $color-bg-secondary;
        border-radius: 12px;
        box-shadow: 0 8px 16px 0 rgb(0 0 0 / 37%);
    }
}

.selected-info {
    display: flex;
    flex-direction: column;
    margin-top: -$size-3;
}

.selected-info-header {
    display: flex;
    gap: $size-2;
    align-items: center;
    margin-top: $size-4;
    font-size: 1.35em;

    @include bp-xsm-phone {
        margin-top: 0;
    }

    &-algo-visualizer {
        gap: $size-1 !important;
    }

    .project-logo {
        display: flex;
        align-items: center;
        height: 2.2em;

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

        @include bp-custom-min(450) {
            font-size: 2.2em;
        }

        @include bp-sm-phone {
            font-size: 2.4em !important;
        }
    }
}

.selected-tool-chips {
    @include flexCenterAll;

    flex-wrap: wrap;
    gap: $size-4;
    height: $size-10;
    margin-top: $size-3;
    overflow: hidden;
    font-size: 1.1em;

    .chip {
        flex: 1;
        height: 1.8em;
        font-size: 1.2em;
    }

    &-algo-visualizer {
        :deep(.chip-container) {
            max-width: none !important;
        }
    }
}

.selected-description {
    display: flex;
    flex-direction: column;
    gap: $size-2;
    padding: $size-3 $size-5 $size-2;
    margin: $size-2 0;
    font-family: $secondary-font-stack;
    font-size: 1.5em;
    color: $color-text-secondary;
    border-top: solid 1px $color-text-muted;
}
</style>
