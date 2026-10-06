<script setup>
import { useId, useTemplateRef } from 'vue';
import { useEventListener, useResizeObserver } from '@vueuse/core';

const props = defineProps({
    href: {
        type: String,
    },
    preset: {
        type: String, // primary, primary-accent, secondary, contact-link
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
    tooltipWhenTextHidden: {
        type: Boolean,
        default: false,
    },
});

const button = useTemplateRef('button');
const label = useTemplateRef('label');
const tooltip = useTemplateRef('tooltip');
const tooltipId = useId();

function showTooltip(event) {
    if (!props.tooltipWhenTextHidden || !props.text || label.value.getClientRects().length) return;
    if (event.pointerType === 'touch') return;
    if (event.type === 'focus' && !event.target.matches(':focus-visible')) return;

    tooltip.value.showPopover();
    positionTooltip();
}

function positionTooltip() {
    if (!tooltip.value?.matches(':popover-open')) return;

    const trigger = button.value.getBoundingClientRect();
    if (label.value.getClientRects().length || trigger.bottom <= 0 || trigger.top >= window.innerHeight) {
        hideTooltip();
        return;
    }

    const { width, height } = tooltip.value.getBoundingClientRect();
    const gutter = 8;
    const below = trigger.top - height - gutter < gutter;
    const left = Math.max(
        gutter,
        Math.min(trigger.left + (trigger.width - width) / 2, document.documentElement.clientWidth - width - gutter),
    );
    const top = below ? trigger.bottom + gutter : trigger.top - height - gutter;

    tooltip.value.classList.toggle('is-below', below);
    tooltip.value.style.left = `${left}px`;
    tooltip.value.style.top = `${Math.min(top, window.innerHeight - height - gutter)}px`;
}

function hideTooltip(event) {
    if (
        event?.type === 'pointerleave' &&
        (button.value.closest(':focus-visible') ||
            button.value.contains(event.relatedTarget) ||
            tooltip.value?.contains(event.relatedTarget))
    )
        return;
    if (event?.type === 'blur' && (button.value.matches(':hover') || tooltip.value?.matches(':hover'))) return;
    tooltip.value?.hidePopover();
}

if (props.tooltipWhenTextHidden) {
    useEventListener(() => button.value?.closest('a'), 'focus', showTooltip);
    useEventListener(() => button.value?.closest('a'), 'blur', hideTooltip);
    useEventListener(window, ['resize', 'scroll'], positionTooltip, { capture: true });
    useResizeObserver(label, positionTooltip);
}
</script>

<template>
    <component
        :is="href ? 'a' : 'button'"
        :href="href"
        ref="button"
        :class="preset"
        :style="{ ...styles }"
        :aria-label="tooltipWhenTextHidden ? text : undefined"
        :aria-describedby="tooltipWhenTextHidden ? tooltipId : undefined"
        @pointerenter="showTooltip"
        @pointerleave="hideTooltip"
        @focus="showTooltip"
        @blur="hideTooltip"
        @click="
            hideTooltip();
            $event.currentTarget.classList.add('is-clicked');
        "
    >
        <component :is="iconLeft" class="icon" />
        <span ref="label" class="button-text">
            {{ text }}
        </span>
        <component :is="iconRight" class="icon" />
        <Teleport v-if="tooltipWhenTextHidden" :to="button?.closest('dialog') ?? 'body'">
            <span
                :id="tooltipId"
                ref="tooltip"
                class="button-tooltip"
                role="tooltip"
                popover="auto"
                data-testid="external-link-tooltip"
                @pointerleave="hideTooltip"
                @click.stop.prevent
            >
                {{ text }}
            </span>
        </Teleport>
    </component>
</template>

<style lang="scss" scoped>
.button-tooltip {
    position: fixed;
    inset: auto;
    width: max-content;
    max-width: calc(100vw - 1rem);
    padding: $space-2 $space-3;
    margin: 0;
    overflow: visible;
    font-family: $secondary-font-stack;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.4;
    color: $color-text-primary;
    text-align: center;
    overflow-wrap: anywhere;
    white-space: normal;
    cursor: default;
    background: $color-bg-primary;
    border: 1px solid $color-text-muted;
    border-radius: $radius-sm;
    box-shadow: 0 4px 12px rgb(0 0 0 / 20%);

    // Keep the tooltip open while the pointer crosses the gap above the button.
    &::after {
        position: absolute;
        right: 0;
        bottom: -9px;
        left: 0;
        height: 9px;
        content: '';
    }

    &.is-below::after {
        top: -9px;
        bottom: auto;
    }

    @media (prefers-reduced-motion: no-preference) {
        transition: opacity 0.12s ease;

        @starting-style {
            &:popover-open {
                opacity: 0;
            }
        }
    }
}

button,
a {
    @include flex-center-all;

    font-family: $primary-font-stack;
    font-size: 1em;
    font-weight: 400;
    background: transparent;

    &.primary {
        gap: $size-2;
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
                right: 2px;
            }
        }

        &:active::after,
        &.is-leaving::after,
        &.is-clicked:not(:hover)::after {
            right: 2px;
            left: calc(100% - 2px);
        }
    }

    &.contact-link {
        transition: transform 0.3s ease;

        &:active {
            transform: scale(0.95);
        }
    }
}
</style>
