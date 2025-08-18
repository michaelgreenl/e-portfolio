<template>
    <button :class="type" @click="onClick()">
        <component :is="iconLeft"></component>
        {{ text }}
        <component :is="iconRight"></component>
    </button>
</template>

<script setup>
defineProps({
    type: {
        type: String, // primary, secondary
    },
    onClick: {
        type: Function,
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
});
</script>

<style lang="scss" scoped>
button {
    display: flex;
    gap: 0.3em;
    align-items: center;
    justify-content: center;
    padding: $size-2 $size-4;
    font-family: $primary-font-stack;
    font-size: 1em;
    font-weight: 400;
    letter-spacing: 0.1ch;
    background: transparent;
    border-radius: 12px;

    svg {
        height: $size-4;
    }

    @include theme-dark {
        color: $color-text-primary;
        border: solid 1px $color-text-primary;

        svg {
            fill: $color-text-primary;
        }
    }

    @include theme-light {
        color: $color-primary-darker;
        border: solid 2px $color-primary-darker;
        font-weight: 500;

        svg {
            fill: $color-primary-darker;
            stroke-width: 1px;
            stroke: $color-primary-darker;
        }
    }

    @include interactive {
        color: $color-bg-primary;

        @include theme-dark {
            background: $color-text-primary;

            svg {
                fill: $color-bg-primary;
            }
        }

        @include theme-light {
            background: $color-primary-darker;

            svg {
                fill: $color-bg-primary;
                stroke: $color-bg-primary;
            }
        }
    }

    &:active {
        transform: scale(0.9);
    }

    &.secondary {
        color: $color-bg-primary;

        @include theme-dark {
            background: $color-text-primary;
        }

        @include theme-light {
            background: $color-primary-darker;
        }
    }
}
</style>
