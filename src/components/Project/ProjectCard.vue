<script setup>
import Button from '@/components/Button.vue';
import ToolChip from '@/components/ToolChip.vue';

import BoxArrowIcon from '@/components/SVGs/BoxArrowIcon.vue';
import CalendarIcon from '@/components/SVGs/CalendarIcon.vue';
import PlayIcon from '@/components/SVGs/PlayIcon.vue';

const props = defineProps({
    project: { required: true, type: Object },
    projectLogos: { required: true, type: Object },
    externalIcons: { required: true, type: Object },
});

const emit = defineEmits(['open-project']);

const getURL = (img) => {
    return new URL(`../assets/images/${img}`, import.meta.url).href;
};
</script>

<template>
    <div
        class="project-card"
        role="button"
        tabindex="0"
        @click="emit('open-project', project)"
        @keydown.enter="emit('open-project', project)"
        @keydown.space.prevent="emit('open-project', project)"
    >
        <div class="card-img-container">
            <Button @click.stop="() => emit('open-project', project, true)" :iconRight="PlayIcon" />
            <img
                :src="getURL(project.img)"
                :alt="'Screenshot of ' + project.title"
                loading="eager"
                class="project-img"
            />
        </div>

        <div class="card-body">
            <div class="card-header">
                <component :is="projectLogos[project.slug]" class="project-logo" />
                <h2 :style="{ fontFamily: project.fontFamily }">
                    {{ project.title }}
                </h2>
                <div class="card-date">
                    <CalendarIcon />
                    <p class="short-date">{{ project.shortDate }}</p>
                    <p class="long-date">{{ project.longDate }}</p>
                </div>
            </div>
            <p class="card-description">{{ project.description.short }}</p>

            <div class="card-tool-chips">
                <ToolChip v-for="tool in project.stack" :key="tool" :tool="tool" class="chip" />
            </div>

            <div class="card-footer">
                <div class="external-links external-links-card">
                    <a
                        v-for="(link, key) in project.externalLinks"
                        :key="link"
                        :href="key === 'demoVideo' ? null : link.href"
                        target="_blank"
                    >
                        <Button
                            v-if="key === 'demoVideo'"
                            @click.stop="() => emit('open-project', project, true)"
                            :text="link.text"
                            :iconLeft="externalIcons[key]"
                            preset="secondary"
                        />

                        <Button v-else :text="link.text" :iconLeft="externalIcons[key]" preset="secondary" />
                    </a>
                </div>

                <Button
                    class="see-more"
                    @click.stop="() => emit('open-project', project, true)"
                    text="See More"
                    :iconRight="BoxArrowIcon"
                    preset="primary"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.project-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: $size-8;
    cursor: pointer;

    &:last-child {
        .card-body .card-header {
            gap: $size-1;
        }
    }

    @include theme-dark {
        &:first-child {
            border-top: solid 1px $color-bg-secondary;
        }

        border-bottom: solid 1px $color-bg-secondary;
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
        padding: $size-4 $size-8;
    }
}

.card-img-container {
    position: relative;
    @include flexCenterAll;
    padding: $size-7;
    aspect-ratio: 1.46/1;
    width: 105%;

    @include bp-sm-phone {
        padding: $size-4;
        width: auto;
        height: 19em;
        aspect-ratio: 1.54/1;
    }

    :deep(button) {
        position: absolute;
        z-index: 1;
        background: transparent;
        border: none;
        transition: transform 0.2s ease;

        @include interactive {
            transform: scale(1.1);
        }

        &:active {
            transform: scale(0.9);
        }

        svg {
            height: $size-12;
            fill: $color-gray3;

            @include bp-xsm-phone {
                height: $size-15;
                margin-top: $size-8;
            }

            @include bp-sm-phone {
                height: $size-12;
                margin-top: 0;
            }
        }
    }
}

.project-img {
    position: relative;
    z-index: 0;
    border-radius: 10px;
    width: 100%;
    height: 100%;
    aspect-ratio: 1.6/1;

    mask-image:
        linear-gradient(to bottom, transparent, black 10%, black 90%, transparent),
        linear-gradient(to right, transparent, black 10%, black 90%, transparent);
    mask-composite: intersect;
    -webkit-mask-image:
        linear-gradient(to bottom, transparent, black 0%, black 98%, transparent),
        linear-gradient(to right, transparent, black 1%, black 98%, transparent);
    -webkit-mask-composite: source-in;

    @include bp-sm-phone {
        width: auto;
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

    .project-logo {
        display: flex;
        align-items: center;
        height: 2.8em;

        @include theme-dark {
            fill: $color-gray3;
        }

        @include theme-light {
            fill: $color-primary-darker;
        }
    }

    h2 {
        margin: 0 !important;
        font-size: 2.1em;

        @include bp-xsm-phone {
            font-size: 2.5em !important;
        }

        @include bp-md-tablet {
            font-size: 2.9em !important;
        }
    }

    div {
        display: flex;
        gap: $size-2;
        align-items: center;
        margin-left: auto;
        font-size: 1.4em;

        @include bp-sm-phone {
            margin-bottom: 1em;
        }

        @include bp-md-tablet {
            margin-bottom: 1.5em;
        }

        @include bp-lg-laptop {
            margin-bottom: 2em;
        }

        svg {
            height: 1.1em;
            stroke: $color-text-secondary;
        }

        .short-date {
            display: flex;

            @include bp-md-tablet {
                display: none;
            }
        }

        .long-date {
            display: none;

            @include bp-md-tablet {
                display: flex;
            }
        }
    }
}

.card-description {
    max-width: 66ch;
    font-size: 1.35em;

    @include bp-xsm-phone {
        font-size: 1.6em;
    }

    @include bp-sm-phone {
        font-size: 1.45em !important;
    }

    @include bp-md-tablet {
        font-size: 1.6em !important;
    }
}

.card-tool-chips {
    display: flex;
    flex-wrap: wrap;
    gap: $size-6;
    align-items: center;
    max-width: 65em;
    height: $size-8;
    margin-top: $size-2;
    overflow: hidden;
    font-size: 1.1em;

    @include bp-md-tablet {
        font-size: 1.2em;
    }

    .chip {
        flex: 1;
        font-size: 1.2em;
    }
}

.card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: $size-4;
    font-size: 1.3em;
}

.see-more {
    gap: 0.6em;
    border-width: 1px;
    border-radius: 7px;

    @include bp-lg-laptop {
        font-size: 1.1em;
    }
}
</style>
