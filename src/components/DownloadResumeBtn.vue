<template>
    <a href="files/blank-resume.pdf" download="files/blank-resume.pdf">
        Resume/CV
        <DownloadIcon />
    </a>
</template>

<script setup>
import DownloadIcon from './SVGs/DownloadIcon.vue';
</script>

<style lang="scss" scoped>
a {
    display: flex;
    gap: $size-2;
    align-items: center;
    justify-content: center;
    padding: $size-2 $size-4;
    font-family: $primary-font-stack;
    font-size: 1em;
    font-weight: 400;
    text-decoration: none;
    background: transparent;
    border-radius: 12px;

    svg {
        height: $size-4;
    }

    @include theme-dark {
        color: $color-text-primary;
        border: solid 2px $color-text-primary;

        svg {
            fill: $color-text-primary;
        }
    }

    @include theme-light {
        color: $color-primary-darker;
        border: solid 2px $color-primary-darker;

        svg {
            fill: $color-primary-darker;
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
            }
        }
    }

    &:active {
        transform: scale(0.9);
    }
}
</style>
