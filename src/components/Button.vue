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
                fill: lighten-color($color-gray6, 5%);
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
}
</style>
