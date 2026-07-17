<script setup>
defineProps({
    preset: {
        type: String, // primary, primary-accent, secondary
    },
    text: {
        type: String,
    },
    iconLeft: {
        type: Object,
    },
    iconRight: {
        type: Object,
    },
    styles: {
        type: Object,
    },
});
</script>

<template>
    <button :class="preset" :style="{ ...styles }">
        <component :is="iconLeft" class="icon" />
        <span>
            {{ text }}
        </span>
        <component :is="iconRight" class="icon" />
    </button>
</template>

<style lang="scss" scoped>
button {
    @include flex-center-all;

    font-family: $primary-font-stack;
    font-size: 1em;
    font-weight: 400;
    background: transparent;

    &.primary {
        gap: $space-1;
        padding: $space-2 $space-4;
        letter-spacing: 0.1ch;
        border-radius: $radius-md;
        transition: transform 0.3s ease;

        .icon {
            height: $size-4;
        }

        @include theme-dark {
            color: $color-text-primary;
            border: solid 1px $color-text-primary;

            .icon {
                fill: $color-text-primary;
            }
        }

        @include theme-light {
            font-weight: 500;
            color: $color-primary-darker;
            border: solid 2px $color-primary-darker;

            .icon {
                fill: $color-primary-darker;
            }
        }

        @include interactive {
            color: $color-bg-primary;
            transform: scale(1.05);

            @include theme-dark {
                background: $color-text-primary;

                .icon {
                    fill: $color-bg-primary;
                }
            }

            @include theme-light {
                background: $color-primary-darker;

                .icon {
                    fill: $color-bg-primary;
                }
            }
        }

        &:active {
            transform: scale(0.95);
        }

        &.primary-accent {
            color: $color-bg-primary;

            @include theme-dark {
                background: $color-text-primary;
            }

            @include theme-light {
                background: $color-primary-darker;
            }
        }
    }

    &.secondary {
        position: relative;
        gap: $space-2;
        padding: 0;
        border: 0;

        @include theme-dark {
            color: $color-text-primary;
        }

        @include theme-light {
            color: $color-primary-darker;
        }

        .icon {
            width: $size-5;
            height: $size-5;

            @include theme-dark {
                fill: $color-gray6;
            }

            @include theme-light {
                fill: $color-primary-darker;
            }
        }

        &::after {
            position: absolute;
            right: 100%;
            bottom: -6px;
            left: 1.7em;
            height: 1px;
            content: '';
            transition: all 0.3s ease;

            @include theme-dark {
                background-color: $color-gray6;
            }

            @include theme-light {
                background-color: $color-primary-darker;
            }
        }

        @include interactive {
            &::after {
                right: 0;
            }
        }
    }

    &.glass {
        gap: $space-2;
        padding: $space-2 $space-4;
        font-weight: 500;
        color: $color-glass-text;
        background-color: $color-glass-surface;
        border: 1px solid transparent;
        border-top-color: $color-glass-highlight;
        border-bottom-color: $color-glass-shade;
        border-radius: $radius-md;
        box-shadow:
            inset 0 1px 0 $color-glass-highlight,
            inset 0 -1px 0 $color-glass-shade,
            0 2px 5px $color-glass-shadow;
        backdrop-filter: blur(15px) saturate(130%);
        transition:
            background-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;

        .icon {
            height: $size-4;
            fill: currentcolor;
            stroke: currentcolor;
        }

        @include interactive {
            background-color: $color-glass-surface-hover;
            box-shadow:
                inset 0 1px 0 $color-glass-highlight,
                inset 0 -1px 0 $color-glass-shade,
                0 6px 14px $color-glass-shadow;
            transform: translateY(-2px);
        }

        &:active {
            transform: translateY(0) scale(0.98);
        }
    }
}
</style>
