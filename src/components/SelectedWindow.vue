<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { useMediaQuery } from '@vueuse/core';
import { useGsap } from '@/composables/useGsap.js';
import { selectedWindowAnimations } from '@/animations/component/selectedWindow.js';
import CloseIcon from '@/components/SVGs/CloseIcon.vue';

const props = defineProps({
    label: { required: true, type: String },
    fullscreenOnMobile: { type: Boolean, default: false },
    fullscreen: { type: Boolean, default: false },
    showCloseButton: { type: Boolean, default: false },
    trapFocus: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);
const el = ref(null);
const overlay = ref(null);
const closeButton = ref(null);
const windowContent = ref(null);
const isMobile = useMediaQuery('(max-width: 847px)');
const swipeOffset = ref(0);
const isDragging = ref(false);
const { registerAnim } = useGsap();
const showWindow = registerAnim(selectedWindowAnimations.show);
const hideWindow = registerAnim(selectedWindowAnimations.hide);
let scrollPosition;
let isClosing = false;
let trigger;
let swipeStart;

function cancelSwipe() {
    swipeStart = undefined;
    isDragging.value = false;
    swipeOffset.value = 0;
}

function startSwipe(event) {
    cancelSwipe();
    if (
        isClosing ||
        event.touches.length !== 1 ||
        windowContent.value.scrollTop > 0 ||
        event.target.closest('button, a, input, textarea, select, [aria-roledescription="carousel"]') ||
        window.getSelection()?.isCollapsed === false
    ) {
        return;
    }
    const { identifier, clientX, clientY } = event.touches[0];
    swipeStart = { identifier, clientX, clientY };
}

function moveSwipe(event) {
    if (!swipeStart) return;
    const touch = event.touches[0];
    if (event.touches.length !== 1 || touch.identifier !== swipeStart.identifier || !event.cancelable) {
        cancelSwipe();
        return;
    }

    const x = Math.abs(touch.clientX - swipeStart.clientX);
    const y = touch.clientY - swipeStart.clientY;
    if (!isDragging.value) {
        if (Math.max(x, Math.abs(y)) < 8) return;
        if (y <= x || windowContent.value.scrollTop > 0) {
            cancelSwipe();
            return;
        }
        isDragging.value = true;
    }
    event.preventDefault();
    swipeOffset.value = Math.max(0, y);
}

function endSwipe() {
    if (isDragging.value && swipeOffset.value >= 96) {
        swipeStart = undefined;
        isDragging.value = false;
        swipeOffset.value = windowContent.value.clientHeight;
        close();
    } else {
        cancelSwipe();
    }
}

watch(isMobile, cancelSwipe);

onMounted(() => {
    if (props.showCloseButton || props.trapFocus) trigger = document.activeElement;
    if (!document.body.classList.contains('no-scroll')) {
        scrollPosition = window.scrollY;
        document.body.classList.add('no-scroll');
        document.body.style.top = `-${scrollPosition}px`;
    }
    if (props.fullscreen) el.value.showModal();
    showWindow({ targets: [el.value, overlay.value] }).eventCallback('onComplete', () => {
        if (!isClosing) (closeButton.value || el.value).focus({ preventScroll: true });
    });
});

function restoreScroll() {
    if (scrollPosition === undefined) return;

    document.body.classList.remove('no-scroll');
    document.body.style.top = '';
    window.scrollTo(0, scrollPosition);
    scrollPosition = undefined;
}

function close() {
    if (isClosing) return;
    isClosing = true;
    restoreScroll();

    hideWindow({
        targets: [el.value, overlay.value],
        onComplete: () => {
            if (props.fullscreen) el.value.close();
            else el.value.blur();
            emit('close');
            if (trigger?.isConnected) trigger.focus({ preventScroll: true });
        },
    });
}

function keepFocusInside(event) {
    if (props.fullscreen) return;
    if (!props.showCloseButton && !props.trapFocus) return;

    const controls = [
        ...el.value.querySelectorAll('a[href], button, input, select, textarea, iframe, [tabindex]'),
    ].filter((control) => control.tabIndex >= 0 && !control.disabled && control.getClientRects().length);
    const first = controls[0];
    const last = controls.at(-1);

    if (document.activeElement === el.value || document.activeElement === (event.shiftKey ? first : last)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
    }
}

onBeforeUnmount(restoreScroll);
defineExpose({ close });
</script>

<template>
    <component
        :is="fullscreen ? 'dialog' : 'div'"
        ref="el"
        class="selected-container"
        :class="{ 'fullscreen-mobile': fullscreenOnMobile, fullscreen }"
        :tabindex="fullscreen ? -1 : 0"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        @keydown.esc.stop.prevent="close"
        @cancel.prevent="close"
        @keydown.tab="keepFocusInside"
    >
        <div
            ref="windowContent"
            class="selected-window"
            :class="{ 'is-dragging': isDragging }"
            :style="swipeOffset ? { translate: `0 ${swipeOffset}px` } : undefined"
            v-on="
                fullscreenOnMobile && isMobile
                    ? { touchstart: startSwipe, touchmove: moveSwipe, touchend: endSwipe, touchcancel: cancelSwipe }
                    : {}
            "
            @click.self="fullscreen && close()"
        >
            <button
                v-if="showCloseButton"
                ref="closeButton"
                class="window-close-btn"
                type="button"
                aria-label="Close window"
                @click="close"
            >
                <CloseIcon aria-hidden="true" />
            </button>
            <slot />
        </div>

        <div ref="overlay" class="overlay" @click="close"></div>
    </component>
</template>

<style lang="scss" scoped>
:global(.no-scroll) {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.selected-container {
    @include flex-center-all;

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

.overlay {
    position: fixed;
    inset: 0;
    z-index: 1;
    width: 100vw;
    height: 100vh;
}

.selected-window {
    position: relative;
    z-index: 2;
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
        padding: $size-9 $size-12;
    }
}

.window-close-btn {
    @include flex-center-all;

    position: sticky;
    top: env(safe-area-inset-top, 0);
    z-index: 3;
    width: 2.75rem;
    height: 2.75rem;
    padding: $space-3;
    margin-left: auto;
    color: $color-text-secondary;
    background: transparent;
    border: 0;
    border-radius: $radius-round;

    svg {
        width: 100%;
        height: 100%;
        fill: currentcolor;
    }

    &:focus-visible {
        outline: 2px solid $color-primary;
        outline-offset: 2px;
    }

    @include interactive {
        background-color: rgb(73 80 87 / 20%);
    }
}

.fullscreen-mobile {
    @include bp-custom-max(847) {
        inset: 0;
        z-index: 10;
        height: 100dvh;

        .selected-window {
            width: 100%;
            max-width: none;
            height: 100%;
            max-height: none;
            padding: max($space-4, env(safe-area-inset-top)) max($space-4, env(safe-area-inset-right))
                max($space-4, env(safe-area-inset-bottom)) max($space-4, env(safe-area-inset-left));
            margin: 0;
            overscroll-behavior: contain;
            background: $color-bg-primary;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            transition: translate 0.2s ease-out;

            &.is-dragging {
                transition: none;
            }

            @media (prefers-reduced-motion: reduce) {
                transition: none;
            }
        }
    }
}

.fullscreen {
    inset: 0;
    width: 100%;
    max-width: none;
    height: 100dvh;
    max-height: none;
    padding: 0;
    margin: 0;
    background-color: transparent;
    border: 0;

    &::backdrop {
        background: transparent;
    }

    .selected-window {
        display: grid;
        place-items: center;
        width: 100%;
        max-width: none;
        height: 100%;
        max-height: none;
        padding: max(4rem, env(safe-area-inset-top)) max(1.25rem, env(safe-area-inset-right))
            max(2rem, env(safe-area-inset-bottom)) max(1.25rem, env(safe-area-inset-left));
        margin: 0;
        overflow: hidden;
        border: 0;
        border-radius: 0;
        box-shadow: none;

        @include bp-sm-phone {
            padding-inline: max(2.5rem, env(safe-area-inset-left)) max(2.5rem, env(safe-area-inset-right));
        }
    }

    .window-close-btn {
        position: absolute;
        top: max($space-3, env(safe-area-inset-top));
        right: max($space-3, env(safe-area-inset-right));
        width: 2.5rem;
        height: 2.5rem;
    }
}
</style>
