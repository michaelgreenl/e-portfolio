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
    return new URL(`../../assets/images/${img}`, import.meta.url).href;
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

            <div class="card-tool-chips">
                <ToolChip v-for="tool in project.stack" :key="tool" :tool="tool" class="chip" />
            </div>

            <div class="card-footer">
                <div class="external-links external-links-card">
                    <a
                        v-for="(link, key) in project.externalLinks"
                        :class="`${Object.keys(project.externalLinks).length < 3 ? undefined : 'responsive-link-text'}`"
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
p {
    margin: 0;
}

.project-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: $size-6 $size-8;
    cursor: pointer;

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
    justify-content: space-between;
    flex-wrap: wrap-reverse;

    .card-title {
        display: flex;
        align-items: center;
        gap: 0.6em;
        font-size: 1.4em;
        margin-right: $size-4;

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

    .card-header,
    .card-date {
        display: flex;
        gap: $size-2;
        align-items: center;
        margin-left: auto;
        font-size: 1.4em;

        @include bp-sm-phone {
            margin-bottom: 1em;
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
    max-width: 86ch;
    font-size: 1.5em;

    @include bp-sm-phone {
        font-size: 1.7em !important;
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
    font-size: 1.05em;

    @include bp-sm-phone {
        font-size: 1.3em;
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

    @include bp-sm-phone {
        font-size: 1.4em;
    }
}

.see-more {
    gap: 0.6em;
    border-width: 1px;
    border-radius: 7px;

    @include bp-lg-laptop {
        font-size: 1.1em;
    }
}

.external-links {
    &-card {
        display: flex;
        gap: $size-4;
        font-size: 1.1em;

        a:nth-child(3) {
            &:deep(button) svg {
                stroke-width: 0 !important;

                @include theme-dark {
                    fill: lighten-color($color-text-muted, 15%) !important;
                }

                @include theme-light {
                    fill: darken-color($color-text-muted, 15%) !important;
                }
            }
        }
    }

    a {
        &.responsive-link-text {
            &:deep(button) span {
                display: none;

                @include bp-custom-min(600) {
                    display: block !important;
                }
            }
        }

        &:deep(button) {
            @include bp-md-tablet {
                gap: $size-2;
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
                    stroke: darken-color($color-text-muted, 15%);
                }
            }
        }

        &:hover :deep(button) svg {
            @include theme-dark {
                fill: lighten-color($color-text-muted, 15%) !important;
            }

            @include theme-light {
                fill: darken-color($color-text-muted, 15%) !important;
            }
        }
    }
}
</style>
