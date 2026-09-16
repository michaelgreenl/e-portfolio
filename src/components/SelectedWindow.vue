<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useGsap } from '@/composables/useGsap.js';
import { selectedWindowAnimations } from '@/animations/component/selectedWindow.js';

defineProps({
    label: { required: true, type: String },
});

const emit = defineEmits(['close']);
const el = ref(null);
const overlay = ref(null);
const { registerAnim } = useGsap();
const showWindow = registerAnim(selectedWindowAnimations.show);
const hideWindow = registerAnim(selectedWindowAnimations.hide);
let scrollPosition;
let isClosing = false;

onMounted(() => {
    scrollPosition = window.scrollY;
    document.body.classList.add('no-scroll');
    document.body.style.top = `-${scrollPosition}px`;
    showWindow({ targets: [el.value, overlay.value] }).eventCallback('onComplete', () => {
        if (!isClosing) el.value.focus({ preventScroll: true });
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
            el.value.blur();
            emit('close');
        },
    });
}

onBeforeUnmount(restoreScroll);
defineExpose({ close });
</script>

<template>
    <div
        ref="el"
        class="selected-container"
        tabindex="0"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        @keydown.esc="close"
    >
        <div class="selected-window">
            <slot />
        </div>

        <div ref="overlay" class="overlay" @click="close"></div>
    </div>
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
</style>
